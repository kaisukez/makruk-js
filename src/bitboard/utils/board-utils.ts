import { Color } from "common/const"
import { BoardState, getPieceAt } from "bitboard/board/board"

export function swapColor(color: Color): Color {
    return color === Color.WHITE ? Color.BLACK : Color.WHITE
}

export function printBoard(bitboard: BoardState): string {
    let s = "     +------------------------+\n"

    for (let rank = 7; rank >= 0; rank--) {
        s += " " + (rank + 1) + " |"

        for (let file = 0; file < 8; file++) {
            const square = rank * 8 + file
            const piece = getPieceAt(bitboard, square)

            if (!piece) {
                s += " . "
            } else {
                const [color, pieceType] = piece
                const symbol = color === Color.WHITE ? pieceType.toUpperCase() : pieceType.toLowerCase()
                s += " " + symbol + " "
            }
        }

        s += "|\n"
    }

    s += "     +------------------------+\n"
    s += "       a  b  c  d  e  f  g  h\n"

    return s
}
