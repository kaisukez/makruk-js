import { Color } from "common/const"
import { applyMove } from "0x88/moves/execution"
import { generateLegalMoves } from "0x88/moves/generation"
import { isCheckmate, isDraw } from "0x88/rules/status"
import { MoveObject, State } from "0x88/types"

import { evaluate } from "0x88/ai/evaluation"

export type MinimaxOutput = {
    bestScore: number
    bestMove: MoveObject | null
}

export function minimax(state: State, depth: number, alpha: number, beta: number): MinimaxOutput {
    if (isDraw(state)) {
        return {
            bestScore: 0,
            bestMove: null,
        }
    }

    if (isCheckmate(state)) {
        if (state.turn === Color.WHITE) {
            return {
                bestScore: -Infinity,
                bestMove: null,
            }
        } else {
            return {
                bestScore: Infinity,
                bestMove: null,
            }
        }
    }

    if (depth === 0) {
        return {
            bestScore: evaluate(state),
            bestMove: null,
        }
    }

    const moves = generateLegalMoves(state)
    if (state.turn === Color.WHITE) {
        // maximizing player
        let max = -Infinity
        let bestMove = null

        for (const move of moves) {
            const { newState } = applyMove(state, move, {
                trackUndo: false,
                updateFen: false,
            })
            const { bestScore } = minimax(newState, depth - 1, alpha, beta)
            if (bestScore > max) {
                max = bestScore
                bestMove = move
            }
            alpha = Math.max(alpha, max)
            if (beta <= alpha) {
                break
            }
        }
        return {
            bestScore: max,
            bestMove,
        }
    } else {
        // minimizing player
        let min = Infinity
        let bestMove = null
        for (const move of moves) {
            const { newState } = applyMove(state, move, {
                trackUndo: false,
                updateFen: false,
            })
            const { bestScore } = minimax(newState, depth - 1, alpha, beta)
            if (bestScore < min) {
                min = bestScore
                bestMove = move
            }
            beta = Math.min(beta, min)
            if (beta <= alpha) {
                break
            }
        }
        return {
            bestScore: min,
            bestMove,
        }
    }
}

export function findBestMove(state: State, depth: number): MinimaxOutput {
    return minimax(state, depth, -Infinity, Infinity)
}
