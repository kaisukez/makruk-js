const { describe, expect, test } = globalThis as any

import { Color, CountType, Piece, SquareIndex } from "common/const"
import { createGameFromFen, INITIAL_FEN, EMPTY_FEN } from "0x88/fen/importer"
import { exportFen } from "0x88/fen/exporter"

describe("round-trip tests (import → export → import)", () => {
    test("should maintain INITIAL_FEN through round-trip", () => {
        const state1 = createGameFromFen(INITIAL_FEN)
        const exported = exportFen(state1)
        const state2 = createGameFromFen(exported)

        expect(exported).toBe(INITIAL_FEN)
        expect(state2.turn).toBe(state1.turn)
        expect(state2.moveNumber).toBe(state1.moveNumber)
        expect(state2.countdown).toBe(state1.countdown)
    })

    test("should maintain EMPTY_FEN through round-trip", () => {
        const state1 = createGameFromFen(EMPTY_FEN)
        const exported = exportFen(state1)
        const state2 = createGameFromFen(exported)

        expect(exported).toBe(EMPTY_FEN)
        expect(state2.turn).toBe(state1.turn)
        expect(state2.moveNumber).toBe(state1.moveNumber)
    })

    test("should maintain FEN with countdown through round-trip", () => {
        const originalFen = "4k3/8/8/8/8/8/8/4K3 w 10 w bp 64 10 100"
        const state1 = createGameFromFen(originalFen)
        const exported = exportFen(state1)
        const state2 = createGameFromFen(exported)

        expect(exported).toBe(originalFen)
        expect(state2.countdown).toEqual(state1.countdown)
    })

    test("should maintain complex position through round-trip", () => {
        const originalFen = "r1t1k1t1/8/b1b1b1b1/8/8/B1B1B1B1/8/R1T1K1T1 b 42"
        const state1 = createGameFromFen(originalFen)
        const exported = exportFen(state1)
        const state2 = createGameFromFen(exported)

        expect(exported).toBe(originalFen)
        expect(state2.turn).toBe(state1.turn)
        expect(state2.moveNumber).toBe(state1.moveNumber)
    })

    test("should maintain FEN with flipped bia through round-trip", () => {
        const originalFen = "4k3/8/8/3f4/3F4/8/8/4K3 w 15"
        const state1 = createGameFromFen(originalFen)
        const exported = exportFen(state1)
        const state2 = createGameFromFen(exported)

        expect(exported).toBe(originalFen)
        expect(state2.boardState[SquareIndex.d5]).toEqual(state1.boardState[SquareIndex.d5])
        expect(state2.boardState[SquareIndex.d4]).toEqual(state1.boardState[SquareIndex.d4])
    })

    test("should maintain piece power countdown through round-trip", () => {
        const originalFen = "4k3/8/8/8/8/8/8/4K3 b 25 b pp 5 25 50"
        const state1 = createGameFromFen(originalFen)
        const exported = exportFen(state1)
        const state2 = createGameFromFen(exported)

        expect(exported).toBe(originalFen)
        expect(state2.countdown?.countType).toBe(CountType.PIECE_POWER_COUNTDOWN)
    })

    test("should maintain all piece types through round-trip", () => {
        const originalFen = "rmtektmr/bbbbbbbb/8/8/8/8/BBBBBBBB/RMTKETMR w 1"
        const state1 = createGameFromFen(originalFen)
        const exported = exportFen(state1)
        const state2 = createGameFromFen(exported)

        expect(exported).toBe(originalFen)

        // Verify all piece types are preserved
        expect(state2.boardState[SquareIndex.a1]).toEqual([Color.WHITE, Piece.RUA])
        expect(state2.boardState[SquareIndex.b1]).toEqual([Color.WHITE, Piece.MA])
        expect(state2.boardState[SquareIndex.c1]).toEqual([Color.WHITE, Piece.THON])
        expect(state2.boardState[SquareIndex.d1]).toEqual([Color.WHITE, Piece.KHUN])
        expect(state2.boardState[SquareIndex.e1]).toEqual([Color.WHITE, Piece.MET])
    })
})

