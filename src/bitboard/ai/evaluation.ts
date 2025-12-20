/**
 * Position evaluation for bitboard representation
 *
 * Features:
 * - Material counting with Makruk piece values
 * - Piece-square tables for positional play
 * - King safety evaluation
 * - Pawn advancement bonus
 */

import type { Mask64, Board } from "bitboard/board/board"
import { Color, Piece, PIECE_POWER } from "common/const"
import { generateLegalMoves } from "bitboard/moves/generation"
import { EMPTY_MASK, popLSB, popCount, getLSB } from "bitboard/board/board"

// Center control bonus (d4, e4, d5, e5 area)
const CENTER_MASK = 0x0000001818000000n

// Piece-square table for general pieces (center preference)
const GENERAL_PST = new Float64Array([
    // Rank 1 (a1-h1) - back rank
    0.00, 0.05, 0.05, 0.10, 0.10, 0.05, 0.05, 0.00,
    // Rank 2 (a2-h2)
    0.05, 0.10, 0.15, 0.20, 0.20, 0.15, 0.10, 0.05,
    // Rank 3 (a3-h3)
    0.05, 0.15, 0.25, 0.30, 0.30, 0.25, 0.15, 0.05,
    // Rank 4 (a4-h4) - center
    0.10, 0.20, 0.30, 0.40, 0.40, 0.30, 0.20, 0.10,
    // Rank 5 (a5-h5) - center
    0.10, 0.20, 0.30, 0.40, 0.40, 0.30, 0.20, 0.10,
    // Rank 6 (a6-h6)
    0.05, 0.15, 0.25, 0.30, 0.30, 0.25, 0.15, 0.05,
    // Rank 7 (a7-h7)
    0.05, 0.10, 0.15, 0.20, 0.20, 0.15, 0.10, 0.05,
    // Rank 8 (a8-h8) - back rank
    0.00, 0.05, 0.05, 0.10, 0.10, 0.05, 0.05, 0.00,
])

// Pawn (Bia) advancement table for white (flip for black)
// Pawns are more valuable as they advance toward promotion
const WHITE_BIA_PST = new Float64Array([
    // Rank 1 - shouldn't be here
    0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00,
    // Rank 2 - shouldn't be here
    0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00,
    // Rank 3 - starting position
    0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00,
    // Rank 4 - advanced one
    0.10, 0.10, 0.15, 0.20, 0.20, 0.15, 0.10, 0.10,
    // Rank 5 - good advancement
    0.15, 0.15, 0.20, 0.30, 0.30, 0.20, 0.15, 0.15,
    // Rank 6 - near promotion (rank 6 = promotes)
    0.30, 0.30, 0.40, 0.50, 0.50, 0.40, 0.30, 0.30,
    // Rank 7 - shouldn't reach (promotes at rank 6)
    0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00,
    // Rank 8 - shouldn't reach
    0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00,
])

// Black pawn table (mirrored)
const BLACK_BIA_PST = new Float64Array([
    0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00,
    0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00,
    0.30, 0.30, 0.40, 0.50, 0.50, 0.40, 0.30, 0.30,
    0.15, 0.15, 0.20, 0.30, 0.30, 0.20, 0.15, 0.15,
    0.10, 0.10, 0.15, 0.20, 0.20, 0.15, 0.10, 0.10,
    0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00,
    0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00,
    0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00,
])

// King safety - prefer edges in opening/middlegame, center in endgame
const KING_SAFETY_PST = new Float64Array([
    // Rank 1 - safe corners
    0.20, 0.30, 0.10, 0.00, 0.00, 0.10, 0.30, 0.20,
    // Rank 2
    0.20, 0.20, 0.00, -0.10, -0.10, 0.00, 0.20, 0.20,
    // Rank 3-6 - exposed
    0.00, 0.00, -0.10, -0.20, -0.20, -0.10, 0.00, 0.00,
    -0.10, -0.10, -0.20, -0.30, -0.30, -0.20, -0.10, -0.10,
    -0.10, -0.10, -0.20, -0.30, -0.30, -0.20, -0.10, -0.10,
    0.00, 0.00, -0.10, -0.20, -0.20, -0.10, 0.00, 0.00,
    // Rank 7
    0.20, 0.20, 0.00, -0.10, -0.10, 0.00, 0.20, 0.20,
    // Rank 8 - safe corners
    0.20, 0.30, 0.10, 0.00, 0.00, 0.10, 0.30, 0.20,
])

