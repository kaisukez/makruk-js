import { Piece } from "config"
import { countPiece } from "core/board/pieces"
import { generateLegalMoves } from "core/moves/generation"
import { State } from "core/types"

import { isKhunAttacked } from "core/rules/attacks"

export const isCheck = (state: State): boolean =>
    isKhunAttacked(state, state.activeColor)

export const isCheckmate = (state: State): boolean =>
    isCheck(state) && generateLegalMoves(state).length === 0

export const isStalemate = (state: State): boolean =>
    !isCheck(state) && generateLegalMoves(state).length === 0

export const isThreefoldRepetition = (state: State): boolean =>
    Object.values(state.fenOccurrence).some((count) => count >= 3)

export const isFinishedCounting = (state: State): boolean => {
    const { countdown, activeColor } = state

    return Boolean(
        countdown &&
        countdown.countColor === activeColor &&
        countdown.count >= countdown.countTo,
    )
}

export const isInsufficientMaterial = (state: State): boolean => {
    const pieceCount = countPiece(state.piecePositions)

    return (
        pieceCount.all === 2 ||
        (pieceCount.all === 3 &&
            (pieceCount.piece[Piece.BIA] === 1 ||
                pieceCount.piece[Piece.FLIPPED_BIA] === 1 ||
                pieceCount.piece[Piece.MET] === 1 ||
                pieceCount.piece[Piece.MA] === 1))
    )
}

export const isDraw = (state: State): boolean =>
    isStalemate(state) ||
    isFinishedCounting(state) ||
    isInsufficientMaterial(state) ||
    isThreefoldRepetition(state)

export const isGameOver = (state: State): boolean =>
    isDraw(state) || isCheckmate(state)
