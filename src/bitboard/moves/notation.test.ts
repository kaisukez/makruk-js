import { moveToSan, moveFromSan, squareToAlgebraic } from "bitboard/moves/notation"
import { createGameFromFen, INITIAL_FEN } from "bitboard/fen"
import { generateLegalMoves } from "bitboard/moves/generation"
import { Color } from "common/const"

const { describe, expect, test } = globalThis as any

describe("Mask64 SAN Notation Tests", () => {
    test("squareToAlgebraic converts correctly", () => {
        expect(squareToAlgebraic(0)).toBe("a1")
        expect(squareToAlgebraic(7)).toBe("h1")
        expect(squareToAlgebraic(56)).toBe("a8")
        expect(squareToAlgebraic(63)).toBe("h8")
        expect(squareToAlgebraic(16)).toBe("a3")
        expect(squareToAlgebraic(27)).toBe("d4")
    })

    test("moveToSan generates SAN for initial position moves", () => {
        const { board: state } = createGameFromFen(INITIAL_FEN)
        const moves = generateLegalMoves(state, Color.WHITE)
        expect(moves.length).toBeGreaterThan(0)

        // All moves should have valid SAN
        moves.forEach(move => {
            const san = moveToSan(state, Color.WHITE, move)
            expect(san).toBeTruthy()
            expect(san.length).toBeGreaterThan(0)
        })
    })

    test("round-trip: moveToSan then moveFromSan", () => {
        const { board: state } = createGameFromFen(INITIAL_FEN)
        const moves = generateLegalMoves(state, Color.WHITE)

        // Take first 10 moves and ensure round-trip works
        for (const move of moves.slice(0, 10)) {
            const san = moveToSan(state, Color.WHITE, move)
            const parsed = moveFromSan(state, Color.WHITE, san)

            expect(parsed).toBeTruthy()
            expect(parsed?.from).toBe(move.from)
            expect(parsed?.to).toBe(move.to)
            expect(parsed?.piece).toBe(move.piece)
        }
    })
})
