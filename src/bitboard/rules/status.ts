/**
 * Game status checking for bitboard representation
 */

import type { BitboardState, Bitboard } from "bitboard/board/board"
import { Color, Piece } from "common/const"
import { generateLegalMoves, isSquareAttacked } from "bitboard/moves/generation"
import { EMPTY_BITBOARD, popLSB } from "bitboard/board/board"

/**
 * Check if the king of the given color is under attack
 */
export function isKhunAttacked(
    state: BitboardState,
    color: Color
): boolean {
    const isWhite = color === Color.WHITE
    const kingBB = isWhite ? state.whiteKhun : state.blackKhun

    // Find king position
    if (kingBB === EMPTY_BITBOARD) {
        return false // No king on board
    }

    const { square: kingSquare } = popLSB(kingBB)
    const enemyColor = isWhite ? Color.BLACK : Color.WHITE

    return isSquareAttacked(state, kingSquare, enemyColor)
}

/**
 * Check if current player is in check
 */
export function isCheck(state: BitboardState, color: Color): boolean {
    return isKhunAttacked(state, color)
}

/**
 * Check if current player is in checkmate
 */
export function isCheckmate(state: BitboardState, color: Color): boolean {
    return isCheck(state, color) && generateLegalMoves(state, color).length === 0
}

/**
 * Check if current player is in stalemate
 */
export function isStalemate(state: BitboardState, color: Color): boolean {
    return !isCheck(state, color) && generateLegalMoves(state, color).length === 0
}

/**
 * Check if position has insufficient material for checkmate
 */
export function isInsufficientMaterial(state: BitboardState): boolean {
    // Count all pieces
    let pieceCount = 0
    let hasPawn = false
    let hasFlippedBia = false
    let hasMet = false
    let hasMa = false
    let hasRua = false
    let hasThon = false

    // Count white pieces
    if (state.whiteBia !== EMPTY_BITBOARD) {
        hasPawn = true
        pieceCount += countBits(state.whiteBia)
    }
    if (state.whiteFlippedBia !== EMPTY_BITBOARD) {
        hasFlippedBia = true
        pieceCount += countBits(state.whiteFlippedBia)
    }
    if (state.whiteMa !== EMPTY_BITBOARD) {
        hasMa = true
        pieceCount += countBits(state.whiteMa)
    }
    if (state.whiteThon !== EMPTY_BITBOARD) {
        hasThon = true
        pieceCount += countBits(state.whiteThon)
    }
    if (state.whiteMet !== EMPTY_BITBOARD) {
        hasMet = true
        pieceCount += countBits(state.whiteMet)
    }
    if (state.whiteRua !== EMPTY_BITBOARD) {
        hasRua = true
        pieceCount += countBits(state.whiteRua)
    }
    if (state.whiteKhun !== EMPTY_BITBOARD) {
        pieceCount += countBits(state.whiteKhun)
    }

    // Count black pieces
    if (state.blackBia !== EMPTY_BITBOARD) {
        hasPawn = true
        pieceCount += countBits(state.blackBia)
    }
    if (state.blackFlippedBia !== EMPTY_BITBOARD) {
        hasFlippedBia = true
        pieceCount += countBits(state.blackFlippedBia)
    }
    if (state.blackMa !== EMPTY_BITBOARD) {
        hasMa = true
        pieceCount += countBits(state.blackMa)
    }
    if (state.blackThon !== EMPTY_BITBOARD) {
        hasThon = true
        pieceCount += countBits(state.blackThon)
    }
    if (state.blackMet !== EMPTY_BITBOARD) {
        hasMet = true
        pieceCount += countBits(state.blackMet)
    }
    if (state.blackRua !== EMPTY_BITBOARD) {
        hasRua = true
        pieceCount += countBits(state.blackRua)
    }
    if (state.blackKhun !== EMPTY_BITBOARD) {
        pieceCount += countBits(state.blackKhun)
    }

    // Two kings only
    if (pieceCount === 2) {
        return true
    }

    // Two kings + one minor piece (Bia, FlippedBia, Met, or Ma)
    if (pieceCount === 3) {
        if (hasPawn || hasFlippedBia || hasMet || hasMa) {
            return true
        }
    }

    return false
}

/**
 * Count number of set bits in a bitboard
 */
function countBits(bb: Bitboard): number {
    let count = 0
    let temp = bb
    while (temp !== EMPTY_BITBOARD) {
        temp &= temp - 1n
        count++
    }
    return count
}

/**
 * Check if game is over (checkmate or draw)
 */
export function isGameOver(state: BitboardState, color: Color): boolean {
    return isCheckmate(state, color) || isStalemate(state, color) || isInsufficientMaterial(state)
}

/**
 * Check if position is a draw
 */
export function isDraw(state: BitboardState, color: Color): boolean {
    return isStalemate(state, color) || isInsufficientMaterial(state)
}
