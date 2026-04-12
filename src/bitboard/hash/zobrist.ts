/**
 * Zobrist hashing for fast position identification
 * Used for repetition detection and transposition table
 */

import { Color, Piece, CountType } from "common/const"
import type { Countdown } from "common/types"
import type { Board, Move } from "bitboard/types"
import { getLSB } from "bitboard/board/board"

const PIECE_INDEX: Record<Piece, number> = {
    [Piece.BIA]: 0,
    [Piece.FLIPPED_BIA]: 1,
    [Piece.MA]: 2,
    [Piece.THON]: 3,
    [Piece.MET]: 4,
    [Piece.RUA]: 5,
    [Piece.KHUN]: 6,
}

/** xorshift64* PRNG algorithm */
function xorshift64(state: bigint): bigint {
    state ^= state >> 12n
    state ^= state << 25n
    state ^= state >> 27n
    return state * 0x2545F4914F6CDD1Dn
}

/** Generate all Zobrist keys with a fixed seed for reproducibility */
function generateZobristKeys(): {
    pieces: bigint[][]
    side: bigint
    countdown: bigint[][][]
} {
    let state = 0x12345678ABCDEFn
    const pieces: bigint[][] = []

    // 7 piece types × 2 colors × 64 squares = 896 keys
    for (let pieceColorIndex = 0; pieceColorIndex < 14; pieceColorIndex++) {
        pieces[pieceColorIndex] = []
        for (let square = 0; square < 64; square++) {
            state = xorshift64(state)
            pieces[pieceColorIndex][square] = state & 0xFFFFFFFFFFFFFFFFn
        }
    }

    state = xorshift64(state)
    const side = state & 0xFFFFFFFFFFFFFFFFn

    // Countdown keys: [colorIdx 0/1][typeIdx 0/1][count 0..63] (count is 1-indexed so idx = count-1)
    const countdown: bigint[][][] = Array.from({ length: 2 }, () =>
        Array.from({ length: 2 }, () => new Array<bigint>(64))
    )
    for (let c = 0; c < 2; c++) {
        for (let t = 0; t < 2; t++) {
            for (let cnt = 0; cnt < 64; cnt++) {
                state = xorshift64(state)
                countdown[c][t][cnt] = state & 0xFFFFFFFFFFFFFFFFn
            }
        }
    }

    return { pieces, side, countdown }
}

const { pieces: ZOBRIST_PIECES, side: ZOBRIST_SIDE, countdown: ZOBRIST_COUNTDOWN } = generateZobristKeys()

function getPieceColorIndex(color: Color, piece: Piece): number {
    const colorOffset = color === Color.WHITE ? 0 : 1
    return PIECE_INDEX[piece] * 2 + colorOffset
}

function getCountdownHash(countdown: Countdown): bigint {
    const colorIdx = countdown.countColor === Color.WHITE ? 0 : 1
    const typeIdx = countdown.countType === CountType.PIECE_POWER_COUNTDOWN ? 0 : 1
    // count is 1-based; clamp to 64 and convert to 0-indexed
    const countIdx = Math.min(countdown.count, 64) - 1
    return ZOBRIST_COUNTDOWN[colorIdx][typeIdx][countIdx]
}

/** Compute the full Zobrist hash for a board position */
export function computeHash(board: Board, turn: Color, countdown: Countdown | null = null): bigint {
    let hash = 0n

    const hashPieces = (bitboard: bigint, pieceColorIndex: number) => {
        let bb = bitboard
        while (bb !== 0n) {
            const square = getLSB(bb)
            hash ^= ZOBRIST_PIECES[pieceColorIndex][square]
            bb &= bb - 1n
        }
    }

    hashPieces(board.whiteBia, PIECE_INDEX[Piece.BIA] * 2 + 0)
    hashPieces(board.whiteFlippedBia, PIECE_INDEX[Piece.FLIPPED_BIA] * 2 + 0)
    hashPieces(board.whiteMa, PIECE_INDEX[Piece.MA] * 2 + 0)
    hashPieces(board.whiteThon, PIECE_INDEX[Piece.THON] * 2 + 0)
    hashPieces(board.whiteMet, PIECE_INDEX[Piece.MET] * 2 + 0)
    hashPieces(board.whiteRua, PIECE_INDEX[Piece.RUA] * 2 + 0)
    hashPieces(board.whiteKhun, PIECE_INDEX[Piece.KHUN] * 2 + 0)

    hashPieces(board.blackBia, PIECE_INDEX[Piece.BIA] * 2 + 1)
    hashPieces(board.blackFlippedBia, PIECE_INDEX[Piece.FLIPPED_BIA] * 2 + 1)
    hashPieces(board.blackMa, PIECE_INDEX[Piece.MA] * 2 + 1)
    hashPieces(board.blackThon, PIECE_INDEX[Piece.THON] * 2 + 1)
    hashPieces(board.blackMet, PIECE_INDEX[Piece.MET] * 2 + 1)
    hashPieces(board.blackRua, PIECE_INDEX[Piece.RUA] * 2 + 1)
    hashPieces(board.blackKhun, PIECE_INDEX[Piece.KHUN] * 2 + 1)

    if (turn === Color.BLACK) {
        hash ^= ZOBRIST_SIDE
    }

    if (countdown) {
        hash ^= getCountdownHash(countdown)
    }

    return hash
}

/** Update hash for a move, optionally reflecting countdown state changes */
export function updateHashForMove(
    hash: bigint,
    move: Move,
    oldCountdown: Countdown | null = null,
    newCountdown: Countdown | null = null
): bigint {
    let newHash = hash

    // Remove piece from source square
    newHash ^= ZOBRIST_PIECES[getPieceColorIndex(move.color, move.piece)][move.from]

    // Remove captured piece (if any)
    if (move.captured) {
        const capturedColor = move.color === Color.WHITE ? Color.BLACK : Color.WHITE
        newHash ^= ZOBRIST_PIECES[getPieceColorIndex(capturedColor, move.captured)][move.to]
    }

    // Add piece (or promoted piece) to destination
    const destPiece = move.promotion ?? move.piece
    newHash ^= ZOBRIST_PIECES[getPieceColorIndex(move.color, destPiece)][move.to]

    // Toggle side to move
    newHash ^= ZOBRIST_SIDE

    // XOR out old countdown, XOR in new countdown
    if (oldCountdown) {
        newHash ^= getCountdownHash(oldCountdown)
    }
    if (newCountdown) {
        newHash ^= getCountdownHash(newCountdown)
    }

    return newHash
}
