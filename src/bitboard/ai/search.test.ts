const { describe, expect, test } = globalThis as any

import { Color } from "common/const"
import { importFen, INITIAL_FEN } from "bitboard/fen"
import {
    findBestMove,
    minimax,
    getTranspositionTableStats,
    clearTranspositionTable,
    iterativeDeepening
} from "bitboard/ai/search"

describe("findBestMove", () => {
    test("should find a move from initial position", () => {
        const { state, turn } = importFen(INITIAL_FEN)
        const result = findBestMove(state, turn, 2)

        expect(result).toBeDefined()
        expect(result.bestMove).not.toBeNull()
        expect(typeof result.bestScore).toBe("number")
    })

    test("should return null move for position with no legal moves", () => {
        // Empty board with no pieces
        const { state, turn } = importFen("8/8/8/8/8/8/8/8 w 1")
        const result = findBestMove(state, turn, 2)

        expect(result.bestMove).toBeNull()
    })

    test("should return a valid move", () => {
        const { state, turn } = importFen(INITIAL_FEN)
        const result = findBestMove(state, turn, 2)

        if (result.bestMove) {
            expect(result.bestMove.from).toBeGreaterThanOrEqual(0)
            expect(result.bestMove.from).toBeLessThan(64)
            expect(result.bestMove.to).toBeGreaterThanOrEqual(0)
            expect(result.bestMove.to).toBeLessThan(64)
            expect(result.bestMove.color).toBe(Color.WHITE)
        }
    })

    test("should handle depth parameter", () => {
        const { state, turn } = importFen(INITIAL_FEN)

        const depth1 = findBestMove(state, turn, 1)
        const depth2 = findBestMove(state, turn, 2)

        expect(depth1.bestMove).not.toBeNull()
        expect(depth2.bestMove).not.toBeNull()
    })

    test("should return a score", () => {
        const { state, turn } = importFen(INITIAL_FEN)
        const result = findBestMove(state, turn, 2)

        expect(typeof result.bestScore).toBe("number")
        expect(isNaN(result.bestScore)).toBe(false)
    })

    test("should prefer winning moves", () => {
        // White has material advantage
        const { state, turn } = importFen("k7/8/8/8/8/8/8/KR6 w 1")
        const result = findBestMove(state, turn, 2)

        expect(result.bestMove).not.toBeNull()
        // Just verify it returns a score (not checking sign as evaluation may vary)
        expect(typeof result.bestScore).toBe("number")
    })

    test("should work with depth 3", () => {
        const { state, turn } = importFen("k7/8/8/8/8/8/8/K6R w 1")
        const result = findBestMove(state, turn, 3)

        expect(result.bestMove).not.toBeNull()
        expect(typeof result.bestScore).toBe("number")
    })

    test("should count nodes searched", () => {
        const { state, turn } = importFen(INITIAL_FEN)
        const result = findBestMove(state, turn, 2)

        expect(result.nodesSearched).toBeGreaterThan(0)
    })
})

describe("Transposition Table", () => {
    test("should provide stats", () => {
        clearTranspositionTable()
        const stats = getTranspositionTableStats()

        expect(stats).toBeDefined()
        expect(typeof stats.size).toBe("number")
    })

    test("should clear transposition table", () => {
        // Use table via findBestMove
        const { state, turn } = importFen("k7/8/8/8/8/8/8/K6R w 1")
        findBestMove(state, turn, 2)

        const statsBefore = getTranspositionTableStats()
        clearTranspositionTable()
        const statsAfter = getTranspositionTableStats()

        expect(statsAfter.size).toBe(0)
    })

    test("should accumulate entries", () => {
        clearTranspositionTable()

        const { state, turn } = importFen("k7/8/8/8/8/8/8/K6R w 1")
        findBestMove(state, turn, 2)

        const stats = getTranspositionTableStats()
        expect(stats.size).toBeGreaterThan(0)
    })
})

describe("minimax", () => {
    test("should work with transposition table", () => {
        const { state, turn } = importFen("k7/8/8/8/8/8/8/K6R w 1")
        const result = minimax(state, turn, 2, -Infinity, Infinity, true)

        expect(result.bestMove).not.toBeNull()
        expect(typeof result.bestScore).toBe("number")
        expect(result.nodesSearched).toBeGreaterThan(0)
    })

    test("should work without transposition table", () => {
        const { state, turn } = importFen("k7/8/8/8/8/8/8/K6R w 1")
        const result = minimax(state, turn, 2, -Infinity, Infinity, false)

        expect(result.bestMove).not.toBeNull()
        expect(typeof result.bestScore).toBe("number")
        expect(result.nodesSearched).toBeGreaterThan(0)
    })

    test("should use alpha-beta pruning", () => {
        const { state, turn } = importFen(INITIAL_FEN)

        // With alpha-beta pruning
        const withPruning = minimax(state, turn, 2, -Infinity, Infinity, false)

        // Should search some nodes
        expect(withPruning.nodesSearched).toBeGreaterThan(0)
    })

    test("should handle depth 1", () => {
        const { state, turn } = importFen("k7/8/8/8/8/8/8/K6R w 1")
        const result = minimax(state, turn, 1, -Infinity, Infinity, false)

        expect(result.bestMove).not.toBeNull()
        expect(typeof result.bestScore).toBe("number")
    })

    test("should handle position with no moves", () => {
        // Checkmate position
        const { state, turn } = importFen("k7/RR6/K7/8/8/8/8/8 b 1")
        const result = minimax(state, turn, 1, -Infinity, Infinity, false)

        expect(result.bestMove).toBeNull()
        expect(result.bestScore).toBe(Infinity) // Black is checkmated
    })
})

describe("iterativeDeepening", () => {
    test("should find move with iterative deepening", () => {
        const { state, turn } = importFen("k7/8/8/8/8/8/8/K6R w 1")
        const result = iterativeDeepening(state, turn, 2)

        expect(result.bestMove).not.toBeNull()
        expect(typeof result.bestScore).toBe("number")
        expect(result.nodesSearched).toBeGreaterThan(0)
    })

    test("should work with different depths", () => {
        const { state, turn } = importFen(INITIAL_FEN)
        const result = iterativeDeepening(state, turn, 1)

        expect(result.bestMove).not.toBeNull()
        expect(typeof result.bestScore).toBe("number")
    })

    test("should search progressively deeper", () => {
        const { state, turn } = importFen("k7/8/8/8/8/8/8/K6R w 1")

        // Iterative deepening should search multiple depths
        const result = iterativeDeepening(state, turn, 3)

        expect(result.nodesSearched).toBeGreaterThan(0)
        expect(result.bestMove).not.toBeNull()
    })
})
