const { describe, expect, test } = globalThis as any

import { Color, Piece } from "common/const"
import { createGameFromFen, INITIAL_FEN, EMPTY_FEN } from "bitboard/fen/importer"
import { createInitialState } from "bitboard/index"
import { getPieceAt } from "bitboard/board/board"
import { exportFen } from "bitboard/fen/exporter"

describe("createGameFromFen", () => {
    test("should import initial FEN correctly", () => {
        const { board, turn, moveNumber } = createGameFromFen(INITIAL_FEN)

        expect(turn).toBe(Color.WHITE)
        expect(moveNumber).toBe(1)

        // Check some key pieces (INITIAL_FEN = rmtektmr/.../RMTKETMR)
        expect(getPieceAt(board, 0)).toEqual([Color.WHITE, Piece.RUA]) // a1
        expect(getPieceAt(board, 3)).toEqual([Color.WHITE, Piece.KHUN]) // d1
        expect(getPieceAt(board, 16)).toEqual([Color.WHITE, Piece.BIA]) // a3
        expect(getPieceAt(board, 60)).toEqual([Color.BLACK, Piece.KHUN]) // e8
    })

    test("should import empty board FEN correctly", () => {
        const { board, turn, moveNumber } = createGameFromFen(EMPTY_FEN)

        expect(turn).toBe(Color.WHITE)
        expect(moveNumber).toBe(1)

        // Only kings should be present
        expect(getPieceAt(board, 4)).toEqual([Color.WHITE, Piece.KHUN]) // e1
        expect(getPieceAt(board, 60)).toEqual([Color.BLACK, Piece.KHUN]) // e8
        // Other squares should be empty
        expect(getPieceAt(board, 0)).toBe(null)
        expect(getPieceAt(board, 63)).toBe(null)
    })

    test("should parse turn correctly", () => {
        const { turn: whiteTurn } = createGameFromFen("4k3/8/8/8/8/8/8/4K3 w 1")
        expect(whiteTurn).toBe(Color.WHITE)

        const { turn: blackTurn } = createGameFromFen("4k3/8/8/8/8/8/8/4K3 b 1")
        expect(blackTurn).toBe(Color.BLACK)
    })

    test("should parse move number correctly", () => {
        const { moveNumber: move1 } = createGameFromFen("4k3/8/8/8/8/8/8/4K3 w 1")
        expect(move1).toBe(1)

        const { moveNumber: move50 } = createGameFromFen("4k3/8/8/8/8/8/8/4K3 w 50")
        expect(move50).toBe(50)
    })

    test("should handle mixed pieces and empty squares", () => {
        const fen = "4k3/8/8/8/8/8/8/4K3 w 1"
        const { board } = createGameFromFen(fen)

        expect(getPieceAt(board, 4)).toEqual([Color.WHITE, Piece.KHUN]) // e1
        expect(getPieceAt(board, 60)).toEqual([Color.BLACK, Piece.KHUN]) // e8
        expect(getPieceAt(board, 0)).toBe(null) // a1 empty
        expect(getPieceAt(board, 63)).toBe(null) // h8 empty
    })

    test("should parse countdown fields correctly", () => {
        const fen = "4k3/8/8/8/8/8/8/4KR2 w 1 w bp 5 5 64"
        const game = createGameFromFen(fen)

        expect(game.countdown).not.toBe(null)
        expect(game.countdown!.countColor).toBe(Color.WHITE)
        expect(game.countdown!.countType).toBe("bp")
        expect(game.countdown!.count).toBe(5)
        expect(game.countdown!.countFrom).toBe(5)
        expect(game.countdown!.countTo).toBe(64)
    })

    test("should return null countdown when all fields are dashes", () => {
        const fen = "4k3/8/8/8/8/8/8/4KR2 w 1 - - - - -"
        const game = createGameFromFen(fen)

        expect(game.countdown).toBe(null)
    })

    test("should return null countdown when only 3 fields", () => {
        const fen = "4k3/8/8/8/8/8/8/4KR2 w 1"
        const game = createGameFromFen(fen)

        expect(game.countdown).toBe(null)
    })
})

describe("createInitialState", () => {
    test("should create initial state equivalent to createGameFromFen(INITIAL_FEN)", () => {
        const state = createInitialState()

        expect(state.turn).toBe(Color.WHITE)
        expect(state.moveNumber).toBe(1)
        expect(exportFen(state)).toBe(INITIAL_FEN)
    })
})
