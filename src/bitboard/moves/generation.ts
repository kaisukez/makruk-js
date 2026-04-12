import type { Mask64, Board } from "bitboard/board/board"
import { Color, Piece } from "common/const"
import type { Move } from "bitboard/types"
import {
    EMPTY_MASK,
    FULL_MASK,
    popLSB,
    getPieceAt,
    RANK_6,
    RANK_3,
} from "bitboard/board/board"
import {
    getKnightAttacks,
    getKingAttacks,
    getDiagonalAttacks,
    getPawnAttacks,
    getPawnMoves,
    getRookAttacks,
} from "bitboard/rules/attacks"
import { applyMove } from "bitboard/moves/execution"

export function generatePseudoLegalMoves(
    state: Board,
    color: Color
): Move[] {
    const moves: Move[] = []
    const isWhite = color === Color.WHITE
    const friendly = isWhite ? state.whiteOccupancy : state.blackOccupancy
    const enemy = isWhite ? state.blackOccupancy : state.whiteOccupancy
    const targetMask = FULL_MASK ^ friendly

    generateBiaMoves(state, color, enemy, moves, false)
    generateFlippedBiaMoves(state, color, targetMask, moves)
    generateMaMoves(state, color, targetMask, moves)
    generateThonMoves(state, color, targetMask, moves)
    generateMetMoves(state, color, targetMask, moves)
    generateRuaMoves(state, color, targetMask, moves)
    generateKhunMoves(state, color, targetMask, moves)

    return moves
}

/**
 * Generate only captures (moves to enemy-occupied squares) without legality check.
 * Reuses the same per-piece helpers as generatePseudoLegalMoves.
 */
export function generatePseudoLegalCaptures(state: Board, color: Color): Move[] {
    const captures: Move[] = []
    const isWhite = color === Color.WHITE
    const enemy = isWhite ? state.blackOccupancy : state.whiteOccupancy

    generateBiaMoves(state, color, enemy, captures, true)
    generateFlippedBiaMoves(state, color, enemy, captures)
    generateMaMoves(state, color, enemy, captures)
    generateThonMoves(state, color, enemy, captures)
    generateMetMoves(state, color, enemy, captures)
    generateRuaMoves(state, color, enemy, captures)
    generateKhunMoves(state, color, enemy, captures)

    return captures
}

function generateBiaMoves(
    state: Board,
    color: Color,
    enemy: Mask64,
    moves: Move[],
    capturesOnly: boolean
): void {
    const isWhite = color === Color.WHITE
    let pawns = isWhite ? state.whiteBia : state.blackBia
    const allOccupancy = state.allOccupancy
    const promotionRank = isWhite ? RANK_6 : RANK_3

    while (pawns !== EMPTY_MASK) {
        const { bb, square } = popLSB(pawns)
        pawns = bb

        if (!capturesOnly) {
            // Pawn moves (non-captures)
            let pawnMoves = getPawnMoves(square, isWhite) & (FULL_MASK ^ allOccupancy)

            while (pawnMoves !== EMPTY_MASK) {
                const { bb: remaining, square: toSquare } = popLSB(pawnMoves)
                pawnMoves = remaining

                const toBit = 1n << BigInt(toSquare)
                const shouldPromote = (toBit & promotionRank) !== EMPTY_MASK

                if (shouldPromote) {
                    moves.push({ from: square, to: toSquare, piece: Piece.BIA, color, promotion: Piece.FLIPPED_BIA })
                } else {
                    moves.push({ from: square, to: toSquare, piece: Piece.BIA, color })
                }
            }
        }

        // Pawn captures
        let pawnAttacks = getPawnAttacks(square, isWhite) & enemy

        while (pawnAttacks !== EMPTY_MASK) {
            const { bb: remaining, square: toSquare } = popLSB(pawnAttacks)
            pawnAttacks = remaining

            const capturedPiece = getPieceAt(state, toSquare)
            const toBit = 1n << BigInt(toSquare)
            const shouldPromote = (toBit & promotionRank) !== EMPTY_MASK

            if (shouldPromote) {
                moves.push({ from: square, to: toSquare, piece: Piece.BIA, color, captured: capturedPiece?.[1], promotion: Piece.FLIPPED_BIA })
            } else {
                moves.push({ from: square, to: toSquare, piece: Piece.BIA, color, captured: capturedPiece?.[1] })
            }
        }
    }
}

/**
 * Generate FlippedBia (Promoted Pawn) moves
 * Moves one square diagonally (like Ferz)
 */
