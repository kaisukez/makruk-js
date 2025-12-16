/**
 * Position evaluation for bitboard representation
 *
 * This is an optimized version that removes expensive legal move generation
 * and uses piece-square tables and simple heuristics instead.
 */

import type { Bitboard, BitboardState } from "bitboard/board/board"
import { Color, Piece, PIECE_POWER } from "common/const"
import { EMPTY_BITBOARD, popLSB, popCount } from "bitboard/board/board"
import { generateLegalMoves } from "bitboard/moves"

// Piece-square table for positional evaluation
// Higher values for central squares
const PIECE_SQUARE_TABLE = new Float64Array([
    // Rank 1 (a1-h1)
    0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00,
    // Rank 2 (a2-h2)
    0.00, 0.16, 0.16, 0.16, 0.16, 0.16, 0.16, 0.00,
    // Rank 3 (a3-h3)
    0.00, 0.16, 0.32, 0.32, 0.32, 0.32, 0.16, 0.00,
    // Rank 4 (a4-h4)
    0.00, 0.16, 0.32, 0.48, 0.48, 0.32, 0.16, 0.00,
    // Rank 5 (a5-h5)
    0.00, 0.16, 0.32, 0.48, 0.48, 0.32, 0.16, 0.00,
    // Rank 6 (a6-h6)
    0.00, 0.16, 0.32, 0.32, 0.32, 0.32, 0.16, 0.00,
    // Rank 7 (a7-h7)
    0.00, 0.16, 0.16, 0.16, 0.16, 0.16, 0.16, 0.00,
    // Rank 8 (a8-h8)
    0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00,
])

/**
 * Evaluate a single bitboard with piece values and position scores
 */
function evaluateBitboard(bb: Bitboard, pieceValue: number, colorMultiplier: number): number {
    let score = 0
    let tempBB = bb

    while (tempBB !== EMPTY_BITBOARD) {
        const { bb: newBB, square } = popLSB(tempBB)
        tempBB = newBB

        // Add piece material value + position value
        score += (pieceValue + PIECE_SQUARE_TABLE[square]) * colorMultiplier
    }

    return score
}

/**
 * Fast evaluation without legal move generation
 * Uses material + piece-square tables only
 */
export function evaluateFast(state: BitboardState): number {
    let score = 0

    // White pieces (positive score)
    score += evaluateBitboard(state.whiteBia, PIECE_POWER[Piece.BIA], 1)
    score += evaluateBitboard(state.whiteFlippedBia, PIECE_POWER[Piece.FLIPPED_BIA], 1)
    score += evaluateBitboard(state.whiteMa, PIECE_POWER[Piece.MA], 1)
    score += evaluateBitboard(state.whiteThon, PIECE_POWER[Piece.THON], 1)
    score += evaluateBitboard(state.whiteMet, PIECE_POWER[Piece.MET], 1)
    score += evaluateBitboard(state.whiteRua, PIECE_POWER[Piece.RUA], 1)
    score += evaluateBitboard(state.whiteKhun, PIECE_POWER[Piece.KHUN], 1)

    // Black pieces (negative score)
    score += evaluateBitboard(state.blackBia, PIECE_POWER[Piece.BIA], -1)
    score += evaluateBitboard(state.blackFlippedBia, PIECE_POWER[Piece.FLIPPED_BIA], -1)
    score += evaluateBitboard(state.blackMa, PIECE_POWER[Piece.MA], -1)
    score += evaluateBitboard(state.blackThon, PIECE_POWER[Piece.THON], -1)
    score += evaluateBitboard(state.blackMet, PIECE_POWER[Piece.MET], -1)
    score += evaluateBitboard(state.blackRua, PIECE_POWER[Piece.RUA], -1)
    score += evaluateBitboard(state.blackKhun, PIECE_POWER[Piece.KHUN], -1)

    return score
}

/**
 * Evaluation with mobility (includes legal move generation)
 * This is slower but more accurate
 */
export function evaluateWithMobility(state: BitboardState, turn: Color): number {
    let score = evaluateFast(state)

    // Add mobility bonus (number of legal moves)
    const whiteMoves = generateLegalMoves(state, Color.WHITE).length
    const blackMoves = generateLegalMoves(state, Color.BLACK).length

    score += 0.02 * whiteMoves
    score -= 0.02 * blackMoves

    return score
}

/**
 * Check if position is a draw
 * Simple heuristic: insufficient material
 */
export function isDraw(state: BitboardState): boolean {
    // Count total pieces
    const totalPieces = popCount(state.allOccupancy)

    // If only kings remain, it's a draw
    if (totalPieces <= 2) {
        return true
    }

    // More sophisticated draw detection can be added here
    // (e.g., same position 3 times, 50-move rule, etc.)

    return false
}

/**
 * Check if position is checkmate for the current player
 */
export function isCheckmate(state: BitboardState, turn: Color): boolean {
    const legalMoves = generateLegalMoves(state, turn)

    if (legalMoves.length > 0) {
        return false
    }

    // No legal moves - check if in check
    // If king is in check and no legal moves = checkmate
    // If king is not in check and no legal moves = stalemate
    // For now, we'll consider no legal moves as checkmate
    // (proper check detection would be needed for stalemate)

    return true
}

/**
 * Full evaluation (used for leaf nodes in search)
 * Checks for terminal positions first, then evaluates
 */
export function evaluate(state: BitboardState, turn: Color, useFullEval: boolean = false): number {
    // Check for draw
    if (isDraw(state)) {
        return 0
    }

    // Check for checkmate
    const legalMoves = generateLegalMoves(state, turn)
    if (legalMoves.length === 0) {
        // Checkmate - current player loses
        return turn === Color.WHITE ? -Infinity : Infinity
    }

    // Use fast evaluation (material + position only)
    if (!useFullEval) {
        return evaluateFast(state)
    }

    // Full evaluation with mobility
    let score = evaluateFast(state)

    // Add mobility bonus
    const opponentTurn = turn === Color.WHITE ? Color.BLACK : Color.WHITE
    const opponentMoves = generateLegalMoves(state, opponentTurn).length

    if (turn === Color.WHITE) {
        score += 0.02 * legalMoves.length
        score -= 0.02 * opponentMoves
    } else {
        score -= 0.02 * legalMoves.length
        score += 0.02 * opponentMoves
    }

    return score
}

/**
 * Quiescence search evaluation (only considers captures)
 * Used to avoid horizon effect in alpha-beta search
 */
export function evaluateQuiet(state: BitboardState, turn: Color): number {
    // For now, just use fast evaluation
    // In a full implementation, this would do quiescence search
    return evaluateFast(state)
}
