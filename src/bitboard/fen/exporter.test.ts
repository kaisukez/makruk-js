const { describe, expect, test } = globalThis as any

import { Color } from "common/const"
import { createGameFromFen, INITIAL_FEN, EMPTY_FEN } from "bitboard/fen/importer"
import { exportFen } from "bitboard/fen/exporter"

describe("exportFen", () => {
    test("should export initial position correctly", () => {
        const game = createGameFromFen(INITIAL_FEN)
        const exported = exportFen(game)

        expect(exported).toBe(INITIAL_FEN)
    })

    test("should export empty board correctly", () => {
        const game = createGameFromFen(EMPTY_FEN)
        const exported = exportFen(game)

        expect(exported).toBe(EMPTY_FEN)
    })

    test("should export with correct turn", () => {
        const game = createGameFromFen(EMPTY_FEN)

        const whiteFen = exportFen({ ...game, turn: Color.WHITE })
        expect(whiteFen).toContain(" w ")

        const blackFen = exportFen({ ...game, turn: Color.BLACK })
        expect(blackFen).toContain(" b ")
    })

    test("should export with correct move number", () => {
        const game = createGameFromFen(EMPTY_FEN)

        const fen1 = exportFen({ ...game, moveNumber: 1 })
        expect(fen1).toMatch(/ 1$/)

        const fen42 = exportFen({ ...game, moveNumber: 42 })
        expect(fen42).toMatch(/ 42$/)
    })
})
