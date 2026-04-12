import type { Board } from "bitboard/board/board"
import type { Move, Game } from "bitboard/types"
import { Color, PIECE_POWER } from "common/const"
import { generateLegalMoves, generateLegalCaptures } from "bitboard/moves/generation"
import { applyMove } from "bitboard/moves/execution"
import { evaluateFast } from "bitboard/ai/evaluation"
import { updateHashForMove } from "bitboard/hash"
import { isInsufficientMaterial, isKhunAttacked } from "bitboard/rules/status"
import { stepCountdown, isCountdownExpired } from "bitboard/rules/countdown"
import { swapColor } from "common/utils"

// ---------------------------------------------------------------------------
// Search context — shared mutable state threaded through the recursive search
// ---------------------------------------------------------------------------

interface SearchContext {
    tt: TranspositionTable | null
    /**
     * Frequency map of hashes on the current search path (root-to-current, inclusive).
     * O(1) repetition check vs the old O(depth) linear scan.
     */
    pathFreq: Map<bigint, number>
    /** Shared node counter — avoids accumulating per-call counts up the stack. */
    nodes: number
    /** Optional wall-clock deadline (ms). Search aborts when Date.now() > stopTime. */
    stopTime?: number
    /** Set to true when stopTime is exceeded — callers check this to discard partial results. */
    aborted: boolean
}

// ---------------------------------------------------------------------------
// Apply move for search — does NOT clone positionOccurrence (use path instead)
// ---------------------------------------------------------------------------

