import type { BoardState } from "bitboard/board/board"
import type { Move } from "bitboard/moves"
import { Color } from "common/const"
import { generateLegalMoves, applyMove } from "bitboard/moves"
import { evaluate, evaluateFast, isDraw, isCheckmate } from "bitboard/ai/evaluation"

export interface MinimaxOutput {
    bestScore: number
    bestMove: Move | null
    nodesSearched: number
}

interface TranspositionEntry {
    depth: number
    score: number
    flag: 'exact' | 'lowerbound' | 'upperbound'
    bestMove: Move | null
}

function hashState(state: BoardState, turn: Color): string {
    return `${state.whiteBia}_${state.whiteKhun}_${state.blackBia}_${state.blackKhun}_${turn}`
}

class TranspositionTable {
    private table: Map<string, TranspositionEntry>
    private maxSize: number

    constructor(maxSize: number = 1000000) {
        this.table = new Map()
        this.maxSize = maxSize
    }

    get(hash: string): TranspositionEntry | undefined {
        return this.table.get(hash)
    }

    set(hash: string, entry: TranspositionEntry): void {
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

const transpositionTable = new TranspositionTable()

export function minimax(
    state: BoardState,
    turn: Color,
    depth: number,
    alpha: number,
    beta: number,
    useTranspositionTable: boolean = true
): MinimaxOutput {
    let nodesSearched = 1

    const hash = useTranspositionTable ? hashState(state, turn) : ''
    if (useTranspositionTable) {
        const cachedEntry = transpositionTable.get(hash)
        if (cachedEntry && cachedEntry.depth >= depth) {
            if (cachedEntry.flag === 'exact') {
                return {
                    bestScore: cachedEntry.score,
                    bestMove: cachedEntry.bestMove,
                    nodesSearched: 0,
                }
            } else if (cachedEntry.flag === 'lowerbound') {
                alpha = Math.max(alpha, cachedEntry.score)
            } else if (cachedEntry.flag === 'upperbound') {
                beta = Math.min(beta, cachedEntry.score)
            }

            if (alpha >= beta) {
                return {
                    bestScore: cachedEntry.score,
                    bestMove: cachedEntry.bestMove,
                    nodesSearched: 0,
                }
            }
        }
    }

    if (isDraw(state)) {
        return {
            bestScore: 0,
            bestMove: null,
            nodesSearched,
        }
    }

    const moves = generateLegalMoves(state, turn)
    if (moves.length === 0) {
        const score = turn === Color.WHITE ? -Infinity : Infinity
        return {
            bestScore: score,
            bestMove: null,
            nodesSearched,
        }
    }

    if (depth === 0) {
        return {
            bestScore: evaluateFast(state),
            bestMove: null,
            nodesSearched,
        }
    }

    const isMaximizing = turn === Color.WHITE
    let bestScore = isMaximizing ? -Infinity : Infinity
    let bestMove: Move | null = null

    for (const move of moves) {
        const newState = applyMove(state, move)
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

        if (beta <= alpha) {
            break
        }
    }

    if (useTranspositionTable) {
        let flag: 'exact' | 'lowerbound' | 'upperbound'
        if (bestScore <= alpha) {
            flag = 'upperbound'
        } else if (bestScore >= beta) {
            flag = 'lowerbound'
        } else {
            flag = 'exact'
        }

        transpositionTable.set(hash, {
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

export function findBestMove(
    state: BoardState,
    turn: Color,
    depth: number,
    options: {
        useTranspositionTable?: boolean
        clearCache?: boolean
    } = {}
): MinimaxOutput {
    const {
        useTranspositionTable = true,
        clearCache = false,
    } = options

    if (clearCache) {
        transpositionTable.clear()
    }

    return minimax(state, turn, depth, -Infinity, Infinity, useTranspositionTable)
}

export function getTranspositionTableStats() {
    return {
        size: transpositionTable.size(),
    }
}

export function clearTranspositionTable() {
    transpositionTable.clear()
}

export function iterativeDeepening(
    state: BoardState,
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
            clearCache: depth === 1,
        })

        bestResult = result

        if (timeLimitMs && Date.now() - startTime >= timeLimitMs) {
            break
        }

        if (Math.abs(result.bestScore) === Infinity) {
            break
        }
    }

    return bestResult
}
