/**
 * Game status checking for bitboard representation
 */

import type { BoardState, Mask64 } from "bitboard/board/board"
import { Color, Piece } from "common/const"
import { generateLegalMoves, isSquareAttacked } from "bitboard/moves/generation"
import { EMPTY_MASK, popLSB } from "bitboard/board/board"

/**
 * Check if the king of the given color is under attack
 */
export function isKhunAttacked(
    state: BoardState,
    color: Color
): boolean {
    const isWhite = color === Color.WHITE
    const kingMask = isWhite ? state.whiteKhun : state.blackKhun

    // Find king position
    if (kingMask === EMPTY_MASK) {
        return false // No king on board
    }

    const { square: kingSquare } = popLSB(kingMask)
    const enemyColor = isWhite ? Color.BLACK : Color.WHITE

    return isSquareAttacked(state, kingSquare, enemyColor)
}

/**
 * Check if current player is in check
 */
export function isCheck(state: BoardState, color: Color): boolean {
    return isKhunAttacked(state, color)
}

/**
 * Check if current player is in checkmate
 */
export function isCheckmate(state: BoardState, color: Color): boolean {
    return isCheck(state, color) && generateLegalMoves(state, color).length === 0
}

/**
 * Check if current player is in stalemate
 */
export function isStalemate(state: BoardState, color: Color): boolean {
    return !isCheck(state, color) && generateLegalMoves(state, color).length === 0
}

/**
 * Check if position has insufficient material for checkmate
 */
export function isInsufficientMaterial(state: BoardState): boolean {
    // Count all pieces
    let pieceCount = 0
    let hasPawn = false
    let hasFlippedBia = false
    let hasMet = false
    let hasMa = false
    let hasRua = false
    let hasThon = false

    // Count white pieces
    if (state.whiteBia !== EMPTY_MASK) {
        hasPawn = true
        pieceCount += countBits(state.whiteBia)
    }
    if (state.whiteFlippedBia !== EMPTY_MASK) {
        hasFlippedBia = true
        pieceCount += countBits(state.whiteFlippedBia)
    }
    if (state.whiteMa !== EMPTY_MASK) {
        hasMa = true
        pieceCount += countBits(state.whiteMa)
    }
    if (state.whiteThon !== EMPTY_MASK) {
        hasThon = true
        pieceCount += countBits(state.whiteThon)
    }
    if (state.whiteMet !== EMPTY_MASK) {
        hasMet = true
        pieceCount += countBits(state.whiteMet)
    }
    if (state.whiteRua !== EMPTY_MASK) {
        hasRua = true
        pieceCount += countBits(state.whiteRua)
    }
    if (state.whiteKhun !== EMPTY_MASK) {
        pieceCount += countBits(state.whiteKhun)
    }

    // Count black pieces
    if (state.blackBia !== EMPTY_MASK) {
        hasPawn = true
        pieceCount += countBits(state.blackBia)
    }
    if (state.blackFlippedBia !== EMPTY_MASK) {
        hasFlippedBia = true
        pieceCount += countBits(state.blackFlippedBia)
    }
    if (state.blackMa !== EMPTY_MASK) {
        hasMa = true
        pieceCount += countBits(state.blackMa)
    }
    if (state.blackThon !== EMPTY_MASK) {
        hasThon = true
        pieceCount += countBits(state.blackThon)
    }
    if (state.blackMet !== EMPTY_MASK) {
        hasMet = true
        pieceCount += countBits(state.blackMet)
    }
    if (state.blackRua !== EMPTY_MASK) {
        hasRua = true
        pieceCount += countBits(state.blackRua)
    }
    if (state.blackKhun !== EMPTY_MASK) {
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
function countBits(bb: Mask64): number {
    let count = 0
    let temp = bb
    while (temp !== EMPTY_MASK) {
        temp &= temp - 1n
        count++
    }
    return count
}

/**
 * Check if game is over (checkmate or draw)
 */
export function isGameOver(state: BoardState, color: Color): boolean {
    return isCheckmate(state, color) || isStalemate(state, color) || isInsufficientMaterial(state)
}

/**
 * Check if position is a draw
 */
export function isDraw(state: BoardState, color: Color): boolean {
    return isStalemate(state, color) || isInsufficientMaterial(state)
}
