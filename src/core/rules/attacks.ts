import { ATTACKS, Color, IS_SLIDING_PIECE, Piece, RAYS, SHIFTS, SquareIndex } from "config"
import { State } from "core/types"
import { swapColor } from "utils/board-utils"

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