export function applyMoveForSearch(game: Game, move: Move): Game {
    const newBoard = applyMove(game.board, move)
    const newTurn = swapColor(game.turn)

    // Update countdown before hash so the new hash reflects the updated countdown.
    // stepCountdown only throws when flags conflict; we pass no flags so it never throws.
    let newCountdown = game.countdown
    if (game.countdown && game.countdown.countColor === game.turn) {
        newCountdown = stepCountdown(newBoard, newTurn, game.countdown)
    }

    const newHash = updateHashForMove(game.hash, move, game.countdown, newCountdown)

    return {
        board: newBoard,
        turn: newTurn,
        moveNumber: game.moveNumber,
        // Share the positionOccurrence by reference — repetition is tracked via the search path
        positionOccurrence: game.positionOccurrence,
        hash: newHash,
        countdown: newCountdown,
    }
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

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

export interface TranspositionTable {
    get(hash: bigint): TranspositionEntry | undefined
    set(hash: bigint, entry: TranspositionEntry): void
    clear(): void
    size(): number
}

// ---------------------------------------------------------------------------
// Transposition table — always-replace strategy
// ---------------------------------------------------------------------------

export function createTranspositionTable(maxSize: number = 1_000_000): TranspositionTable {
    const table = new Map<bigint, TranspositionEntry>()

    return {
        get(hash: bigint): TranspositionEntry | undefined {
            return table.get(hash)
        },
        set(hash: bigint, entry: TranspositionEntry): void {
            // Always-replace: just overwrite without nuking the entire table
            if (table.size >= maxSize) {
                // Delete the oldest entry by clearing the first key in iteration order
                const firstKey = table.keys().next().value
                if (firstKey !== undefined) table.delete(firstKey)
            }
            table.set(hash, entry)
        },
        clear(): void {
            table.clear()
        },
        size(): number {
            return table.size
        },
    }
}

// ---------------------------------------------------------------------------
// Move ordering
// ---------------------------------------------------------------------------

/**
 * MVV-LVA score for a single move.
 */
export function getMoveScore(move: Move, ttBestMove?: Move | null): number {
    if (ttBestMove && move.from === ttBestMove.from && move.to === ttBestMove.to) {
        return 10000
    }
    if (move.captured) {
        const victimValue = PIECE_POWER[move.captured] * 100
        const attackerValue = PIECE_POWER[move.piece]
        return 1000 + victimValue - attackerValue
    }
    if (move.promotion) {
        return 900
    }
    return 0
}

/**
 * Sort moves in-place by MVV-LVA score (descending).
 */
export function orderMoves(moves: Move[], ttBestMove?: Move | null): void {
    moves.sort((a, b) => getMoveScore(b, ttBestMove) - getMoveScore(a, ttBestMove))
}

// ---------------------------------------------------------------------------
// Repetition detection via search path frequency map
// ---------------------------------------------------------------------------

function pathFreqIncrement(pathFreq: Map<bigint, number>, hash: bigint): void {
    pathFreq.set(hash, (pathFreq.get(hash) ?? 0) + 1)
}

function pathFreqDecrement(pathFreq: Map<bigint, number>, hash: bigint): void {
    const n = pathFreq.get(hash)! - 1
    if (n === 0) { pathFreq.delete(hash) } else { pathFreq.set(hash, n) }
}

// ---------------------------------------------------------------------------
// Quiescence search
// ---------------------------------------------------------------------------

function quiescence(
    state: Board,
    turn: Color,
    alpha: number,
    beta: number,
    ctx: SearchContext
): number {
    ctx.nodes++

    // Time check every 2048 nodes
    if (ctx.stopTime && (ctx.nodes & 2047) === 0 && Date.now() > ctx.stopTime) {
        ctx.aborted = true
        return evaluateFast(state)
    }

    const inCheck = isKhunAttacked(state, turn)

    if (inCheck) {
        // Must search all moves to escape check — captures alone are insufficient
        const allMoves = generateLegalMoves(state, turn)
        if (allMoves.length === 0) {
            // Checkmate
            return turn === Color.WHITE ? -Infinity : Infinity
        }
        orderMoves(allMoves, null)
        const isMaximizing = turn === Color.WHITE
        let best = isMaximizing ? -Infinity : Infinity

        for (const move of allMoves) {
            const newState = applyMove(state, move)
            const score = quiescence(newState, swapColor(turn), alpha, beta, ctx)
            if (isMaximizing) {
                if (score > best) best = score
                if (score > alpha) alpha = score
                if (alpha >= beta) return beta
            } else {
                if (score < best) best = score
                if (score < beta) beta = score
                if (beta <= alpha) return alpha
            }
        }
        return best
    }

    // Stand-pat evaluation
    const standPat = evaluateFast(state)
    if (turn === Color.WHITE) {
        if (standPat >= beta) return beta
        if (standPat > alpha) alpha = standPat
    } else {
        if (standPat <= alpha) return alpha
        if (standPat < beta) beta = standPat
    }

    // Search legal captures only (no quiet moves — position is already "quiet" here)
    const captures = generateLegalCaptures(state, turn)
    if (captures.length === 0) return standPat

    orderMoves(captures, null)
    const isMaximizing = turn === Color.WHITE

    for (const move of captures) {
        const newState = applyMove(state, move)
        const score = quiescence(newState, swapColor(turn), alpha, beta, ctx)

        if (isMaximizing) {
            if (score > alpha) alpha = score
            if (alpha >= beta) return beta
        } else {
            if (score < beta) beta = score
            if (beta <= alpha) return alpha
        }
    }

    return isMaximizing ? alpha : beta
}

// ---------------------------------------------------------------------------
// Core alpha-beta minimax
// ---------------------------------------------------------------------------

function minimaxInternal(
    game: Game,
    depth: number,
    alpha: number,
    beta: number,
    ctx: SearchContext
): { score: number; move: Move | null } {
    ctx.nodes++

    // Time check every 2048 nodes
    if (ctx.stopTime && (ctx.nodes & 2047) === 0 && Date.now() > ctx.stopTime) {
        ctx.aborted = true
        return { score: 0, move: null }
    }

    // -------------------------------------------------------------------
    // Transposition table lookup
    // -------------------------------------------------------------------
    const hash = ctx.tt ? game.hash : 0n
    let ttBestMove: Move | null = null

    if (ctx.tt) {
        const cached = ctx.tt.get(hash)
        if (cached) {
            ttBestMove = cached.bestMove
            if (cached.depth >= depth) {
                if (cached.flag === 'exact') {
                    return { score: cached.score, move: cached.bestMove }
                } else if (cached.flag === 'lowerbound') {
                    alpha = Math.max(alpha, cached.score)
                } else if (cached.flag === 'upperbound') {
                    beta = Math.min(beta, cached.score)
                }
                if (alpha >= beta) {
                    return { score: cached.score, move: cached.bestMove }
                }
            }
        }
    }

    // -------------------------------------------------------------------
    // Draw detection
    // -------------------------------------------------------------------

    // Threefold repetition: count occurrences in actual game history + search path
    const historyCount = game.positionOccurrence.get(game.hash) ?? 0
    const pathCount = ctx.pathFreq.get(game.hash) ?? 0
    if (historyCount + pathCount >= 3) {
        return { score: 0, move: null }
    }

    if (isInsufficientMaterial(game) || isCountdownExpired(game.countdown)) {
        return { score: 0, move: null }
    }

    // -------------------------------------------------------------------
    // Terminal / depth-0 node
    // -------------------------------------------------------------------

    const moves = generateLegalMoves(game.board, game.turn)

    if (moves.length === 0) {
        if (isKhunAttacked(game.board, game.turn)) {
            // Checkmate — the side to move loses
            return { score: game.turn === Color.WHITE ? -Infinity : Infinity, move: null }
        }
        // Stalemate
        return { score: 0, move: null }
    }

    if (depth === 0) {
        const score = quiescence(game.board, game.turn, alpha, beta, ctx)
        return { score, move: null }
    }

    // -------------------------------------------------------------------
    // Recursive search
    // -------------------------------------------------------------------

    orderMoves(moves, ttBestMove)

    const isMaximizing = game.turn === Color.WHITE
    let bestScore = isMaximizing ? -Infinity : Infinity
    let bestMove: Move | null = null
    const originalAlpha = alpha

    for (const move of moves) {
        const newGame = applyMoveForSearch(game, move)

        pathFreqIncrement(ctx.pathFreq, newGame.hash)
        const result = minimaxInternal(newGame, depth - 1, alpha, beta, ctx)
        pathFreqDecrement(ctx.pathFreq, newGame.hash)

        if (ctx.aborted) break

        if (isMaximizing) {
            if (result.score > bestScore) {
                bestScore = result.score
                bestMove = move
            }
            if (bestScore > alpha) alpha = bestScore
        } else {
            if (result.score < bestScore) {
                bestScore = result.score
                bestMove = move
            }
            if (bestScore < beta) beta = bestScore
        }

        if (beta <= alpha) break
    }

    // Store in transposition table
    if (ctx.tt && !ctx.aborted) {
        let flag: 'exact' | 'lowerbound' | 'upperbound'
        if (bestScore <= originalAlpha) {
            flag = 'upperbound'
        } else if (bestScore >= beta) {
            flag = 'lowerbound'
        } else {
            flag = 'exact'
        }
        ctx.tt.set(hash, { depth, score: bestScore, flag, bestMove })
    }

    return { score: bestScore, move: bestMove }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function makePathFreq(initialHash: bigint): Map<bigint, number> {
    const m = new Map<bigint, number>()
    m.set(initialHash, 1)
    return m
}

export function minimax(
    game: Game,
    depth: number,
    alpha: number,
    beta: number,
    tt: TranspositionTable | null = null
): MinimaxOutput {
    const ctx: SearchContext = { tt, pathFreq: makePathFreq(game.hash), nodes: 0, aborted: false }
    const result = minimaxInternal(game, depth, alpha, beta, ctx)
    return { bestScore: result.score, bestMove: result.move, nodesSearched: ctx.nodes }
}

export function findBestMove(
    game: Game,
    depth: number,
    tt: TranspositionTable | null = null
): MinimaxOutput {
    const table = tt ?? createTranspositionTable()
    const ctx: SearchContext = { tt: table, pathFreq: makePathFreq(game.hash), nodes: 0, aborted: false }
    const result = minimaxInternal(game, depth, -Infinity, Infinity, ctx)
    return { bestScore: result.score, bestMove: result.move, nodesSearched: ctx.nodes }
}

export function iterativeDeepening(
    game: Game,
    maxDepth: number,
    timeLimitMs?: number,
    tt: TranspositionTable | null = null
): MinimaxOutput {
    const table = tt ?? createTranspositionTable()
    const startTime = Date.now()
    const stopTime = timeLimitMs ? startTime + timeLimitMs : undefined

    let bestResult: MinimaxOutput = { bestScore: 0, bestMove: null, nodesSearched: 0 }
    let totalNodes = 0

    for (let depth = 1; depth <= maxDepth; depth++) {
        const ctx: SearchContext = {
            tt: table,
            pathFreq: makePathFreq(game.hash),
            nodes: 0,
            aborted: false,
            stopTime,
        }

        const result = minimaxInternal(game, depth, -Infinity, Infinity, ctx)
        totalNodes += ctx.nodes

        // Discard results from an aborted (time-exceeded) search
        if (ctx.aborted) break

        bestResult = { bestScore: result.score, bestMove: result.move, nodesSearched: totalNodes }

        if (Math.abs(result.score) === Infinity) break
    }

    return bestResult
}
