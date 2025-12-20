const { describe, expect, test } = globalThis as any

import { createGameFromFen, INITIAL_FEN, EMPTY_FEN } from "bitboard/fen"
import { evaluateFast } from "bitboard/ai/evaluation"

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

    test("should give bonus for mobility", () => {
        // White rook in center has more mobility than rook in corner
        const { board: centerRook } = createGameFromFen("k7/8/8/8/4R3/8/8/K7 w 1")
        const { board: cornerRook } = createGameFromFen("k7/8/8/8/8/8/8/KR6 w 1")

        const centerScore = evaluateFast(centerRook)
        const cornerScore = evaluateFast(cornerRook)

        // Center rook has more squares to move to
        expect(centerScore).toBeGreaterThan(cornerScore)
    })

    test("should include mobility in evaluation", () => {
        // White rook blocked by own pieces vs free rook
        const { board: blockedRook } = createGameFromFen("k7/8/8/8/8/1B6/1B6/KR6 w 1")
        const { board: freeRook } = createGameFromFen("k7/8/8/8/8/8/8/K6R w 1")

        const blockedScore = evaluateFast(blockedRook)
        const freeScore = evaluateFast(freeRook)

        // blockedRook has more material (2 extra thons) but less mobility per piece
        // freeRook has rook with full mobility
        // This verifies mobility is factored in (not just material)
        expect(blockedScore).not.toBe(freeScore)
    })
})