describe("edge cases", () => {
    test("should handle FEN with only kings (minimal valid position)", () => {
        const fen = "4k3/8/8/8/8/8/8/4K3 w 1"
        const state = createGameFromFen(fen)
        const exported = exportFen(state)

        expect(exported).toBe(fen)
    })

    test("should handle FEN with kings in different positions", () => {
        const fen = "k7/8/8/8/8/8/8/7K w 1"
        const state = createGameFromFen(fen)
        const exported = exportFen(state)

        expect(exported).toBe(fen)
        expect(state.boardState[SquareIndex.a8]).toEqual([Color.BLACK, Piece.KHUN])
        expect(state.boardState[SquareIndex.h1]).toEqual([Color.WHITE, Piece.KHUN])
    })

    test("should handle FEN with maximum empty squares representation", () => {
        const fen = "4k3/8/8/8/8/8/8/4K3 w 1"
        const state = createGameFromFen(fen)

        // Count empty squares
        let emptyCount = 0
        for (let i = SquareIndex.a1; i <= SquareIndex.h8; i++) {
            if (!(i & 0x88) && state.boardState[i] === null) {
                emptyCount++
            }
        }

        expect(emptyCount).toBe(62) // 64 - 2 kings
    })

    test("should handle FEN with no empty squares on a rank", () => {
        const fen = "4k3/8/8/8/8/8/bbbbbbbb/4K3 w 1"
        const state = createGameFromFen(fen)
        const exported = exportFen(state)

        expect(exported).toBe(fen)
    })

    test("should handle FEN with alternating pieces and empty squares", () => {
        const fen = "4k3/8/8/b1b1b1b1/B1B1B1B1/8/8/4K3 w 1"
        const state = createGameFromFen(fen)
        const exported = exportFen(state)

        expect(exported).toBe(fen)
    })

    test("should handle FEN with promoted pawns (flipped bia)", () => {
        const fen = "4k3/8/8/f1f1f1f1/F1F1F1F1/8/8/4K3 w 1"
        const state = createGameFromFen(fen)
        const exported = exportFen(state)

        expect(exported).toBe(fen)

        // Verify flipped bia pieces
        expect(state.boardState[SquareIndex.a5]).toEqual([Color.BLACK, Piece.FLIPPED_BIA])
        expect(state.boardState[SquareIndex.a4]).toEqual([Color.WHITE, Piece.FLIPPED_BIA])
    })

    test("should handle FEN with different move numbers", () => {
        const testMoveNumbers = [1, 5, 10, 50, 100, 999, 1000, 9999]

        testMoveNumbers.forEach(moveNum => {
            const fen = `4k3/8/8/8/8/8/8/4K3 w ${moveNum}`
            const state = createGameFromFen(fen)
            const exported = exportFen(state)

            expect(exported).toBe(fen)
            expect(state.moveNumber).toBe(moveNum)
        })
    })

    test("should handle FEN with both active colors", () => {
        const fenWhite = "4k3/8/8/8/8/8/8/4K3 w 1"
        const fenBlack = "4k3/8/8/8/8/8/8/4K3 b 1"

        const stateWhite = createGameFromFen(fenWhite)
        const stateBlack = createGameFromFen(fenBlack)

        expect(stateWhite.turn).toBe(Color.WHITE)
        expect(stateBlack.turn).toBe(Color.BLACK)

        expect(exportFen(stateWhite)).toBe(fenWhite)
        expect(exportFen(stateBlack)).toBe(fenBlack)
    })

    test("should correctly initialize fenOccurrence", () => {
        const fen = "4k3/8/8/8/8/8/8/4K3 w 1"
        const state = createGameFromFen(fen)

        expect(state.fenOccurrence).toEqual({ [fen]: 1 })
        expect(typeof state.fenOccurrence).toBe("object")
    })
})
