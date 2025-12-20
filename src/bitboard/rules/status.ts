import type { Board, Mask64 } from "bitboard/board/board"
import type { Game } from "bitboard/types"
import { Color } from "common/const"
import { generateLegalMoves, isSquareAttacked } from "bitboard/moves/generation"
import { EMPTY_MASK, popLSB } from "bitboard/board/board"
import { isCountdownExpired } from "bitboard/rules/countdown"

export function isKhunAttacked(board: Board, turn: Color): boolean {
    const isWhite = turn === Color.WHITE
    const kingMask = isWhite ? board.whiteKhun : board.blackKhun

    if (kingMask === EMPTY_MASK) {
        return false
    }

    const { square: kingSquare } = popLSB(kingMask)
    const enemyColor = isWhite ? Color.BLACK : Color.WHITE

    return isSquareAttacked(board, kingSquare, enemyColor)
}

export function isCheck(game: Game): boolean {
    return isKhunAttacked(game.board, game.turn)
}

export function isCheckmate(game: Game): boolean {
    return isCheck(game) && generateLegalMoves(game.board, game.turn).length === 0
}

export function isStalemate(game: Game): boolean {
    return !isCheck(game) && generateLegalMoves(game.board, game.turn).length === 0
}

export function isInsufficientMaterial(game: Game): boolean {
    const board = game.board
    let pieceCount = 0
    let hasPawn = false
    let hasFlippedBia = false
    let hasMet = false
    let hasMa = false

    if (board.whiteBia !== EMPTY_MASK) {
        hasPawn = true
        pieceCount += countBits(board.whiteBia)
    }
    if (board.whiteFlippedBia !== EMPTY_MASK) {
        hasFlippedBia = true
        pieceCount += countBits(board.whiteFlippedBia)
    }
    if (board.whiteMa !== EMPTY_MASK) {
        hasMa = true
        pieceCount += countBits(board.whiteMa)
    }
    if (board.whiteThon !== EMPTY_MASK) {
        pieceCount += countBits(board.whiteThon)
    }
    if (board.whiteMet !== EMPTY_MASK) {
        hasMet = true
        pieceCount += countBits(board.whiteMet)
    }
    if (board.whiteRua !== EMPTY_MASK) {
        pieceCount += countBits(board.whiteRua)
    }
    if (board.whiteKhun !== EMPTY_MASK) {
        pieceCount += countBits(board.whiteKhun)
    }

    if (board.blackBia !== EMPTY_MASK) {
        hasPawn = true
        pieceCount += countBits(board.blackBia)
    }
    if (board.blackFlippedBia !== EMPTY_MASK) {
        hasFlippedBia = true
        pieceCount += countBits(board.blackFlippedBia)
    }
    if (board.blackMa !== EMPTY_MASK) {
        hasMa = true
        pieceCount += countBits(board.blackMa)
    }
    if (board.blackThon !== EMPTY_MASK) {
        pieceCount += countBits(board.blackThon)
    }
    if (board.blackMet !== EMPTY_MASK) {
        hasMet = true
        pieceCount += countBits(board.blackMet)
    }
    if (board.blackRua !== EMPTY_MASK) {
        pieceCount += countBits(board.blackRua)
    }
    if (board.blackKhun !== EMPTY_MASK) {
        pieceCount += countBits(board.blackKhun)
    }

    if (pieceCount === 2) {
        return true
    }

    if (pieceCount === 3) {
        if (hasPawn || hasFlippedBia || hasMet || hasMa) {
            return true
        }
    }

    return false
}

function countBits(bb: Mask64): number {
    let count = 0
    let temp = bb
    while (temp !== EMPTY_MASK) {
        temp &= temp - 1n
        count++
    }
    return count
}

export function isGameOver(game: Game): boolean {
    return isCheckmate(game) || isDraw(game)
}

export function isThreefoldRepetition(game: Game): boolean {
    for (const count of game.positionOccurrence.values()) {
        if (count >= 3) return true
    }
    return false
}

export function isDraw(game: Game): boolean {
    return isStalemate(game) ||
        isInsufficientMaterial(game) ||
        isThreefoldRepetition(game) ||
        isCountdownExpired(game.countdown)
}
