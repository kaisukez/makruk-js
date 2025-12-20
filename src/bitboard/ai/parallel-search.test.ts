const { describe, expect, test } = globalThis as any

import { Color, Piece, CountType } from "common/const"
import { createGameFromFen, INITIAL_FEN } from "bitboard/fen"
import { generateLegalMoves } from "bitboard/moves/generation"
import {
    distributeMoves,
    searchMoves,
    searchMovesWithSharedBounds,
    combineResults,
    createSharedBounds,
    wrapSharedBounds,
    getRecommendedWorkers,
} from "bitboard/ai/parallel-search"
import { createTranspositionTable } from "bitboard/ai/search"
import type { Move, Game } from "bitboard/types"

describe("distributeMoves", () => {
    test("should distribute moves evenly across workers", () => {
        const moves = [1, 2, 3, 4, 5, 6]
        const buckets = distributeMoves(moves, 2)

        expect(buckets.length).toBe(2)
        expect(buckets[0]).toEqual([1, 3, 5])
        expect(buckets[1]).toEqual([2, 4, 6])
    })

    test("should handle more workers than moves", () => {
        const moves = [1, 2]
        const buckets = distributeMoves(moves, 4)

        expect(buckets.length).toBe(4)
        expect(buckets[0]).toEqual([1])
        expect(buckets[1]).toEqual([2])
        expect(buckets[2]).toEqual([])
        expect(buckets[3]).toEqual([])
    })

    test("should handle single worker", () => {
        const moves = [1, 2, 3]
        const buckets = distributeMoves(moves, 1)

        expect(buckets.length).toBe(1)
        expect(buckets[0]).toEqual([1, 2, 3])
    })

    test("should handle empty moves", () => {
        const moves: number[] = []
        const buckets = distributeMoves(moves, 3)

        expect(buckets.length).toBe(3)
        expect(buckets[0]).toEqual([])
        expect(buckets[1]).toEqual([])
        expect(buckets[2]).toEqual([])
    })
})

describe("searchMoves", () => {
    test("should find a move from initial position", () => {
        const game = createGameFromFen(INITIAL_FEN)
        const moves = generateLegalMoves(game.board, game.turn)
        const result = searchMoves(game, moves, 2)

        expect(result.bestMove).not.toBeNull()
        expect(result.nodesSearched).toBeGreaterThan(0)
        expect(typeof result.bestScore).toBe("number")
    })

    test("should search subset of moves", () => {
        const game = createGameFromFen(INITIAL_FEN)
        const allMoves = generateLegalMoves(game.board, game.turn)
        const subset = allMoves.slice(0, 3)
        const result = searchMoves(game, subset, 2)

        expect(result.bestMove).not.toBeNull()
        // Best move should be one of the subset moves
        expect(subset.some(m => m.from === result.bestMove!.from && m.to === result.bestMove!.to)).toBe(true)
    })

    test("should return null move for empty moves array", () => {
        const game = createGameFromFen(INITIAL_FEN)
        const result = searchMoves(game, [], 2)

        expect(result.bestMove).toBeNull()
    })

    test("should use provided transposition table", () => {
        const game = createGameFromFen(INITIAL_FEN)
        const moves = generateLegalMoves(game.board, game.turn).slice(0, 5)
        const tt = createTranspositionTable()

        const result = searchMoves(game, moves, 3, tt)

        expect(result.bestMove).not.toBeNull()
        expect(tt.size()).toBeGreaterThan(0)
    })

    test("should detect draw by countdown", () => {
        // Position where countdown is about to expire
        const game: Game = {
            ...createGameFromFen("k7/8/8/8/8/8/8/KR6 w 1"),
            countdown: {
                countColor: Color.WHITE,
                countType: CountType.PIECE_POWER_COUNTDOWN,
                count: 7,
                countFrom: 1,
                countTo: 8,
            }
        }
        const moves = generateLegalMoves(game.board, game.turn)
        const result = searchMoves(game, moves, 3)

        // Bot should recognize the countdown situation
        expect(result.bestMove).not.toBeNull()
    })
})

describe("createSharedBounds and wrapSharedBounds", () => {
    test("should create shared bounds for white (maximizing)", () => {
        const bounds = createSharedBounds(true)

        expect(bounds.buffer).toBeInstanceOf(SharedArrayBuffer)
        expect(bounds.view).toBeInstanceOf(Float64Array)
        expect(bounds.isMaximizing).toBe(true)
        expect(bounds.view[0]).toBe(-Infinity)
    })

    test("should create shared bounds for black (minimizing)", () => {
        const bounds = createSharedBounds(false)

        expect(bounds.buffer).toBeInstanceOf(SharedArrayBuffer)
        expect(bounds.view).toBeInstanceOf(Float64Array)
        expect(bounds.isMaximizing).toBe(false)
        expect(bounds.view[0]).toBe(Infinity)
    })

    test("should wrap existing SharedArrayBuffer", () => {
        const original = createSharedBounds(true)
        original.view[0] = 5.5

        const wrapped = wrapSharedBounds(original.buffer, true)

        expect(wrapped.view[0]).toBe(5.5)
        expect(wrapped.isMaximizing).toBe(true)
    })

    test("wrapped bounds should share memory with original", () => {
        const original = createSharedBounds(true)
        const wrapped = wrapSharedBounds(original.buffer, true)

        original.view[0] = 10
        expect(wrapped.view[0]).toBe(10)

        wrapped.view[0] = 20
        expect(original.view[0]).toBe(20)
    })
})

