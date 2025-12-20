import { Color, SquareIndex } from "common/const"
import { State } from "0x88/types"

export function exportFen(state: State): string {
    const { boardState, turn, moveNumber } = state

    let empty = 0
    let fen = ""
    for (let i = SquareIndex.a1; i <= SquareIndex.h8; i++) {
        const squareData = boardState[i]
        if (!squareData) {
            empty++
        } else {
            if (empty > 0) {
                fen += empty
                empty = 0
            }

            const [color, piece] = squareData
            fen += color === Color.WHITE ? piece.toUpperCase() : piece.toLowerCase()
        }

        if ((i + 1) & 0x88) {
            if (empty > 0) {
                fen += empty
            }

            if (i !== SquareIndex.h8) {
                fen += "/"
            }

            empty = 0
            i += 8
        }
    }

    const result = [fen.split("/").reverse().join("/"), turn, moveNumber]

    if (state.countdown) {
        result.push(
            state.countdown.countColor,
            state.countdown.countType,
            state.countdown.count,
            state.countdown.countFrom,
            state.countdown.countTo,
        )
    }

    return result.join(" ")
}
