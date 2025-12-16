const { describe, expect, test } = globalThis as any

import { Color } from "common/const"
import { importFenBitboard, INITIAL_FEN_BITBOARD, EMPTY_FEN_BITBOARD } from "bitboard/fen/importer"
import { exportFenBitboard } from "bitboard/fen/exporter"

describe("exportFenBitboard", () => {
    test("should export initial position correctly", () => {
        const { state, turn, moveNumber } = importFenBitboard(INITIAL_FEN_BITBOARD)
        const exported = exportFenBitboard(state, turn, moveNumber)

        expect(exported).toBe(INITIAL_FEN_BITBOARD)
    })

    test("should export empty board correctly", () => {
        const { state, turn, moveNumber } = importFenBitboard(EMPTY_FEN_BITBOARD)
        const exported = exportFenBitboard(state, turn, moveNumber)

        expect(exported).toBe(EMPTY_FEN_BITBOARD)
    })

    test("should export with correct turn", () => {
        const { state, moveNumber } = importFenBitboard(EMPTY_FEN_BITBOARD)

        const whiteFen = exportFenBitboard(state, Color.WHITE, moveNumber)
        expect(whiteFen).toContain(" w ")

        const blackFen = exportFenBitboard(state, Color.BLACK, moveNumber)
        expect(blackFen).toContain(" b ")
    })

    test("should export with correct move number", () => {
        const { state, turn } = importFenBitboard(EMPTY_FEN_BITBOARD)

        const fen1 = exportFenBitboard(state, turn, 1)
        expect(fen1).toMatch(/ 1$/)

        const fen42 = exportFenBitboard(state, turn, 42)
        expect(fen42).toMatch(/ 42$/)
    })
})
