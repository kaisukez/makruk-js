/**
 * FEN import for bitboard representation
 */

import type { Game } from "bitboard/types"
import { createEmptyBoard, setPiece } from "bitboard/board/board"
import { Color, Piece, INITIAL_FEN, EMPTY_FEN } from "common/const"
import { parseFen } from "common/fen"
import { computeHash } from "bitboard/hash"

export { INITIAL_FEN, EMPTY_FEN } from "common/const"

/**
 * Piece symbol to Piece enum mapping (Makruk notation)
 */
const PIECE_SYMBOLS: Record<string, [Color, Piece]> = {
    'B': [Color.WHITE, Piece.BIA],
    'F': [Color.WHITE, Piece.FLIPPED_BIA],
    'M': [Color.WHITE, Piece.MA],
    'T': [Color.WHITE, Piece.THON],
    'E': [Color.WHITE, Piece.MET],
    'R': [Color.WHITE, Piece.RUA],
    'K': [Color.WHITE, Piece.KHUN],
    'b': [Color.BLACK, Piece.BIA],
    'f': [Color.BLACK, Piece.FLIPPED_BIA],
    'm': [Color.BLACK, Piece.MA],
    't': [Color.BLACK, Piece.THON],
    'e': [Color.BLACK, Piece.MET],
    'r': [Color.BLACK, Piece.RUA],
    'k': [Color.BLACK, Piece.KHUN],
}

export function createGameFromFen(fen: string): Game {
    const fenInfo = parseFen(fen)
    const { boardString, turn, moveNumber, countdown } = fenInfo

    const board = createEmptyBoard()

    const ranks = boardString.split('/')
    let square = 56

    for (const rank of ranks) {
        let file = 0

        for (const char of rank) {
            if (char >= '1' && char <= '8') {
                const emptyCount = parseInt(char, 10)
                file += emptyCount
            } else {
                const pieceInfo = PIECE_SYMBOLS[char]
                if (pieceInfo) {
                    const [color, piece] = pieceInfo
                    const boardSquare = square + file
                    setPiece(board, color, piece, boardSquare)
                }
                file++
            }
        }

        square -= 8
    }

    const hash = computeHash(board, turn)
    const positionOccurrence = new Map<bigint, number>()
    positionOccurrence.set(hash, 1)

    return {
        board,
        turn,
        moveNumber,
        countdown,
        hash,
        positionOccurrence,
    }
}

/**
 * Create initial game state
 */
export function createInitialState(): Game {
    return createGameFromFen(INITIAL_FEN)
}
