import { State } from "./types"
import { ATTACKS, Color, IS_SLIDING_PIECE, Piece, RAYS, SHIFTS, SquareIndex } from "./constants"
import { swapColor } from "./utils"
import { countPiece } from "./state"
import { generateLegalMoves } from "./move"

/**
 *
 * to find out if any of black piece can attack on e7 square
 *
 * canThisColorAttackThisSquare(BLACK, SQUARES.e7)
 *
 */
export const canThisColorAttackThisSquare = (
    boardState: State["boardState"],
    color: Color,
    targetSquare: SquareIndex,
) => {
    for (
        let fromIndex = SquareIndex.a1;
        fromIndex <= SquareIndex.h8;
        fromIndex++
    ) {
        /* did we run off the end of the board */
        if (fromIndex & 0x88) {
            fromIndex += 7
            continue
        }

        /* if empty square or wrong color */
        const squareData = boardState[fromIndex]
        if (!squareData || squareData[0] !== color) {
            continue
        }

        const fromSquare = squareData
        const lookUpIndex = fromIndex - targetSquare + 119

        if (ATTACKS[lookUpIndex] & (1 << SHIFTS[fromSquare[0]][fromSquare[1]])) {
            // if not sliding piece then return true
            if (!IS_SLIDING_PIECE[fromSquare[1]]) {
                return true
            }

            // if sliding piece then find out if it's blocked by other piece
            // if it's blocked then we can't attack, otherwise we can
            const offset = RAYS[lookUpIndex]
            let j = fromIndex + offset

            let blocked = false
            while (j !== targetSquare) {
                if (boardState[j]) {
                    blocked = true
                    break
                }
                j += offset
            }

            if (!blocked) {
                return true
            }
        }
    }

    return false
}

export const isKhunAttacked = (state: State, color: Color): boolean => {
    const [khunSquare] = state.piecePositions[color][Piece.KHUN]
    return canThisColorAttackThisSquare(
        state.boardState,
        swapColor(color),
        khunSquare,
    )
}

export const inCheck = (state: State): boolean =>
    isKhunAttacked(state, state.activeColor)

export const inCheckmate = (state: State): boolean =>
    inCheck(state) && generateLegalMoves(state).length === 0

export const inStalemate = (state: State): boolean =>
    !inCheck(state) && generateLegalMoves(state).length === 0

export const inThreefoldRepetition = (state: State): boolean =>
    Object.values(state.fenOccurrence).some((count) => count >= 3)

export const isFinishedCounting = (state: State): boolean => {
    const { countdown, activeColor } = state

    return Boolean(
        countdown &&
        countdown.countColor === activeColor &&
        countdown.count >= countdown.countTo,
    )
}

export const inInsufficientMaterial = (state: State): boolean => {
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

export const inDraw = (state: State): boolean =>
    inStalemate(state) ||
    isFinishedCounting(state) ||
    inInsufficientMaterial(state) ||
    inThreefoldRepetition(state)

export const isGameOver = (state: State): boolean =>
    inDraw(state) || inCheckmate(state)
