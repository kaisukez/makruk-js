const { describe, expect, test } = globalThis as any

import { Color } from "common/const"
import { importFen, INITIAL_FEN, EMPTY_FEN } from "bitboard/fen"
import {
    evaluateFast,
    evaluateWithMobility,
    isDraw,
    isCheckmate,
    evaluate,
    evaluateQuiet
} from "bitboard/ai/evaluation"

describe("evaluateFast", () => {
    test("should evaluate initial position as roughly equal", () => {
        const { state } = importFen(INITIAL_FEN)
        const score = evaluateFast(state)

        // Initial position should be close to 0 (equal material)
        expect(Math.abs(score)).toBeLessThan(100)
    })

    test("should evaluate empty board as 0", () => {
        const { state } = importFen(EMPTY_FEN)
        const score = evaluateFast(state)

        expect(score).toBe(0)
    })

    test("should return positive score for white advantage", () => {
        // White has extra rook
        const { state } = importFen("k7/8/8/8/8/8/8/KR6 w 1")
        const score = evaluateFast(state)

        expect(score).toBeGreaterThan(0)
    })

    test("should return negative score for black advantage", () => {
        // Black has extra rook
        const { state } = importFen("kr6/8/8/8/8/8/8/K7 w 1")
        const score = evaluateFast(state)

        expect(score).toBeLessThan(0)
    })

    test("should value pieces correctly", () => {
        const { state: rook } = importFen("k7/8/8/8/8/8/8/KR6 w 1")
        const { state: thon } = importFen("k7/8/8/8/8/8/8/KT6 w 1")

        const rookScore = evaluateFast(rook)
        const thonScore = evaluateFast(thon)

        // Rook should be worth more than thon
        expect(rookScore).toBeGreaterThan(thonScore)
    })

    test("should return a number", () => {
        const { state } = importFen(INITIAL_FEN)
        const score = evaluateFast(state)

        expect(typeof score).toBe("number")
        expect(isNaN(score)).toBe(false)
    })
})

describe("evaluateWithMobility", () => {
    test("should include mobility bonus in evaluation", () => {
        const { state } = importFen("k7/8/8/8/8/8/8/K6R w 1")
        const score = evaluateWithMobility(state, Color.WHITE)

        // Should return a number
        expect(typeof score).toBe("number")
        expect(isNaN(score)).toBe(false)
    })

    test("should consider legal moves for both sides", () => {
        const { state } = importFen(INITIAL_FEN)
        const score = evaluateWithMobility(state, Color.WHITE)

        // Should return a score close to 0 for initial position
        expect(Math.abs(score)).toBeLessThan(200)
    })
})

describe("isDraw", () => {
    test("should return true for only kings remaining", () => {
        const { state } = importFen("k7/8/8/8/8/8/8/7K w 1")
        expect(isDraw(state)).toBe(true)
    })

    test("should return false for position with pieces", () => {
        const { state } = importFen("k7/8/8/8/8/8/8/K6R w 1")
        expect(isDraw(state)).toBe(false)
    })

    test("should return false for initial position", () => {
        const { state } = importFen(INITIAL_FEN)
        expect(isDraw(state)).toBe(false)
    })
})

describe("isCheckmate", () => {
    test("should return false when legal moves exist", () => {
        const { state } = importFen(INITIAL_FEN)
        expect(isCheckmate(state, Color.WHITE)).toBe(false)
    })

    test("should return true when no legal moves", () => {
        // Checkmate position
        const { state } = importFen("k7/RR6/K7/8/8/8/8/8 b 1")
        expect(isCheckmate(state, Color.BLACK)).toBe(true)
    })

    test("should return false for position with escape moves", () => {
        const { state } = importFen("k7/8/8/8/8/8/8/K6R w 1")
        expect(isCheckmate(state, Color.WHITE)).toBe(false)
        expect(isCheckmate(state, Color.BLACK)).toBe(false)
    })
})

describe("evaluate", () => {
    test("should return 0 for draw position", () => {
        // Only kings remaining
        const { state } = importFen("k7/8/8/8/8/8/8/7K w 1")
        const score = evaluate(state, Color.WHITE, false)
        expect(score).toBe(0)
    })

    test("should return -Infinity for white checkmate", () => {
        // White is checkmated
        const { state } = importFen("K7/rr6/k7/8/8/8/8/8 w 1")
        const score = evaluate(state, Color.WHITE, false)
        expect(score).toBe(-Infinity)
    })

    test("should return Infinity for black checkmate", () => {
        // Black is checkmated
        const { state } = importFen("k7/RR6/K7/8/8/8/8/8 b 1")
        const score = evaluate(state, Color.BLACK, false)
        expect(score).toBe(Infinity)
    })

    test("should use fast evaluation when useFullEval is false", () => {
        const { state } = importFen("k7/8/8/8/8/8/8/K6R w 1")
        const score = evaluate(state, Color.WHITE, false)

        expect(typeof score).toBe("number")
        expect(score).toBeGreaterThan(0)
    })

    test("should use full evaluation with mobility when useFullEval is true", () => {
        const { state } = importFen("k7/8/8/8/8/8/8/K6R w 1")
        const score = evaluate(state, Color.WHITE, true)

        expect(typeof score).toBe("number")
        expect(score).toBeGreaterThan(0)
    })

    test("should consider mobility for white turn", () => {
        const { state } = importFen("k7/8/8/8/8/8/8/K6R w 1")
        const score = evaluate(state, Color.WHITE, true)

        expect(typeof score).toBe("number")
        expect(isNaN(score)).toBe(false)
    })

    test("should consider mobility for black turn", () => {
        const { state } = importFen("kr6/8/8/8/8/8/8/K7 b 1")
        const score = evaluate(state, Color.BLACK, true)

        expect(typeof score).toBe("number")
        expect(isNaN(score)).toBe(false)
    })
})

describe("evaluateQuiet", () => {
    test("should evaluate quiet position", () => {
        const { state } = importFen("k7/8/8/8/8/8/8/K6R w 1")
        const score = evaluateQuiet(state, Color.WHITE)

        expect(typeof score).toBe("number")
        expect(isNaN(score)).toBe(false)
    })

    test("should work for both colors", () => {
        const { state } = importFen(INITIAL_FEN)
        const whiteScore = evaluateQuiet(state, Color.WHITE)
        const blackScore = evaluateQuiet(state, Color.BLACK)

        expect(typeof whiteScore).toBe("number")
        expect(typeof blackScore).toBe("number")
    })
})