/**
 * Evaluate a bitboard with piece values and piece-square table
 */
function evaluateWithPST(bb: Mask64, pieceValue: number, pst: Float64Array, colorMultiplier: number): number {
    let score = 0
    let temp = bb

    while (temp !== EMPTY_MASK) {
        const { bb: remaining, square } = popLSB(temp)
        temp = remaining
        score += (pieceValue + pst[square]) * colorMultiplier
    }

    return score
}

/**
 * Fast evaluation - material + piece-square tables
 * This is the main evaluation used during search
 */
export function evaluateFast(state: Board): number {
    let score = 0

    // Material count (using popCount for efficiency)
    const whiteBiaCount = popCount(state.whiteBia)
    const whiteFlippedCount = popCount(state.whiteFlippedBia)
    const whiteMaCount = popCount(state.whiteMa)
    const whiteThonCount = popCount(state.whiteThon)
    const whiteMetCount = popCount(state.whiteMet)
    const whiteRuaCount = popCount(state.whiteRua)

    const blackBiaCount = popCount(state.blackBia)
    const blackFlippedCount = popCount(state.blackFlippedBia)
    const blackMaCount = popCount(state.blackMa)
    const blackThonCount = popCount(state.blackThon)
    const blackMetCount = popCount(state.blackMet)
    const blackRuaCount = popCount(state.blackRua)

    // Material score
    score += (whiteBiaCount - blackBiaCount) * PIECE_POWER[Piece.BIA]
    score += (whiteFlippedCount - blackFlippedCount) * PIECE_POWER[Piece.FLIPPED_BIA]
    score += (whiteMaCount - blackMaCount) * PIECE_POWER[Piece.MA]
    score += (whiteThonCount - blackThonCount) * PIECE_POWER[Piece.THON]
    score += (whiteMetCount - blackMetCount) * PIECE_POWER[Piece.MET]
    score += (whiteRuaCount - blackRuaCount) * PIECE_POWER[Piece.RUA]

    // Positional bonuses using piece-square tables
    // Bia (pawns) - advancement bonus
    score += evaluateWithPST(state.whiteBia, 0, WHITE_BIA_PST, 1)
    score += evaluateWithPST(state.blackBia, 0, BLACK_BIA_PST, -1)

    // Flipped Bia - center control
    score += evaluateWithPST(state.whiteFlippedBia, 0, GENERAL_PST, 1)
    score += evaluateWithPST(state.blackFlippedBia, 0, GENERAL_PST, -1)

    // Ma (knights) - center control
    score += evaluateWithPST(state.whiteMa, 0, GENERAL_PST, 1)
    score += evaluateWithPST(state.blackMa, 0, GENERAL_PST, -1)

    // Thon - center control
    score += evaluateWithPST(state.whiteThon, 0, GENERAL_PST, 1)
    score += evaluateWithPST(state.blackThon, 0, GENERAL_PST, -1)

    // Met - center control
    score += evaluateWithPST(state.whiteMet, 0, GENERAL_PST, 1)
    score += evaluateWithPST(state.blackMet, 0, GENERAL_PST, -1)

    // Rua - slight center preference
    score += evaluateWithPST(state.whiteRua, 0, GENERAL_PST, 0.5)
    score += evaluateWithPST(state.blackRua, 0, GENERAL_PST, -0.5)

    // King safety
    if (state.whiteKhun !== EMPTY_MASK) {
        const whiteKingSquare = getLSB(state.whiteKhun)
        score += KING_SAFETY_PST[whiteKingSquare]
    }
    if (state.blackKhun !== EMPTY_MASK) {
        const blackKingSquare = getLSB(state.blackKhun)
        score -= KING_SAFETY_PST[blackKingSquare]
    }

    // Center control bonus
    const whiteCenterPieces = popCount(state.whiteOccupancy & CENTER_MASK)
    const blackCenterPieces = popCount(state.blackOccupancy & CENTER_MASK)
    score += (whiteCenterPieces - blackCenterPieces) * 0.1

    // Mobility bonus
    const whiteMoves = generateLegalMoves(state, Color.WHITE).length
    const blackMoves = generateLegalMoves(state, Color.BLACK).length
    score += 0.02 * whiteMoves
    score -= 0.02 * blackMoves

    return score
}

