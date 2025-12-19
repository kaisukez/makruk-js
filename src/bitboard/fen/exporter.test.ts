const { describe, expect, test } = globalThis as any

import { Color } from "common/const"
import { importFen, INITIAL_FEN, EMPTY_FEN } from "bitboard/fen/importer"
import { exportFen } from "bitboard/fen/exporter"

describe("exportFen", () => {
    test("should export initial position correctly", () => {
        const { state, turn, moveNumber } = importFen(INITIAL_FEN)
        const exported = exportFen(state, turn, moveNumber)

        expect(exported).toBe(INITIAL_FEN)
    })

    test("should export empty board correctly", () => {
        const { state, turn, moveNumber } = importFen(EMPTY_FEN)
        const exported = exportFen(state, turn, moveNumber)

        expect(exported).toBe(EMPTY_FEN)
    })

    test("should export with correct turn", () => {
        const { state, moveNumber } = importFen(EMPTY_FEN)

        const whiteFen = exportFen(state, Color.WHITE, moveNumber)
        expect(whiteFen).toContain(" w ")

        const blackFen = exportFen(state, Color.BLACK, moveNumber)
        expect(blackFen).toContain(" b ")
    })

    test("should export with correct move number", () => {
        const { state, turn } = importFen(EMPTY_FEN)

        const fen1 = exportFen(state, turn, 1)
        expect(fen1).toMatch(/ 1$/)

        const fen42 = exportFen(state, turn, 42)
        expect(fen42).toMatch(/ 42$/)
    })
})
