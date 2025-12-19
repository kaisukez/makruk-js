import type { BoardState } from "bitboard/board/board"
import type { Move } from "bitboard/moves"
import { Color, PIECE_POWER } from "common/const"
import { generateLegalMoves, applyMove } from "bitboard/moves"
import { evaluateFast, isDraw } from "bitboard/ai/evaluation"

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

/**
 * Hash function using all 14 bitboards for correct transposition table behavior
 */
function hashState(state: BoardState, turn: Color): string {
    return `${state.whiteBia}_${state.whiteFlippedBia}_${state.whiteMa}_${state.whiteThon}_${state.whiteMet}_${state.whiteRua}_${state.whiteKhun}_${state.blackBia}_${state.blackFlippedBia}_${state.blackMa}_${state.blackThon}_${state.blackMet}_${state.blackRua}_${state.blackKhun}_${turn}`
}

/**
 * MVV-LVA (Most Valuable Victim - Least Valuable Attacker) score for move ordering
 * Higher score = search first
 */
function getMoveScore(move: Move, ttBestMove: Move | null): number {
    // Transposition table best move gets highest priority
    if (ttBestMove && move.from === ttBestMove.from && move.to === ttBestMove.to) {
        return 10000
    }

    // Captures: score by victim value - attacker value / 10
    if (move.captured) {
        const victimValue = PIECE_POWER[move.captured] * 100
        const attackerValue = PIECE_POWER[move.piece]
        return 1000 + victimValue - attackerValue
    }

    // Promotions
    if (move.promotion) {
        return 900
    }

    // Quiet moves
    return 0
}

/**
 * Sort moves for better alpha-beta pruning
 * Order: TT best move > captures (MVV-LVA) > promotions > quiet moves
 */
function orderMoves(moves: Move[], ttBestMove: Move | null): void {
    moves.sort((a, b) => getMoveScore(b, ttBestMove) - getMoveScore(a, ttBestMove))
}

/**
 * Generate only capture moves for quiescence search
 */
function generateCaptures(state: BoardState, turn: Color): Move[] {
    const moves = generateLegalMoves(state, turn)
    return moves.filter(m => m.captured)
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

/**
 * Quiescence search - search captures until position is quiet
 * Avoids horizon effect where evaluation at depth 0 misses obvious captures
 */
function quiescence(
    state: BoardState,
    turn: Color,
    alpha: number,
    beta: number,
    nodesSearched: { count: number }
): number {
    nodesSearched.count++

    // Stand pat - evaluate current position
    const standPat = evaluateFast(state)

    // Beta cutoff
    if (turn === Color.WHITE) {
        if (standPat >= beta) return beta
        if (standPat > alpha) alpha = standPat
    } else {
        if (standPat <= alpha) return alpha
        if (standPat < beta) beta = standPat
    }

    // Search captures only
    const captures = generateCaptures(state, turn)
    if (captures.length === 0) {
        return standPat
    }

    // Order captures by MVV-LVA
    orderMoves(captures, null)

    const isMaximizing = turn === Color.WHITE

    for (const move of captures) {
        const newState = applyMove(state, move)
        const newTurn = turn === Color.WHITE ? Color.BLACK : Color.WHITE
        const score = quiescence(newState, newTurn, alpha, beta, nodesSearched)

        if (isMaximizing) {
            if (score > alpha) {
                alpha = score
            }
            if (alpha >= beta) {
                return beta
            }
        } else {
            if (score < beta) {
                beta = score
            }
            if (beta <= alpha) {
                return alpha
            }
        }
    }

    return isMaximizing ? alpha : beta
}

export function minimax(
    state: BoardState,
    turn: Color,
    depth: number,
    alpha: number,
    beta: number,
    useTranspositionTable: boolean = true
): MinimaxOutput {
    const nodesCounter = { count: 1 }

    // Transposition table lookup
    const hash = useTranspositionTable ? hashState(state, turn) : ''
    let ttBestMove: Move | null = null

    if (useTranspositionTable) {
        const cachedEntry = transpositionTable.get(hash)
        if (cachedEntry) {
            ttBestMove = cachedEntry.bestMove

            if (cachedEntry.depth >= depth) {
                if (cachedEntry.flag === 'exact') {
                    return {
                        bestScore: cachedEntry.score,
                        bestMove: cachedEntry.bestMove,
                        nodesSearched: 1,
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
                        nodesSearched: 1,
                    }
                }
            }
        }
    }

    // Check for draw
    if (isDraw(state)) {
        return {
            bestScore: 0,
            bestMove: null,
            nodesSearched: nodesCounter.count,
        }
    }

    // Generate and check for no legal moves (checkmate/stalemate)
    const moves = generateLegalMoves(state, turn)
    if (moves.length === 0) {
        const score = turn === Color.WHITE ? -Infinity : Infinity
        return {
            bestScore: score,
            bestMove: null,
            nodesSearched: nodesCounter.count,
        }
    }

    // At depth 0, use quiescence search instead of static eval
    if (depth === 0) {
        const score = quiescence(state, turn, alpha, beta, nodesCounter)
        return {
            bestScore: score,
            bestMove: null,
            nodesSearched: nodesCounter.count,
        }
    }

    // Order moves for better pruning
    orderMoves(moves, ttBestMove)

    const isMaximizing = turn === Color.WHITE
    let bestScore = isMaximizing ? -Infinity : Infinity
    let bestMove: Move | null = null
    const originalAlpha = alpha

    for (const move of moves) {
        const newState = applyMove(state, move)
        const newTurn = turn === Color.WHITE ? Color.BLACK : Color.WHITE
        const result = minimax(newState, newTurn, depth - 1, alpha, beta, useTranspositionTable)

        nodesCounter.count += result.nodesSearched

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

    // Store in transposition table
    if (useTranspositionTable) {
        let flag: 'exact' | 'lowerbound' | 'upperbound'
        if (bestScore <= originalAlpha) {
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
        nodesSearched: nodesCounter.count,
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
