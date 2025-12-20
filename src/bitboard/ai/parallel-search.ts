/**
 * Root Parallelization utilities
 *
 * Parallel search by distributing root moves across workers.
 * Supports shared alpha-beta bounds via SharedArrayBuffer for better pruning.
 */

import type { Move, Game } from "bitboard/types"
import { Color } from "common/const"
import { applyMove } from "bitboard/moves/execution"
import { minimax, MinimaxOutput, TranspositionTable, createTranspositionTable } from "./search"
import { computeHash } from "bitboard/hash"

/**
 * Shared bounds structure for parallel alpha-beta
 * Layout: [bestScore (float64)]
 */
export interface SharedBounds {
    buffer: SharedArrayBuffer
    view: Float64Array
    isMaximizing: boolean
}

/**
 * Create shared bounds for parallel search
 */
export function createSharedBounds(isWhite: boolean): SharedBounds {
    const buffer = new SharedArrayBuffer(8) // 1 float64
    const view = new Float64Array(buffer)
    view[0] = isWhite ? -Infinity : Infinity // Initial best score
    return { buffer, view, isMaximizing: isWhite }
}

/**
 * Wrap an existing SharedArrayBuffer as bounds (for workers)
 */
export function wrapSharedBounds(buffer: SharedArrayBuffer, isWhite: boolean): SharedBounds {
    return { buffer, view: new Float64Array(buffer), isMaximizing: isWhite }
}

/**
 * Get current shared bound (alpha for white, beta for black)
 */
function getSharedBound(bounds: SharedBounds): number {
    return bounds.view[0]
}

/**
 * Try to update shared bound if we found a better score
 */
function tryUpdateSharedBound(bounds: SharedBounds, score: number): void {
    const current = bounds.view[0]
    if (bounds.isMaximizing) {
        // White: update if score is higher (better alpha)
        if (score > current) {
            bounds.view[0] = score
        }
    } else {
        // Black: update if score is lower (better beta)
        if (score < current) {
            bounds.view[0] = score
        }
    }
}

/**
 * Distribute moves across workers in a round-robin fashion
 * Alternating distribution helps balance work since moves are ordered by importance
 */
export function distributeMoves<T>(items: T[], numWorkers: number): T[][] {
    const buckets: T[][] = Array.from({ length: numWorkers }, () => [])
    items.forEach((item, i) => {
        buckets[i % numWorkers].push(item)
    })
    return buckets
}

/**
 * Search a specific set of moves at the root level
 * This function is designed to be called from a worker
 * @param tt - Optional transposition table. Creates a new one if not provided.
 */
export function searchMoves(
    game: Game,
    moves: Move[],
    depth: number,
    tt: TranspositionTable | null = null
): MinimaxOutput {
    const isMaximizing = game.turn === Color.WHITE
    const table = tt ?? createTranspositionTable()

    let bestScore = isMaximizing ? -Infinity : Infinity
    let bestMove: Move | null = null
    let totalNodes = 0

    for (const move of moves) {
        const newBoard = applyMove(game.board, move)
        const newTurn = game.turn === Color.WHITE ? Color.BLACK : Color.WHITE
        const newHash = computeHash(newBoard, newTurn)
        const newGame: Game = {
            board: newBoard,
            turn: newTurn,
            moveNumber: game.moveNumber,
            hash: newHash,
            positionOccurrence: game.positionOccurrence,
            countdown: game.countdown,
        }
        const result = minimax(newGame, depth - 1, -Infinity, Infinity, table)

        totalNodes += result.nodesSearched

        if (isMaximizing) {
            if (result.bestScore > bestScore) {
                bestScore = result.bestScore
                bestMove = move
            }
        } else {
            if (result.bestScore < bestScore) {
                bestScore = result.bestScore
                bestMove = move
            }
        }
    }

    return { bestScore, bestMove, nodesSearched: totalNodes }
}

export function searchMovesWithSharedBounds(
    game: Game,
    moves: Move[],
    depth: number,
    sharedBounds: SharedBounds,
    tt: TranspositionTable | null = null
): MinimaxOutput {
    const isMaximizing = game.turn === Color.WHITE
    const table = tt ?? createTranspositionTable()

    let bestScore = isMaximizing ? -Infinity : Infinity
    let bestMove: Move | null = null
    let totalNodes = 0

    for (const move of moves) {
        const sharedBound = getSharedBound(sharedBounds)

        let alpha: number, beta: number
        if (isMaximizing) {
            alpha = Math.max(bestScore, sharedBound)
            beta = Infinity
        } else {
            alpha = -Infinity
            beta = Math.min(bestScore, sharedBound)
        }

        const newBoard = applyMove(game.board, move)
        const newTurn = game.turn === Color.WHITE ? Color.BLACK : Color.WHITE
        const newHash = computeHash(newBoard, newTurn)
        const newGame: Game = {
            board: newBoard,
            turn: newTurn,
            moveNumber: game.moveNumber,
            hash: newHash,
            positionOccurrence: game.positionOccurrence,
            countdown: game.countdown,
        }
        const result = minimax(newGame, depth - 1, alpha, beta, table)

        totalNodes += result.nodesSearched

        if (isMaximizing) {
            if (result.bestScore > bestScore) {
                bestScore = result.bestScore
                bestMove = move
                tryUpdateSharedBound(sharedBounds, bestScore)
            }
        } else {
            if (result.bestScore < bestScore) {
                bestScore = result.bestScore
                bestMove = move
                tryUpdateSharedBound(sharedBounds, bestScore)
            }
        }
    }

    return { bestScore, bestMove, nodesSearched: totalNodes }
}

/**
 * Combine results from multiple workers
 */
export function combineResults(results: MinimaxOutput[], isWhite: boolean): MinimaxOutput {
    const isMaximizing = isWhite
    let bestScore = isMaximizing ? -Infinity : Infinity
    let bestMove: Move | null = null
    let totalNodes = 0

    for (const result of results) {
        totalNodes += result.nodesSearched

        if (isMaximizing) {
            if (result.bestScore > bestScore) {
                bestScore = result.bestScore
                bestMove = result.bestMove
            }
        } else {
            if (result.bestScore < bestScore) {
                bestScore = result.bestScore
                bestMove = result.bestMove
            }
        }
    }

    return { bestScore, bestMove, nodesSearched: totalNodes }
}

/**
 * Get the recommended number of workers for Node.js environments
 * For browser environments, the consumer should use navigator.hardwareConcurrency directly
 */
export function getRecommendedWorkers(): number {
    if (typeof process !== 'undefined' && process.versions?.node) {
        try {
            const os = require('os')
            return Math.max(1, os.cpus().length - 1)
        } catch {
            return 2
        }
    }
    // Default fallback - consumer should check navigator.hardwareConcurrency in browser
    return 2
}
