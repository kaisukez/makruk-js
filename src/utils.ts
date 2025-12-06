import { State } from "./types"
import { Color, FILE_A, SquareIndex } from "./constants"

export function swapColor(color: Color): Color {
    return color === Color.WHITE ? Color.BLACK : Color.WHITE
}

export const getRank = (square: SquareIndex) => square >> 4

export const getFile = (square: SquareIndex) => square & 15

const EN_FILE_SYMBOLS = "abcdefgh"
const TH_FILE_SYMBOLS = "กขคงจฉชญ"
const RANK_SYMBOLS = "12345678"

export const getAlgebraic = (square: SquareIndex, isThai: boolean = false) => {
    const files = isThai ? TH_FILE_SYMBOLS : EN_FILE_SYMBOLS
    return files[getFile(square)] + RANK_SYMBOLS[getRank(square)]
}

export function printBoard(boardState: State["boardState"]) {
    const isEnd = (iterator: number) => iterator === SquareIndex.h1

    let s = "     +------------------------+\n"
    let i = SquareIndex.a8

    if (!boardState) {
        throw { code: "NO_BOARD_STATE" }
    }

    while (true) {
        /* display the rank */
        if (getFile(i) === FILE_A) {
            // s += ' ' + (parseInt(rank(i), 10) + 1) + ' |'
            s += " " + (getRank(i) + 1) + " |"
        }

        /* empty piece */
        // if (boardState[i] == null || !(boardState[i].piece && boardState[i].color)) {
        const squareData = boardState[i]
        if (!squareData) {
            s += " . "
        } else {
            // const piece = squareData.piece
            // const color = squareData.color
            const [color, piece] = squareData
            const symbol = color === Color.WHITE ? piece.toUpperCase() : piece.toLowerCase()
            s += " " + symbol + " "
        }

        if ((i + 1) & 0x88) {
            s += "|\n"
            if (isEnd(i)) {
                break
            }
            i -= (SquareIndex.h8 - SquareIndex.a7)
        } else {
            i++
        }
    }
    s += "     +------------------------+\n"
    s += "     a  b  c  d  e  f  g  h\n"

    return s
}
