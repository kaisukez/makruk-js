import { Color } from "common/const"

export function swapColor(color: Color): Color {
    return color === Color.WHITE ? Color.BLACK : Color.WHITE
}
