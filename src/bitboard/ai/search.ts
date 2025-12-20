import type { Board } from "bitboard/board/board"
import type { Move, Game } from "bitboard/types"
import { Color, PIECE_POWER } from "common/const"
import { generateLegalMoves } from "bitboard/moves/generation"
import { applyMove } from "bitboard/moves/execution"
import { evaluateFast } from "bitboard/ai/evaluation"
import { updateHashForMove } from "bitboard/hash"
import { isDraw } from "bitboard/rules/status"
import { stepCountdown, CountdownErrorCode } from "bitboard/rules/countdown"

/**
 * Apply a move during search, updating countdown and position occurrence
 */
export function applyMoveForSearch(game: Game, move: Move): Game {
    const newBoard = applyMove(game.board, move)
    const newTurn = game.turn === Color.WHITE ? Color.BLACK : Color.WHITE
    const newHash = updateHashForMove(game.hash, move)

    // Update position occurrence for threefold repetition
    const newOccurrence = new Map(game.positionOccurrence)
    newOccurrence.set(newHash, (newOccurrence.get(newHash) || 0) + 1)

    // Update countdown - step it for the player who just moved
    // Countdown ticks when the counting player makes a move
    let newCountdown = game.countdown
    if (game.countdown && game.countdown.countColor === game.turn) {
        try {
            newCountdown = stepCountdown(newBoard, newTurn, game.countdown)
        } catch (e) {
            const knownCodes: string[] = Object.values(CountdownErrorCode)
            const isKnownError = e && typeof e === 'object' && 'code' in e &&
                knownCodes.includes((e as { code: string }).code)
            if (!isKnownError) {
                throw e
            }
        }
    }

    return {
        board: newBoard,
        turn: newTurn,
        moveNumber: game.moveNumber,
        hash: newHash,
        positionOccurrence: newOccurrence,
        countdown: newCountdown,
    }
}

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

/**
 * Create a new transposition table
 */
export function createTranspositionTable(maxSize: number = 1000000): TranspositionTable {
    const table = new Map<bigint, TranspositionEntry>()

    return {
        get(hash: bigint): TranspositionEntry | undefined {
            return table.get(hash)
        },
        set(hash: bigint, entry: TranspositionEntry): void {
            if (table.size >= maxSize) {
                table.clear()
            }
            table.set(hash, entry)
        },
        clear(): void {
            table.clear()
        },
        size(): number {
            return table.size
        }
    }
}


/**
 * MVV-LVA (Most Valuable Victim - Least Valuable Attacker) score for move ordering
 * Higher score = search first
 */
export function getMoveScore(move: Move, ttBestMove?: Move | null): number {
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
 * Sort moves for better alpha-beta pruning (mutates array in place)
 * Order: TT best move > captures (MVV-LVA) > promotions > quiet moves
 */
export function orderMoves(moves: Move[], ttBestMove?: Move | null): void {
    moves.sort((a, b) => getMoveScore(b, ttBestMove) - getMoveScore(a, ttBestMove))
}

/**
 * Generate only capture moves for quiescence search
 */
function generateCaptures(state: Board, turn: Color): Move[] {
    const moves = generateLegalMoves(state, turn)
    return moves.filter(m => m.captured)
}

/**
 * Quiescence search - search captures until position is quiet
 * Avoids horizon effect where evaluation at depth 0 misses obvious captures
 */
function quiescence(
    state: Board,
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

/**
 * Internal minimax with TT parameter - works with full Game state
 * to properly track countdown and position occurrence for draw detection
 */
function minimaxWithTT(
    game: Game,
    depth: number,
    alpha: number,
    beta: number,
    tt: TranspositionTable | null
): MinimaxOutput {
    const nodesCounter = { count: 1 }

    // Transposition table lookup
    const hash = tt ? game.hash : 0n
    let ttBestMove: Move | null = null

    if (tt) {
        const cachedEntry = tt.get(hash)
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

    // Check for draw (uses full Game state - checks countdown, repetition, etc.)
    if (isDraw(game)) {
        return {
            bestScore: 0,
            bestMove: null,
            nodesSearched: nodesCounter.count,
        }
    }

    // Generate and check for no legal moves (checkmate/stalemate)
    const moves = generateLegalMoves(game.board, game.turn)
    if (moves.length === 0) {
        const score = game.turn === Color.WHITE ? -Infinity : Infinity
        return {
            bestScore: score,
            bestMove: null,
            nodesSearched: nodesCounter.count,
        }
    }

    // At depth 0, use quiescence search instead of static eval
    if (depth === 0) {
        const score = quiescence(game.board, game.turn, alpha, beta, nodesCounter)
        return {
            bestScore: score,
            bestMove: null,
            nodesSearched: nodesCounter.count,
        }
    }

    // Order moves for better pruning
    orderMoves(moves, ttBestMove)

    const isMaximizing = game.turn === Color.WHITE
    let bestScore = isMaximizing ? -Infinity : Infinity
    let bestMove: Move | null = null
    const originalAlpha = alpha

    for (const move of moves) {
        // Apply move with proper countdown and occurrence tracking
        const newGame = applyMoveForSearch(game, move)
        const result = minimaxWithTT(newGame, depth - 1, alpha, beta, tt)

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
    if (tt) {
        let flag: 'exact' | 'lowerbound' | 'upperbound'
        if (bestScore <= originalAlpha) {
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
        nodesSearched: nodesCounter.count,
    }
}

export function minimax(
    game: Game,
    depth: number,
    alpha: number,
    beta: number,
    tt: TranspositionTable | null = null
): MinimaxOutput {
    return minimaxWithTT(game, depth, alpha, beta, tt)
}

export function findBestMove(
    game: Game,
    depth: number,
    tt: TranspositionTable | null = null
): MinimaxOutput {
    const table = tt ?? createTranspositionTable()
    return minimaxWithTT(game, depth, -Infinity, Infinity, table)
}

export function iterativeDeepening(
    game: Game,
    maxDepth: number,
    timeLimitMs?: number,
    tt: TranspositionTable | null = null
): MinimaxOutput {
    let bestResult: MinimaxOutput = {
        bestScore: 0,
        bestMove: null,
        nodesSearched: 0,
    }

    const table = tt ?? createTranspositionTable()
    const startTime = Date.now()

    for (let depth = 1; depth <= maxDepth; depth++) {
        const result = findBestMove(game, depth, table)

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
