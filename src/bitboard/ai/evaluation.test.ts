const { describe, expect, test } = globalThis as any

import { createGameFromFen, INITIAL_FEN, EMPTY_FEN } from "bitboard/fen"
import { evaluateFast } from "bitboard/ai/evaluation"
import { isDraw } from "bitboard/rules/status"

describe("evaluateFast", () => {
    test("should evaluate initial position as roughly equal", () => {
        const { board: state } = createGameFromFen(INITIAL_FEN)
        const score = evaluateFast(state)

        // Initial position should be close to 0 (equal material)
        expect(Math.abs(score)).toBeLessThan(100)
    })

    test("should evaluate empty board as 0", () => {
        const { board: state } = createGameFromFen(EMPTY_FEN)
        const score = evaluateFast(state)

        expect(score).toBe(0)
    })

    test("should return positive score for white advantage", () => {
        // White has extra rook
        const { board: state } = createGameFromFen("k7/8/8/8/8/8/8/KR6 w 1")
        const score = evaluateFast(state)

        expect(score).toBeGreaterThan(0)
    })

    test("should return negative score for black advantage", () => {
        // Black has extra rook
        const { board: state } = createGameFromFen("kr6/8/8/8/8/8/8/K7 w 1")
        const score = evaluateFast(state)

        expect(score).toBeLessThan(0)
    })

    test("should value pieces correctly", () => {
        const { board: rook } = createGameFromFen("k7/8/8/8/8/8/8/KR6 w 1")
        const { board: thon } = createGameFromFen("k7/8/8/8/8/8/8/KT6 w 1")

        const rookScore = evaluateFast(rook)
        const thonScore = evaluateFast(thon)

        // Rook should be worth more than thon
        expect(rookScore).toBeGreaterThan(thonScore)
    })

    test("should return a number", () => {
        const { board: state } = createGameFromFen(INITIAL_FEN)
        const score = evaluateFast(state)

        expect(typeof score).toBe("number")
        expect(isNaN(score)).toBe(false)
    })
})

describe("isDraw", () => {
    test("should return true for only kings remaining", () => {
        const game = createGameFromFen("k7/8/8/8/8/8/8/7K w 1")
        expect(isDraw(game)).toBe(true)
    })

    test("should return false for position with pieces", () => {
        const game = createGameFromFen("k7/8/8/8/8/8/8/K6R w 1")
        expect(isDraw(game)).toBe(false)
    })

    test("should return false for initial position", () => {
        const game = createGameFromFen(INITIAL_FEN)
        expect(isDraw(game)).toBe(false)
    })
})
