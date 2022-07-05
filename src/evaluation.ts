import { Color, PIECE_POWER, SquareIndex } from "./constants";
import { generateLegalMoves, generateMoves, inCheck, inCheckmate, inDraw, makeMove, move } from "./move";
import { forEachPiece, forEachPieceFromBoardState } from "./state";
import { Move, MoveObject, State } from "./types";

const S0 = 0
const S1 = 1
const S2 = 2
const S3 = 3
const S4 = 4

export const CenterScore = {
    [SquareIndex.a8]: 112 ^ S1, [SquareIndex.b8]: 113 ^ S1, [SquareIndex.c8]: 114 ^ S1, [SquareIndex.d8]: 115 ^ S1, [SquareIndex.e8]: 116 ^ S1, [SquareIndex.f8]: 117 ^ S1, [SquareIndex.g8]: 118 ^ S1, [SquareIndex.h8]: 119 ^ S1,
    [SquareIndex.a7]:  96 ^ S1, [SquareIndex.b7]:  97 ^ S2, [SquareIndex.c7]:  98 ^ S2, [SquareIndex.d7]:  99 ^ S2, [SquareIndex.e7]: 100 ^ S2, [SquareIndex.f7]: 101 ^ S2, [SquareIndex.g7]: 102 ^ S2, [SquareIndex.h7]: 103 ^ S1,
    [SquareIndex.a6]:  80 ^ S1, [SquareIndex.b6]:  81 ^ S2, [SquareIndex.c6]:  82 ^ S3, [SquareIndex.d6]:  83 ^ S3, [SquareIndex.e6]:  84 ^ S3, [SquareIndex.f6]:  85 ^ S3, [SquareIndex.g6]:  86 ^ S2, [SquareIndex.h6]:  87 ^ S1,
    [SquareIndex.a5]:  64 ^ S1, [SquareIndex.b5]:  65 ^ S2, [SquareIndex.c5]:  66 ^ S3, [SquareIndex.d5]:  67 ^ S4, [SquareIndex.e5]:  68 ^ S4, [SquareIndex.f5]:  69 ^ S3, [SquareIndex.g5]:  70 ^ S2, [SquareIndex.h5]:  71 ^ S1,
    [SquareIndex.a4]:  48 ^ S1, [SquareIndex.b4]:  49 ^ S2, [SquareIndex.c4]:  50 ^ S3, [SquareIndex.d4]:  51 ^ S4, [SquareIndex.e4]:  52 ^ S4, [SquareIndex.f4]:  53 ^ S3, [SquareIndex.g4]:  54 ^ S2, [SquareIndex.h4]:  55 ^ S1,
    [SquareIndex.a3]:  32 ^ S1, [SquareIndex.b3]:  33 ^ S2, [SquareIndex.c3]:  34 ^ S3, [SquareIndex.d3]:  35 ^ S3, [SquareIndex.e3]:  36 ^ S3, [SquareIndex.f3]:  37 ^ S3, [SquareIndex.g3]:  38 ^ S2, [SquareIndex.h3]:  39 ^ S1,
    [SquareIndex.a2]:  16 ^ S1, [SquareIndex.b2]:  17 ^ S2, [SquareIndex.c2]:  18 ^ S2, [SquareIndex.d2]:  19 ^ S2, [SquareIndex.e2]:  20 ^ S2, [SquareIndex.f2]:  21 ^ S2, [SquareIndex.g2]:  22 ^ S2, [SquareIndex.h2]:  23 ^ S1,
    [SquareIndex.a1]:   0 ^ S1, [SquareIndex.b1]:   1 ^ S1, [SquareIndex.c1]:   2 ^ S1, [SquareIndex.d1]:   3 ^ S1, [SquareIndex.e1]:   4 ^ S1, [SquareIndex.f1]:   5 ^ S1, [SquareIndex.g1]:   6 ^ S1, [SquareIndex.h1]:   7 ^ S1,
} as const

export function evaluate(state: State): number {
    if (inDraw(state)) {
        return 0
    }
    if (inCheckmate(state)) {
        if (state.activeColor === Color.WHITE) {
            return -Infinity
        } else {
            return Infinity
        }
    }

    let score = 0
    forEachPiece(state['piecePositions'], (color, piece, index) => {
        if (color == Color.WHITE) {
            score += PIECE_POWER[piece]
            score += (index ^ CenterScore[index])/10
        } else {
            score -= PIECE_POWER[piece]
            score -= (index ^ CenterScore[index])/10
        }
    })
    const whiteMoves = generateMoves(
        state,
        {
            forColor: Color.WHITE,
            legal: true,
        }
    )
    const blackMoves = generateMoves(
        state,
        {
            forColor: Color.WHITE,
            legal: true,
        }
    )
    score += 0.1*(whiteMoves.length - blackMoves.length)
    return score
}

export function minimax(state: State, depth: number, alpha: number, beta: number): number {
    if (inDraw(state)) {
        return 0
    }

    if (inCheckmate(state)) {
        if (state.activeColor === Color.WHITE) {
            return -Infinity
        } else {
            return Infinity
        }
    }

    if (depth === 0) {
        return evaluate(state)
    }

    if (state.activeColor === Color.WHITE) {
        // maximizing player
        let max = -Infinity
        for (const move of generateLegalMoves(state)) {
            const nextState = makeMove(state, move)
            const score = minimax(nextState, depth-1, alpha, beta)
            max = Math.max(max, score)
            alpha = Math.max(alpha, max)
            if (beta <= alpha) {
                break
            }
        }
        return max
    } else {
        // minimizing player
        let min = Infinity
        for (const move of generateLegalMoves(state)) {
            const nextState = makeMove(state, move)
            const score = minimax(nextState, depth-1, alpha, beta)
            min = Math.min(min, score)
            beta = Math.min(beta, min)
            if (beta <= alpha) {
                break
            }
        }
        return min
    }
}

export function findBestMove(state: State, depth: number): MoveObject {
    const moves = generateLegalMoves(state)
    for (const move of moves) {
        const nextState = makeMove(state, move)
        move.score = minimax(nextState, depth-1, -Infinity, Infinity)
    }
    moves.sort((a, b) => {
        if (a.score! < b.score!) {
            return -1
        } else if (a.score! > b.score!) {
            return 1
        }
        return 0
    })
    if (state.activeColor === Color.WHITE) {
        return moves[moves.length-1]
    } else {
        return moves[0]
    }
}