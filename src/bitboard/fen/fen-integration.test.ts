const { describe, expect, test } = globalThis as any

import { createGameFromFen, INITIAL_FEN, EMPTY_FEN } from "bitboard/fen/importer"
import { exportFen } from "bitboard/fen/exporter"

describe("FEN round-trip", () => {
    test("should maintain FEN through import/export cycle", () => {
        const originalFen = INITIAL_FEN
        const game = createGameFromFen(originalFen)
        const exported = exportFen(game)

        expect(exported).toBe(originalFen)
    })

    test("should handle custom position round-trip", () => {
        const customFen = "r3k2r/8/8/8/8/8/8/R3K2R w 1"
        const game = createGameFromFen(customFen)
        const exported = exportFen(game)

        expect(exported).toBe(customFen)
    })
})

describe("FEN constants", () => {
    test("should have valid INITIAL_FEN", () => {
        expect(INITIAL_FEN).toBe("rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1")
    })

    test("should have valid EMPTY_FEN", () => {
        expect(EMPTY_FEN).toBe("4k3/8/8/8/8/8/8/4K3 w 1")
    })
})
