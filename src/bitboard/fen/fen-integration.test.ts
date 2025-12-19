const { describe, expect, test } = globalThis as any

import { importFen, INITIAL_FEN, EMPTY_FEN } from "bitboard/fen/importer"
import { exportFen } from "bitboard/fen/exporter"

describe("FEN round-trip", () => {
    test("should maintain FEN through import/export cycle", () => {
        const originalFen = INITIAL_FEN
        const { state, turn, moveNumber } = importFen(originalFen)
        const exported = exportFen(state, turn, moveNumber)

        expect(exported).toBe(originalFen)
    })

    test("should handle custom position round-trip", () => {
        const customFen = "r6r/8/8/8/8/8/8/R6R w 1"
        const { state, turn, moveNumber } = importFen(customFen)
        const exported = exportFen(state, turn, moveNumber)

        expect(exported).toBe(customFen)
    })
})

describe("FEN constants", () => {
    test("should have valid INITIAL_FEN", () => {
        expect(INITIAL_FEN).toBe("rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTEKTMR w 1")
    })

    test("should have valid EMPTY_FEN", () => {
        expect(EMPTY_FEN).toBe("8/8/8/8/8/8/8/8 w 1")
    })
})
