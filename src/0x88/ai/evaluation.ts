import { Color, PIECE_POWER, SquareIndex as SI } from "common/const"
import { forEachPiece } from "0x88/board/pieces"
import { generateMovesForOneSquare } from "0x88/moves/generation"
import { isCheckmate, isDraw } from "0x88/rules/status"
import { State } from "0x88/types"

const S1 = 0
const S2 = 0.16
const S3 = 0.32
const S4 = 0.48

// @formatter:off
export const CenterScore = {
    [SI.a8]: S1, [SI.b8]: S1, [SI.c8]: S1, [SI.d8]: S1, [SI.e8]: S1, [SI.f8]: S1, [SI.g8]: S1, [SI.h8]: S1,
    [SI.a7]: S1, [SI.b7]: S2, [SI.c7]: S2, [SI.d7]: S2, [SI.e7]: S2, [SI.f7]: S2, [SI.g7]: S2, [SI.h7]: S1,
    [SI.a6]: S1, [SI.b6]: S2, [SI.c6]: S3, [SI.d6]: S3, [SI.e6]: S3, [SI.f6]: S3, [SI.g6]: S2, [SI.h6]: S1,
    [SI.a5]: S1, [SI.b5]: S2, [SI.c5]: S3, [SI.d5]: S4, [SI.e5]: S4, [SI.f5]: S3, [SI.g5]: S2, [SI.h5]: S1,
    [SI.a4]: S1, [SI.b4]: S2, [SI.c4]: S3, [SI.d4]: S4, [SI.e4]: S4, [SI.f4]: S3, [SI.g4]: S2, [SI.h4]: S1,
    [SI.a3]: S1, [SI.b3]: S2, [SI.c3]: S3, [SI.d3]: S3, [SI.e3]: S3, [SI.f3]: S3, [SI.g3]: S2, [SI.h3]: S1,
    [SI.a2]: S1, [SI.b2]: S2, [SI.c2]: S2, [SI.d2]: S2, [SI.e2]: S2, [SI.f2]: S2, [SI.g2]: S2, [SI.h2]: S1,
    [SI.a1]: S1, [SI.b1]: S1, [SI.c1]: S1, [SI.d1]: S1, [SI.e1]: S1, [SI.f1]: S1, [SI.g1]: S1, [SI.h1]: S1,
} as const
// @formatter:on

export function evaluate(state: State): number {
    if (isDraw(state)) {
        return 0
    }
    if (isCheckmate(state)) {
        if (state.activeColor === Color.WHITE) {
            return -Infinity
        } else {
            return Infinity
        }
    }

    let score = 0
    forEachPiece(state["piecePositions"], (color, piece, index) => {
        const legalMoves = generateMovesForOneSquare(state, index, { legal: true })
        // console.log('legalMoves', legalMoves.map(m => moveToSan(state, m)))
        if (color == Color.WHITE) {
            score += PIECE_POWER[piece] + CenterScore[index] + 0.02 * legalMoves.length
        } else {
            score -= PIECE_POWER[piece] + CenterScore[index] + 0.02 * legalMoves.length
        }
    })
    return score
}