describe("searchMovesWithSharedBounds", () => {
    test("should find a move from initial position", () => {
        const game = createGameFromFen(INITIAL_FEN)
        const moves = generateLegalMoves(game.board, game.turn)
        const sharedBounds = createSharedBounds(true)
        const result = searchMovesWithSharedBounds(game, moves, 2, sharedBounds)

        expect(result.bestMove).not.toBeNull()
        expect(result.nodesSearched).toBeGreaterThan(0)
    })

    test("should update shared bounds when finding better score", () => {
        const game = createGameFromFen("k7/8/8/8/8/8/8/KR6 w 1") // White has rook advantage
        const moves = generateLegalMoves(game.board, game.turn)
        const sharedBounds = createSharedBounds(true)

        searchMovesWithSharedBounds(game, moves, 2, sharedBounds)

        // For white (maximizing), the bound should be updated from -Infinity
        expect(sharedBounds.view[0]).toBeGreaterThan(-Infinity)
    })

    test("should use shared bounds for pruning", () => {
        const game = createGameFromFen(INITIAL_FEN)
        const allMoves = generateLegalMoves(game.board, game.turn)
        const sharedBounds = createSharedBounds(true)

        // Set a high initial bound to test pruning
        sharedBounds.view[0] = 100

        const result = searchMovesWithSharedBounds(game, allMoves.slice(0, 5), 2, sharedBounds)

        expect(result.bestMove).not.toBeNull()
    })

    test("should work with transposition table", () => {
        const game = createGameFromFen(INITIAL_FEN)
        const moves = generateLegalMoves(game.board, game.turn).slice(0, 5)
        const sharedBounds = createSharedBounds(true)
        const tt = createTranspositionTable()

        const result = searchMovesWithSharedBounds(game, moves, 3, sharedBounds, tt)

        expect(result.bestMove).not.toBeNull()
        expect(tt.size()).toBeGreaterThan(0)
    })
})

describe("combineResults", () => {
    test("should select highest score for white (maximizing)", () => {
        const results = [
            { bestScore: 5, bestMove: { from: 0, to: 8, piece: Piece.BIA, color: Color.WHITE } as Move, nodesSearched: 100 },
            { bestScore: 10, bestMove: { from: 1, to: 9, piece: Piece.BIA, color: Color.WHITE } as Move, nodesSearched: 150 },
            { bestScore: 3, bestMove: { from: 2, to: 10, piece: Piece.BIA, color: Color.WHITE } as Move, nodesSearched: 80 },
        ]

        const combined = combineResults(results, true)

        expect(combined.bestScore).toBe(10)
        expect(combined.bestMove?.from).toBe(1)
        expect(combined.nodesSearched).toBe(330)
    })

    test("should select lowest score for black (minimizing)", () => {
        const results = [
            { bestScore: -5, bestMove: { from: 48, to: 40, piece: Piece.BIA, color: Color.BLACK } as Move, nodesSearched: 100 },
            { bestScore: -10, bestMove: { from: 49, to: 41, piece: Piece.BIA, color: Color.BLACK } as Move, nodesSearched: 150 },
            { bestScore: -3, bestMove: { from: 50, to: 42, piece: Piece.BIA, color: Color.BLACK } as Move, nodesSearched: 80 },
        ]

        const combined = combineResults(results, false)

        expect(combined.bestScore).toBe(-10)
        expect(combined.bestMove?.from).toBe(49)
        expect(combined.nodesSearched).toBe(330)
    })

    test("should handle empty results", () => {
        const combined = combineResults([], true)

        expect(combined.bestScore).toBe(-Infinity)
        expect(combined.bestMove).toBeNull()
        expect(combined.nodesSearched).toBe(0)
    })

    test("should handle single result", () => {
        const results = [
            { bestScore: 5, bestMove: { from: 0, to: 8, piece: Piece.BIA, color: Color.WHITE } as Move, nodesSearched: 100 },
        ]

        const combined = combineResults(results, true)

        expect(combined.bestScore).toBe(5)
        expect(combined.bestMove?.from).toBe(0)
        expect(combined.nodesSearched).toBe(100)
    })

    test("should handle results with null moves", () => {
        const results = [
            { bestScore: -Infinity, bestMove: null, nodesSearched: 0 },
            { bestScore: 5, bestMove: { from: 0, to: 8, piece: Piece.BIA, color: Color.WHITE } as Move, nodesSearched: 100 },
        ]

        const combined = combineResults(results, true)

        expect(combined.bestScore).toBe(5)
        expect(combined.bestMove?.from).toBe(0)
    })
})

describe("getRecommendedWorkers", () => {
    test("should return a positive number", () => {
        const workers = getRecommendedWorkers()

        expect(workers).toBeGreaterThanOrEqual(1)
    })
})