function generateFlippedBiaMoves(
    state: Board,
    color: Color,
    targetMask: Mask64,
    moves: Move[]
): void {
    const isWhite = color === Color.WHITE
    let pieces = isWhite ? state.whiteFlippedBia : state.blackFlippedBia

    while (pieces !== EMPTY_MASK) {
        const { bb, square } = popLSB(pieces)
        pieces = bb

        let attacks = getDiagonalAttacks(square) & targetMask

        while (attacks !== EMPTY_MASK) {
            const { bb: remaining, square: toSquare } = popLSB(attacks)
            attacks = remaining

            moves.push({ from: square, to: toSquare, piece: Piece.FLIPPED_BIA, color, captured: getPieceAt(state, toSquare)?.[1] })
        }
    }
}

/**
 * Generate Ma (Knight) moves
 */
function generateMaMoves(
    state: Board,
    color: Color,
    targetMask: Mask64,
    moves: Move[]
): void {
    const isWhite = color === Color.WHITE
    let knights = isWhite ? state.whiteMa : state.blackMa

    while (knights !== EMPTY_MASK) {
        const { bb, square } = popLSB(knights)
        knights = bb

        let attacks = getKnightAttacks(square) & targetMask

        while (attacks !== EMPTY_MASK) {
            const { bb: remaining, square: toSquare } = popLSB(attacks)
            attacks = remaining

            moves.push({ from: square, to: toSquare, piece: Piece.MA, color, captured: getPieceAt(state, toSquare)?.[1] })
        }
    }
}

/**
 * Generate Thon (Makruk Bishop) moves
 * Moves one square diagonally AND one square forward
 */
function generateThonMoves(
    state: Board,
    color: Color,
    targetMask: Mask64,
    moves: Move[]
): void {
    const isWhite = color === Color.WHITE
    let bishops = isWhite ? state.whiteThon : state.blackThon

    while (bishops !== EMPTY_MASK) {
        const { bb, square } = popLSB(bishops)
        bishops = bb

        let attacks = getDiagonalAttacks(square) & targetMask

        // Add forward square if it's within the target mask
        const forwardSquare = square + (isWhite ? 8 : -8)
        if (forwardSquare >= 0 && forwardSquare < 64) {
            const forwardBit = 1n << BigInt(forwardSquare)
            if ((forwardBit & targetMask) !== EMPTY_MASK) {
                attacks |= forwardBit
            }
        }

        while (attacks !== EMPTY_MASK) {
            const { bb: remaining, square: toSquare } = popLSB(attacks)
            attacks = remaining

            moves.push({ from: square, to: toSquare, piece: Piece.THON, color, captured: getPieceAt(state, toSquare)?.[1] })
        }
    }
}

/**
 * Generate Met (Makruk Queen) moves
 * Moves one square diagonally (like Ferz)
 */
function generateMetMoves(
    state: Board,
    color: Color,
    targetMask: Mask64,
    moves: Move[]
): void {
    const isWhite = color === Color.WHITE
    let queens = isWhite ? state.whiteMet : state.blackMet

    while (queens !== EMPTY_MASK) {
        const { bb, square } = popLSB(queens)
        queens = bb

        let attacks = getDiagonalAttacks(square) & targetMask

        while (attacks !== EMPTY_MASK) {
            const { bb: remaining, square: toSquare } = popLSB(attacks)
            attacks = remaining

            moves.push({ from: square, to: toSquare, piece: Piece.MET, color, captured: getPieceAt(state, toSquare)?.[1] })
        }
    }
}

/**
 * Generate Rua (Rook) moves
 */
function generateRuaMoves(
    state: Board,
    color: Color,
    targetMask: Mask64,
    moves: Move[]
): void {
    const isWhite = color === Color.WHITE
    let rooks = isWhite ? state.whiteRua : state.blackRua

    while (rooks !== EMPTY_MASK) {
        const { bb, square } = popLSB(rooks)
        rooks = bb

        let attacks = getRookAttacks(square, state.allOccupancy) & targetMask

        while (attacks !== EMPTY_MASK) {
            const { bb: remaining, square: toSquare } = popLSB(attacks)
            attacks = remaining

            moves.push({ from: square, to: toSquare, piece: Piece.RUA, color, captured: getPieceAt(state, toSquare)?.[1] })
        }
    }
}

/**
 * Generate Khun (King) moves
 */
