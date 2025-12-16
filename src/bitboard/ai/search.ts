/**
 * AI Search for bitboard representation
 *
 * Implements minimax with alpha-beta pruning and transposition table
 */

import type { BitboardState } from "bitboard/board/board"
import type { BitboardMove } from "bitboard/moves"
import { Color } from "common/const"
import { generateLegalMoves, applyBitboardMove } from "bitboard/moves"
import { evaluate, evaluateFast, isDraw, isCheckmate } from "bitboard/ai/evaluation"

export interface MinimaxOutput {
    bestScore: number
    bestMove: BitboardMove | null
    nodesSearched: number
}

/**
 * Transposition table entry
 */
interface TTEntry {
    depth: number
    score: number
    flag: 'exact' | 'lowerbound' | 'upperbound'
    bestMove: BitboardMove | null
}

/**
 * Simple hash function for bitboard state
 * This is not a perfect hash, but good enough for transposition table
 */
function hashState(state: BitboardState, turn: Color): string {
    // Use first 4 bitboards as hash (should be unique enough)
    return `${state.whiteBia}_${state.whiteKhun}_${state.blackBia}_${state.blackKhun}_${turn}`
}

/**
 * Transposition table (cache for evaluated positions)
 */
class TranspositionTable {
    private table: Map<string, TTEntry>
    private maxSize: number

    constructor(maxSize: number = 1000000) {
        this.table = new Map()
        this.maxSize = maxSize
    }

    get(hash: string): TTEntry | undefined {
        return this.table.get(hash)
    }

    set(hash: string, entry: TTEntry): void {
        // Simple LRU: if table is full, clear it
        if (this.table.size >= this.maxSize) {
            this.table.clear()
        }
        this.table.set(hash, entry)
    }

    clear(): void {
        this.table.clear()
    }

    size(): number {
        return this.table.size
    }
}

// Global transposition table
const tt = new TranspositionTable()

/**
 * Minimax with alpha-beta pruning
 */
export function minimax(
    state: BitboardState,
    turn: Color,
    depth: number,
    alpha: number,
    beta: number,
    useTranspositionTable: boolean = true
): MinimaxOutput {
    let nodesSearched = 1

    // Check transposition table
    const hash = useTranspositionTable ? hashState(state, turn) : ''
    if (useTranspositionTable) {
        const ttEntry = tt.get(hash)
        if (ttEntry && ttEntry.depth >= depth) {
            if (ttEntry.flag === 'exact') {
                return {
                    bestScore: ttEntry.score,
                    bestMove: ttEntry.bestMove,
                    nodesSearched: 0,
                }
            } else if (ttEntry.flag === 'lowerbound') {
                alpha = Math.max(alpha, ttEntry.score)
            } else if (ttEntry.flag === 'upperbound') {
                beta = Math.min(beta, ttEntry.score)
            }

            if (alpha >= beta) {
                return {
                    bestScore: ttEntry.score,
                    bestMove: ttEntry.bestMove,
                    nodesSearched: 0,
                }
            }
        }
    }

    // Terminal node checks
    if (isDraw(state)) {
        return {
            bestScore: 0,
            bestMove: null,
            nodesSearched,
        }
    }

    const moves = generateLegalMoves(state, turn)
    if (moves.length === 0) {
        // Checkmate
        const score = turn === Color.WHITE ? -Infinity : Infinity
        return {
            bestScore: score,
            bestMove: null,
            nodesSearched,
        }
    }

    // Leaf node - evaluate position
    if (depth === 0) {
        return {
            bestScore: evaluateFast(state),
            bestMove: null,
            nodesSearched,
        }
    }

    // Recursive search
    const isMaximizing = turn === Color.WHITE
    let bestScore = isMaximizing ? -Infinity : Infinity
    let bestMove: BitboardMove | null = null

    for (const move of moves) {
        const newState = applyBitboardMove(state, move)
        const newTurn = turn === Color.WHITE ? Color.BLACK : Color.WHITE
        const result = minimax(newState, newTurn, depth - 1, alpha, beta, useTranspositionTable)

        nodesSearched += result.nodesSearched

        if (isMaximizing) {
            if (result.bestScore > bestScore) {
                bestScore = result.bestScore
                bestMove = move
            }
            alpha = Math.max(alpha, bestScore)
        } else {
            if (result.bestScore < bestScore) {
                bestScore = result.bestScore
                bestMove = move
            }
            beta = Math.min(beta, bestScore)
        }

        // Alpha-beta pruning
        if (beta <= alpha) {
            break
        }
    }

    // Store in transposition table
    if (useTranspositionTable) {
        let flag: 'exact' | 'lowerbound' | 'upperbound'
        if (bestScore <= alpha) {
            flag = 'upperbound'
        } else if (bestScore >= beta) {
            flag = 'lowerbound'
        } else {
            flag = 'exact'
        }

        tt.set(hash, {
            depth,
            score: bestScore,
            flag,
            bestMove,
        })
    }

    return {
        bestScore,
        bestMove,
        nodesSearched,
    }
}

/**
 * Find the best move for the current position
 */
export function findBestMove(
    state: BitboardState,
    turn: Color,
    depth: number,
    options: {
        useTranspositionTable?: boolean
        clearTT?: boolean
    } = {}
): MinimaxOutput {
    const {
        useTranspositionTable = true,
        clearTT = false,
    } = options

    if (clearTT) {
        tt.clear()
    }

    return minimax(state, turn, depth, -Infinity, Infinity, useTranspositionTable)
}

/**
 * Get transposition table statistics
 */
export function getTranspositionTableStats() {
    return {
        size: tt.size(),
    }
}

/**
 * Clear transposition table
 */
export function clearTranspositionTable() {
    tt.clear()
}

/**
 * Iterative deepening search
 * Searches progressively deeper until time limit
 */
export function iterativeDeepening(
    state: BitboardState,
    turn: Color,
    maxDepth: number,
    timeLimitMs?: number
): MinimaxOutput {
    let bestResult: MinimaxOutput = {
        bestScore: 0,
        bestMove: null,
        nodesSearched: 0,
    }

    const startTime = Date.now()

    for (let depth = 1; depth <= maxDepth; depth++) {
        const result = findBestMove(state, turn, depth, {
            useTranspositionTable: true,
            clearTT: depth === 1,
        })

        bestResult = result

        // Check time limit
        if (timeLimitMs && Date.now() - startTime >= timeLimitMs) {
            break
        }

        // If we found a checkmate, no need to search deeper
        if (Math.abs(result.bestScore) === Infinity) {
            break
        }
    }

    return bestResult
}
