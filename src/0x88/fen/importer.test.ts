const { describe, expect, test } = globalThis as any

import { Color, CountType, Piece, SquareIndex } from "common/const"
import {
    createGameFromFen,
    createInitialState,
    INITIAL_FEN,
    EMPTY_FEN,
} from "0x88/fen/importer"

describe("createGameFromFen", () => {
    test("should import INITIAL_FEN correctly", () => {
        const state = createGameFromFen(INITIAL_FEN)

        expect(state.turn).toBe(Color.WHITE)
        expect(state.moveNumber).toBe(1)
        expect(state.countdown).toBeNull()
        expect(state.fenOccurrence[INITIAL_FEN]).toBe(1)

        // Check some piece positions
        // INITIAL_FEN = "rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1"
        // Bottom rank (white): R=a1, M=b1, T=c1, K=d1, E=e1, T=f1, M=g1, R=h1
        expect(state.boardState[SquareIndex.a1]).toEqual([Color.WHITE, Piece.RUA])
        expect(state.boardState[SquareIndex.d1]).toEqual([Color.WHITE, Piece.KHUN])
        expect(state.boardState[SquareIndex.e8]).toEqual([Color.BLACK, Piece.KHUN])
        expect(state.boardState[SquareIndex.a8]).toEqual([Color.BLACK, Piece.RUA])
    })

    test("should import EMPTY_FEN correctly", () => {
        const state = createGameFromFen(EMPTY_FEN)

        expect(state.turn).toBe(Color.WHITE)
        expect(state.moveNumber).toBe(1)
        expect(state.countdown).toBeNull()

        // Only kings should exist
        expect(state.boardState[SquareIndex.e1]).toEqual([Color.WHITE, Piece.KHUN])
        expect(state.boardState[SquareIndex.e8]).toEqual([Color.BLACK, Piece.KHUN])

        // Other squares should be empty
        expect(state.boardState[SquareIndex.a1]).toBeNull()
        expect(state.boardState[SquareIndex.h8]).toBeNull()
    })

    test("should import FEN with black to move", () => {
        const fen = "4k3/8/8/8/8/8/8/4K3 b 15"
        const state = createGameFromFen(fen)

        expect(state.turn).toBe(Color.BLACK)
        expect(state.moveNumber).toBe(15)
    })

    test("should import FEN with countdown", () => {
        const fen = "4k3/8/8/8/8/8/8/4K3 w 10 w bp 64 10 100"
        const state = createGameFromFen(fen)

        expect(state.countdown).toEqual({
            countColor: Color.WHITE,
            countType: CountType.BOARD_POWER_COUNTDOWN,
            count: 64,
            countFrom: 10,
            countTo: 100,
        })
    })

    test("should import FEN with piece power countdown", () => {
        const fen = "4k3/8/8/8/8/8/8/4K3 b 25 b pp 5 25 50"
        const state = createGameFromFen(fen)

        expect(state.countdown).toEqual({
            countColor: Color.BLACK,
            countType: CountType.PIECE_POWER_COUNTDOWN,
            count: 5,
            countFrom: 25,
            countTo: 50,
        })
    })

    test("should import FEN with flipped bia pieces", () => {
        const fen = "4k3/8/8/3f4/3F4/8/8/4K3 w 1"
        const state = createGameFromFen(fen)

        expect(state.boardState[SquareIndex.d5]).toEqual([Color.BLACK, Piece.FLIPPED_BIA])
        expect(state.boardState[SquareIndex.d4]).toEqual([Color.WHITE, Piece.FLIPPED_BIA])
    })

    test("should import FEN with all piece types", () => {
        const fen = "rmtektmr/bbbbbbbb/8/8/8/8/BBBBBBBB/RMTKETMR w 1"
        const state = createGameFromFen(fen)

        expect(state.boardState[SquareIndex.a1]).toEqual([Color.WHITE, Piece.RUA])
        expect(state.boardState[SquareIndex.b1]).toEqual([Color.WHITE, Piece.MA])
        expect(state.boardState[SquareIndex.c1]).toEqual([Color.WHITE, Piece.THON])
        expect(state.boardState[SquareIndex.d1]).toEqual([Color.WHITE, Piece.KHUN])
        expect(state.boardState[SquareIndex.e1]).toEqual([Color.WHITE, Piece.MET])

        expect(state.boardState[SquareIndex.a2]).toEqual([Color.WHITE, Piece.BIA])
        expect(state.boardState[SquareIndex.a7]).toEqual([Color.BLACK, Piece.BIA])
    })

    test("should populate piecePositions correctly", () => {
        const fen = "4k3/8/8/8/8/8/8/4K3 w 1"
        const state = createGameFromFen(fen)

        expect(state.piecePositions[Color.WHITE][Piece.KHUN]).toContain(SquareIndex.e1)
        expect(state.piecePositions[Color.BLACK][Piece.KHUN]).toContain(SquareIndex.e8)
    })

    test("should track FEN occurrence", () => {
        const fen = "4k3/8/8/8/8/8/8/4K3 w 1"
        const state = createGameFromFen(fen)

        expect(state.fenOccurrence[fen]).toBe(1)
        expect(Object.keys(state.fenOccurrence)).toHaveLength(1)
    })

    test("should import FEN with large move number", () => {
        const fen = "4k3/8/8/8/8/8/8/4K3 w 9999"
        const state = createGameFromFen(fen)

        expect(state.moveNumber).toBe(9999)
    })
})

describe("INITIAL_FEN constant", () => {
    test("should have correct value", () => {
        expect(INITIAL_FEN).toBe("rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1")
    })
})

describe("EMPTY_FEN constant", () => {
    test("should have correct value", () => {
        expect(EMPTY_FEN).toBe("4k3/8/8/8/8/8/8/4K3 w 1")
    })
})

describe("createInitialState", () => {
    test("should create initial state equivalent to createGameFromFen(INITIAL_FEN)", () => {
        const state = createInitialState()

        expect(state.turn).toBe(Color.WHITE)
        expect(state.moveNumber).toBe(1)
        expect(state.fenOccurrence[INITIAL_FEN]).toBe(1)
    })
})
