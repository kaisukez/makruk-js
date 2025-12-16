const { describe, expect, test } = globalThis as any

import { importFenBitboard, INITIAL_FEN_BITBOARD, EMPTY_FEN_BITBOARD } from "bitboard/fen/importer"
import { exportFenBitboard } from "bitboard/fen/exporter"

describe("FEN round-trip", () => {
    test("should maintain FEN through import/export cycle", () => {
        const originalFen = INITIAL_FEN_BITBOARD
        const { state, turn, moveNumber } = importFenBitboard(originalFen)
        const exported = exportFenBitboard(state, turn, moveNumber)

        expect(exported).toBe(originalFen)
    })

    test("should handle custom position round-trip", () => {
        const customFen = "r6r/8/8/8/8/8/8/R6R w 1"
        const { state, turn, moveNumber } = importFenBitboard(customFen)
        const exported = exportFenBitboard(state, turn, moveNumber)

        expect(exported).toBe(customFen)
    })
})

describe("FEN constants", () => {
    test("should have valid INITIAL_FEN_BITBOARD", () => {
        expect(INITIAL_FEN_BITBOARD).toBe("rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTEKTMR w 1")
    })

    test("should have valid EMPTY_FEN_BITBOARD", () => {
        expect(EMPTY_FEN_BITBOARD).toBe("8/8/8/8/8/8/8/8 w 1")
    })
})