function generateKhunMoves(
    state: Board,
    color: Color,
    targetMask: Mask64,
    moves: Move[]
): void {
    const isWhite = color === Color.WHITE
    let kings = isWhite ? state.whiteKhun : state.blackKhun

    while (kings !== EMPTY_MASK) {
        const { bb, square } = popLSB(kings)
        kings = bb

        let attacks = getKingAttacks(square) & targetMask

        while (attacks !== EMPTY_MASK) {
            const { bb: remaining, square: toSquare } = popLSB(attacks)
            attacks = remaining

            moves.push({ from: square, to: toSquare, piece: Piece.KHUN, color, captured: getPieceAt(state, toSquare)?.[1] })
        }
    }
}

export function isSquareAttacked(
    state: Board,
    square: number,
    attackerColor: Color
): boolean {
    const isWhite = attackerColor === Color.WHITE

    // Check pawn attacks
    const pawnAttackers = getPawnAttacks(square, !isWhite)
    const pawns = isWhite ? state.whiteBia : state.blackBia
    if ((pawns & pawnAttackers) !== EMPTY_MASK) return true

    // Check flipped bia attacks (diagonal)
    const diagAttacks = getDiagonalAttacks(square)
    const flippedBias = isWhite ? state.whiteFlippedBia : state.blackFlippedBia
    if ((flippedBias & diagAttacks) !== EMPTY_MASK) return true

    // Check knight attacks
    const knightAttackers = getKnightAttacks(square)
    const knights = isWhite ? state.whiteMa : state.blackMa
    if ((knights & knightAttackers) !== EMPTY_MASK) return true

    // Check Thon attacks (one square diagonal + one square forward)
    const thons = isWhite ? state.whiteThon : state.blackThon
    if ((thons & diagAttacks) !== EMPTY_MASK) return true

    // Thon can also attack one square forward
    // White Thon at square-8 attacks square by moving north; Black Thon at square+8 attacks by moving south
    const thonForwardOffset = isWhite ? -8 : 8
    const thonAttackerSquare = square + thonForwardOffset
    if (thonAttackerSquare >= 0 && thonAttackerSquare < 64) {
        const thonAttackerBit = 1n << BigInt(thonAttackerSquare)
        if ((thons & thonAttackerBit) !== EMPTY_MASK) return true
    }

    // Check Met attacks (one square diagonal)
    const mets = isWhite ? state.whiteMet : state.blackMet
    if ((mets & diagAttacks) !== EMPTY_MASK) return true

    // Check rook attacks
    const rookAttackers = getRookAttacks(square, state.allOccupancy)
    const rooks = isWhite ? state.whiteRua : state.blackRua
    if ((rooks & rookAttackers) !== EMPTY_MASK) return true

    // Check king attacks
    const kingAttackers = getKingAttacks(square)
    const kings = isWhite ? state.whiteKhun : state.blackKhun
    if ((kings & kingAttackers) !== EMPTY_MASK) return true

    return false
}

/**
 * Generate all legal moves (filters out moves that leave king in check)
 */
export function generateLegalMoves(
    state: Board,
    color: Color
): Move[] {
    const pseudoLegalMoves = generatePseudoLegalMoves(state, color)
    const legalMoves: Move[] = []
    const isWhite = color === Color.WHITE
    const enemyColor = isWhite ? Color.BLACK : Color.WHITE

    for (const move of pseudoLegalMoves) {
        const newState = applyMove(state, move)
        const kingMask = isWhite ? newState.whiteKhun : newState.blackKhun
        if (kingMask === EMPTY_MASK) continue
        if (!isSquareAttacked(newState, popLSB(kingMask).square, enemyColor)) {
            legalMoves.push(move)
        }
    }

    return legalMoves
}

/**
 * Generate legal captures only (pseudo-legal captures filtered for legality).
 * Used by quiescence search to avoid generating all moves.
 */
export function generateLegalCaptures(state: Board, color: Color): Move[] {
    const pseudoCaptures = generatePseudoLegalCaptures(state, color)
    const isWhite = color === Color.WHITE
    const enemyColor = isWhite ? Color.BLACK : Color.WHITE

    return pseudoCaptures.filter(move => {
        const newState = applyMove(state, move)
        const kingMask = isWhite ? newState.whiteKhun : newState.blackKhun
        if (kingMask === EMPTY_MASK) return false
        const { square: kingSquare } = popLSB(kingMask)
        return !isSquareAttacked(newState, kingSquare, enemyColor)
    })
}
