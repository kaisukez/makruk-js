const { describe, expect, test } = globalThis as any

import { Color, Piece } from "common/const"
import { importFen, INITIAL_FEN, EMPTY_FEN } from "bitboard/fen/importer"
import { createInitialState } from "bitboard/index"
import { getPieceAt } from "bitboard/board/board"

describe("importFen", () => {
    test("should import initial FEN correctly", () => {
        const { state, turn, moveNumber } = importFen(INITIAL_FEN)

        expect(turn).toBe(Color.WHITE)
        expect(moveNumber).toBe(1)

        // Check some key pieces
        expect(getPieceAt(state, 0)).toEqual([Color.WHITE, Piece.RUA]) // a1
        expect(getPieceAt(state, 4)).toEqual([Color.WHITE, Piece.KHUN]) // e1
        expect(getPieceAt(state, 16)).toEqual([Color.WHITE, Piece.BIA]) // a3
        expect(getPieceAt(state, 60)).toEqual([Color.BLACK, Piece.KHUN]) // e8
    })

    test("should import empty board FEN correctly", () => {
        const { state, turn, moveNumber } = importFen(EMPTY_FEN)

        expect(turn).toBe(Color.WHITE)
        expect(moveNumber).toBe(1)

        // All squares should be empty
        for (let sq = 0; sq < 64; sq++) {
            expect(getPieceAt(state, sq)).toBe(null)
        }
    })

    test("should parse turn correctly", () => {
        const { turn: whiteTurn } = importFen("8/8/8/8/8/8/8/8 w 1")
        expect(whiteTurn).toBe(Color.WHITE)

        const { turn: blackTurn } = importFen("8/8/8/8/8/8/8/8 b 1")
        expect(blackTurn).toBe(Color.BLACK)
    })

    test("should parse move number correctly", () => {
        const { moveNumber: move1 } = importFen("8/8/8/8/8/8/8/8 w 1")
        expect(move1).toBe(1)

        const { moveNumber: move50 } = importFen("8/8/8/8/8/8/8/8 w 50")
        expect(move50).toBe(50)
    })

    test("should handle mixed pieces and empty squares", () => {
        const fen = "4k3/8/8/8/8/8/8/4K3 w 1"
        const { state } = importFen(fen)

        expect(getPieceAt(state, 4)).toEqual([Color.WHITE, Piece.KHUN]) // e1
        expect(getPieceAt(state, 60)).toEqual([Color.BLACK, Piece.KHUN]) // e8
        expect(getPieceAt(state, 0)).toBe(null) // a1 empty
        expect(getPieceAt(state, 63)).toBe(null) // h8 empty
    })
})

describe("createInitialState", () => {
    test("should create initial state equivalent to importFen(INITIAL_FEN)", () => {
        const state = createInitialState()

        expect(state.turn).toBe(Color.WHITE)
        expect(state.moveNumber).toBe(1)
        expect(state.fen).toBe(INITIAL_FEN)
    })
})
