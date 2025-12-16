const { describe, expect, test } = globalThis as any

import { exportFen } from "./exporter"
import { importFen, INITIAL_FEN, EMPTY_FEN } from "./importer"

describe("exportFen", () => {
    test("should export initial position correctly", () => {
        const state = importFen(INITIAL_FEN)
        const exported = exportFen(state)

        expect(exported).toBe(INITIAL_FEN)
    })

    test("should export empty position correctly", () => {
        const state = importFen(EMPTY_FEN)
        const exported = exportFen(state)

        expect(exported).toBe(EMPTY_FEN)
    })

    test("should export position with black to move", () => {
        const fen = "4k3/8/8/8/8/8/8/4K3 b 15"
        const state = importFen(fen)
        const exported = exportFen(state)

        expect(exported).toBe(fen)
    })

    test("should export position with countdown", () => {
        const fen = "4k3/8/8/8/8/8/8/4K3 w 10 w bp 64 10 100"
        const state = importFen(fen)
        const exported = exportFen(state)

        expect(exported).toBe(fen)
    })

    test("should export position with piece power countdown", () => {
        const fen = "4k3/8/8/8/8/8/8/4K3 b 25 b pp 5 25 50"
        const state = importFen(fen)
        const exported = exportFen(state)

        expect(exported).toBe(fen)
    })

    test("should export position with flipped bia", () => {
        const fen = "4k3/8/8/3f4/3F4/8/8/4K3 w 1"
        const state = importFen(fen)
        const exported = exportFen(state)

        expect(exported).toBe(fen)
    })

    test("should export position with all piece types", () => {
        const fen = "rmtektmr/bbbbbbbb/8/8/8/8/BBBBBBBB/RMTKETMR w 1"
        const state = importFen(fen)
        const exported = exportFen(state)

        expect(exported).toBe(fen)
    })

    test("should export position with mixed pieces and numbers", () => {
        const fen = "r1t1k1t1/8/b1b1b1b1/8/8/B1B1B1B1/8/R1T1K1T1 w 1"
        const state = importFen(fen)
        const exported = exportFen(state)

        expect(exported).toBe(fen)
    })

    test("should export position with large move number", () => {
        const fen = "4k3/8/8/8/8/8/8/4K3 w 9999"
        const state = importFen(fen)
        const exported = exportFen(state)

        expect(exported).toBe(fen)
    })

    test("should handle position with pieces on one rank", () => {
        const fen = "4k3/8/8/8/8/8/8/rmtKetmr w 1"
        const state = importFen(fen)
        const exported = exportFen(state)

        expect(exported).toBe(fen)
    })

    test("should handle position with all pieces on first and last rank", () => {
        const fen = "rmtektmr/8/8/8/8/8/8/RMTKETMR w 1"
        const state = importFen(fen)
        const exported = exportFen(state)

        expect(exported).toBe(fen)
    })
})
