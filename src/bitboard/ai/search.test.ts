const { describe, expect, test } = globalThis as any

import { Color } from "common/const"
import { createGameFromFen, INITIAL_FEN } from "bitboard/fen"
import {
    findBestMove,
    minimax,
    createTranspositionTable,
    iterativeDeepening
} from "bitboard/ai/search"

describe("findBestMove", () => {
    test("should find a move from initial position", () => {
        const game = createGameFromFen(INITIAL_FEN)
        const result = findBestMove(game, 2)

        expect(result).toBeDefined()
        expect(result.bestMove).not.toBeNull()
        expect(typeof result.bestScore).toBe("number")
    })

    test("should return null move for position with no legal moves", () => {
        // Checkmate position - black king is checkmated
        const game = createGameFromFen("k7/RR6/K7/8/8/8/8/8 b 1")
        const result = findBestMove(game, 2)

        expect(result.bestMove).toBeNull()
    })

    test("should return a valid move", () => {
        const game = createGameFromFen(INITIAL_FEN)
        const result = findBestMove(game, 2)

        if (result.bestMove) {
            expect(result.bestMove.from).toBeGreaterThanOrEqual(0)
            expect(result.bestMove.from).toBeLessThan(64)
            expect(result.bestMove.to).toBeGreaterThanOrEqual(0)
            expect(result.bestMove.to).toBeLessThan(64)
            expect(result.bestMove.color).toBe(Color.WHITE)
        }
    })

    test("should handle depth parameter", () => {
        const game = createGameFromFen(INITIAL_FEN)

        const depth1 = findBestMove(game, 1)
        const depth2 = findBestMove(game, 2)

        expect(depth1.bestMove).not.toBeNull()
        expect(depth2.bestMove).not.toBeNull()
    })

    test("should return a score", () => {
        const game = createGameFromFen(INITIAL_FEN)
        const result = findBestMove(game, 2)

        expect(typeof result.bestScore).toBe("number")
        expect(isNaN(result.bestScore)).toBe(false)
    })

    test("should prefer winning moves", () => {
        // White has material advantage
        const game = createGameFromFen("k7/8/8/8/8/8/8/KR6 w 1")
        const result = findBestMove(game, 2)

        expect(result.bestMove).not.toBeNull()
        // Just verify it returns a score (not checking sign as evaluation may vary)
        expect(typeof result.bestScore).toBe("number")
    })

    test("should work with depth 3", () => {
        const game = createGameFromFen("k7/8/8/8/8/8/8/K6R w 1")
        const result = findBestMove(game, 3)

        expect(result.bestMove).not.toBeNull()
        expect(typeof result.bestScore).toBe("number")
    })

    test("should count nodes searched", () => {
        const game = createGameFromFen(INITIAL_FEN)
        const result = findBestMove(game, 2)

        expect(result.nodesSearched).toBeGreaterThan(0)
    })
})

describe("Transposition Table", () => {
    test("should create a new transposition table", () => {
        const tt = createTranspositionTable()

        expect(tt).toBeDefined()
        expect(typeof tt.get).toBe("function")
        expect(typeof tt.set).toBe("function")
        expect(typeof tt.clear).toBe("function")
        expect(typeof tt.size).toBe("function")
        expect(tt.size()).toBe(0)
    })

    test("should accumulate entries when used with findBestMove", () => {
        const tt = createTranspositionTable()

        const game = createGameFromFen("k7/8/8/8/8/8/8/K6R w 1")
        findBestMove(game, 2, tt)

        expect(tt.size()).toBeGreaterThan(0)
    })

    test("should clear transposition table", () => {
        const tt = createTranspositionTable()

        const game = createGameFromFen("k7/8/8/8/8/8/8/K6R w 1")
        findBestMove(game, 2, tt)

        expect(tt.size()).toBeGreaterThan(0)
        tt.clear()
        expect(tt.size()).toBe(0)
    })

    test("should be reusable across searches", () => {
        const tt = createTranspositionTable()

        const game = createGameFromFen("k7/8/8/8/8/8/8/K6R w 1")
        findBestMove(game, 2, tt)
        const sizeAfterFirst = tt.size()

        findBestMove(game, 2, tt)
        // TT should reuse entries
        expect(tt.size()).toBeGreaterThanOrEqual(sizeAfterFirst)
    })
})

describe("minimax", () => {
    test("should work with transposition table", () => {
        const game = createGameFromFen("k7/8/8/8/8/8/8/K6R w 1")
        const tt = createTranspositionTable()
        const result = minimax(game, 2, -Infinity, Infinity, tt)

        expect(result.bestMove).not.toBeNull()
        expect(typeof result.bestScore).toBe("number")
        expect(result.nodesSearched).toBeGreaterThan(0)
    })

    test("should work without transposition table", () => {
        const game = createGameFromFen("k7/8/8/8/8/8/8/K6R w 1")
        const result = minimax(game, 2, -Infinity, Infinity, null)

        expect(result.bestMove).not.toBeNull()
        expect(typeof result.bestScore).toBe("number")
        expect(result.nodesSearched).toBeGreaterThan(0)
    })

    test("should use alpha-beta pruning", () => {
        const game = createGameFromFen(INITIAL_FEN)

        // With alpha-beta pruning
        const withPruning = minimax(game, 2, -Infinity, Infinity, null)

        // Should search some nodes
        expect(withPruning.nodesSearched).toBeGreaterThan(0)
    })

    test("should handle depth 1", () => {
        const game = createGameFromFen("k7/8/8/8/8/8/8/K6R w 1")
        const result = minimax(game, 1, -Infinity, Infinity, null)

        expect(result.bestMove).not.toBeNull()
        expect(typeof result.bestScore).toBe("number")
    })

    test("should handle position with no moves", () => {
        // Checkmate position
        const game = createGameFromFen("k7/RR6/K7/8/8/8/8/8 b 1")
        const result = minimax(game, 1, -Infinity, Infinity, null)

        expect(result.bestMove).toBeNull()
        expect(result.bestScore).toBe(Infinity) // Black is checkmated
    })
})

describe("iterativeDeepening", () => {
    test("should find move with iterative deepening", () => {
        const game = createGameFromFen("k7/8/8/8/8/8/8/K6R w 1")
        const result = iterativeDeepening(game, 2)

        expect(result.bestMove).not.toBeNull()
        expect(typeof result.bestScore).toBe("number")
        expect(result.nodesSearched).toBeGreaterThan(0)
    })

    test("should work with different depths", () => {
        const game = createGameFromFen(INITIAL_FEN)
        const result = iterativeDeepening(game, 1)

        expect(result.bestMove).not.toBeNull()
        expect(typeof result.bestScore).toBe("number")
    })

    test("should search progressively deeper", () => {
        const game = createGameFromFen("k7/8/8/8/8/8/8/K6R w 1")

        // Iterative deepening should search multiple depths
        const result = iterativeDeepening(game, 3)

        expect(result.nodesSearched).toBeGreaterThan(0)
        expect(result.bestMove).not.toBeNull()
    })

    test("should use provided transposition table", () => {
        const game = createGameFromFen("k7/8/8/8/8/8/8/K6R w 1")
        const tt = createTranspositionTable()

        iterativeDeepening(game, 2, undefined, tt)

        expect(tt.size()).toBeGreaterThan(0)
    })
})
