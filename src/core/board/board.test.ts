const { describe, expect, test } = globalThis as any

import { Color, Piece, SquareIndex } from "../../config"
import { getBoardStateFromBoardString, forEachPieceFromBoardState, put, remove } from "./board"
import { importFen } from "../fen/importer"

describe("getBoardStateFromBoardString", () => {
    test("should convert initial position board string correctly", () => {
        const boardString = "rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR"
        const boardState = getBoardStateFromBoardString(boardString)

        // Check white rook on a1
        expect(boardState[SquareIndex.a1]).toEqual([Color.WHITE, Piece.RUA])
        // Check white khun on d1
        expect(boardState[SquareIndex.d1]).toEqual([Color.WHITE, Piece.KHUN])
        // Check black khun on e8
        expect(boardState[SquareIndex.e8]).toEqual([Color.BLACK, Piece.KHUN])
        // Check empty square
        expect(boardState[SquareIndex.e4]).toEqual(null)
    })

    test("should handle board string with numbers representing empty squares", () => {
        const boardString = "8/8/8/8/8/8/8/8"
        const boardState = getBoardStateFromBoardString(boardString)

        // All squares should be empty
        for (let i = SquareIndex.a1; i <= SquareIndex.h8; i++) {
            if (!(i & 0x88)) {
                expect(boardState[i]).toEqual(null)
            }
        }
    })

    test("should handle board string with mixed pieces and empty squares", () => {
        const boardString = "4k3/8/8/8/8/8/8/4K3"
        const boardState = getBoardStateFromBoardString(boardString)

        expect(boardState[SquareIndex.e8]).toEqual([Color.BLACK, Piece.KHUN])
        expect(boardState[SquareIndex.e1]).toEqual([Color.WHITE, Piece.KHUN])
        expect(boardState[SquareIndex.a1]).toEqual(null)
        expect(boardState[SquareIndex.h8]).toEqual(null)
    })

    test("should correctly place white pieces (uppercase)", () => {
        const boardString = "8/8/8/8/8/8/8/BFMTERK1"
        const boardState = getBoardStateFromBoardString(boardString)

        expect(boardState[SquareIndex.a1]).toEqual([Color.WHITE, Piece.BIA])
        expect(boardState[SquareIndex.b1]).toEqual([Color.WHITE, Piece.FLIPPED_BIA])
        expect(boardState[SquareIndex.c1]).toEqual([Color.WHITE, Piece.MA])
        expect(boardState[SquareIndex.d1]).toEqual([Color.WHITE, Piece.THON])
        expect(boardState[SquareIndex.e1]).toEqual([Color.WHITE, Piece.MET])
        expect(boardState[SquareIndex.f1]).toEqual([Color.WHITE, Piece.RUA])
        expect(boardState[SquareIndex.g1]).toEqual([Color.WHITE, Piece.KHUN])
    })

    test("should correctly place black pieces (lowercase)", () => {
        const boardString = "1bfmterk/8/8/8/8/8/8/8"
        const boardState = getBoardStateFromBoardString(boardString)

        expect(boardState[SquareIndex.b8]).toEqual([Color.BLACK, Piece.BIA])
        expect(boardState[SquareIndex.c8]).toEqual([Color.BLACK, Piece.FLIPPED_BIA])
        expect(boardState[SquareIndex.d8]).toEqual([Color.BLACK, Piece.MA])
        expect(boardState[SquareIndex.e8]).toEqual([Color.BLACK, Piece.THON])
        expect(boardState[SquareIndex.f8]).toEqual([Color.BLACK, Piece.MET])
        expect(boardState[SquareIndex.g8]).toEqual([Color.BLACK, Piece.RUA])
        expect(boardState[SquareIndex.h8]).toEqual([Color.BLACK, Piece.KHUN])
    })

    test("should handle consecutive numbers in board string", () => {
        const boardString = "4k3/3b4/8/8/8/8/4B3/4K3"
        const boardState = getBoardStateFromBoardString(boardString)

        expect(boardState[SquareIndex.e8]).toEqual([Color.BLACK, Piece.KHUN])
        expect(boardState[SquareIndex.d7]).toEqual([Color.BLACK, Piece.BIA])
        expect(boardState[SquareIndex.e2]).toEqual([Color.WHITE, Piece.BIA])
        expect(boardState[SquareIndex.e1]).toEqual([Color.WHITE, Piece.KHUN])
    })
})

describe("forEachPieceFromBoardState", () => {
    test("should iterate over all pieces on initial board", () => {
        const boardString = "rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR"
        const boardState = getBoardStateFromBoardString(boardString)

        const pieces: Array<{squareData: any, squareIndex: number}> = []
        forEachPieceFromBoardState(boardState, (squareData, squareIndex) => {
            pieces.push({ squareData, squareIndex })
        })

        // Initial position has 32 pieces
        expect(pieces.length).toBe(32)
    })

    test("should not call callback for empty board", () => {
        const boardString = "8/8/8/8/8/8/8/8"
        const boardState = getBoardStateFromBoardString(boardString)

        let callCount = 0
        forEachPieceFromBoardState(boardState, () => {
            callCount++
        })

        expect(callCount).toBe(0)
    })

    test("should provide correct square data and indices", () => {
        const boardString = "4k3/8/8/8/8/8/8/4K3"
        const boardState = getBoardStateFromBoardString(boardString)

        const results: Array<{color: Color, piece: Piece, index: number}> = []
        forEachPieceFromBoardState(boardState, (squareData, squareIndex) => {
            const [color, piece] = squareData
            results.push({ color, piece, index: squareIndex })
        })

        expect(results).toHaveLength(2)
        expect(results).toContainEqual({
            color: Color.WHITE,
            piece: Piece.KHUN,
            index: SquareIndex.e1
        })
        expect(results).toContainEqual({
            color: Color.BLACK,
            piece: Piece.KHUN,
            index: SquareIndex.e8
        })
    })

    test("should skip invalid board indices (0x88 representation)", () => {
        const boardString = "rkrkrkrk/8/8/8/8/8/8/RKRKRKRK"
        const boardState = getBoardStateFromBoardString(boardString)

        const indices: number[] = []
        forEachPieceFromBoardState(boardState, (_, squareIndex) => {
            indices.push(squareIndex)
        })

        // All indices should be valid (not & 0x88)
        indices.forEach(index => {
            expect(index & 0x88).toBe(0)
        })
    })
})

describe("put", () => {
    test("should place a piece on an empty square", () => {
        const state = importFen("4k3/8/8/8/8/8/8/4K3 w 1")
        const newState = put(state, Color.WHITE, Piece.RUA, SquareIndex.a1)

        expect(newState.boardState[SquareIndex.a1]).toEqual([Color.WHITE, Piece.RUA])
        expect(newState.piecePositions[Color.WHITE][Piece.RUA]).toContain(SquareIndex.a1)
    })

    test("should not mutate original state", () => {
        const state = importFen("4k3/8/8/8/8/8/8/4K3 w 1")
        const originalBoardState = state.boardState[SquareIndex.a1]
        const originalPositions = [...state.piecePositions[Color.WHITE][Piece.RUA]]

        put(state, Color.WHITE, Piece.RUA, SquareIndex.a1)

        expect(state.boardState[SquareIndex.a1]).toBe(originalBoardState)
        expect(state.piecePositions[Color.WHITE][Piece.RUA]).toEqual(originalPositions)
    })

    test("should replace existing piece on square", () => {
        const state = importFen("4k3/8/8/8/8/8/8/R3K3 w 1")
        const newState = put(state, Color.WHITE, Piece.MA, SquareIndex.a1)

        expect(newState.boardState[SquareIndex.a1]).toEqual([Color.WHITE, Piece.MA])
        expect(newState.piecePositions[Color.WHITE][Piece.MA]).toContain(SquareIndex.a1)
        expect(newState.piecePositions[Color.WHITE][Piece.RUA]).not.toContain(SquareIndex.a1)
    })

    test("should handle replacing piece of different color", () => {
        const state = importFen("4k3/8/8/8/8/8/8/r3K3 w 1")
        const newState = put(state, Color.WHITE, Piece.RUA, SquareIndex.a1)

        expect(newState.boardState[SquareIndex.a1]).toEqual([Color.WHITE, Piece.RUA])
        expect(newState.piecePositions[Color.WHITE][Piece.RUA]).toContain(SquareIndex.a1)
        expect(newState.piecePositions[Color.BLACK][Piece.RUA]).not.toContain(SquareIndex.a1)
    })

    test("should not add duplicate positions", () => {
        const state = importFen("4k3/8/8/8/8/8/8/R3K3 w 1")
        const newState = put(state, Color.WHITE, Piece.RUA, SquareIndex.a1)

        const ruaPositions = newState.piecePositions[Color.WHITE][Piece.RUA]
        const uniquePositions = [...new Set(ruaPositions)]
        expect(ruaPositions.length).toBe(uniquePositions.length)
    })

    test("should place multiple pieces of same type", () => {
        let state = importFen("4k3/8/8/8/8/8/8/4K3 w 1")
        state = put(state, Color.WHITE, Piece.RUA, SquareIndex.a1)
        state = put(state, Color.WHITE, Piece.RUA, SquareIndex.h1)

        expect(state.piecePositions[Color.WHITE][Piece.RUA]).toHaveLength(2)
        expect(state.piecePositions[Color.WHITE][Piece.RUA]).toContain(SquareIndex.a1)
        expect(state.piecePositions[Color.WHITE][Piece.RUA]).toContain(SquareIndex.h1)
    })
})

describe("remove", () => {
    test("should remove a piece from a square", () => {
        const state = importFen("4k3/8/8/8/8/8/8/R3K3 w 1")
        const newState = remove(state, SquareIndex.a1)

        expect(newState.boardState[SquareIndex.a1]).toEqual(null)
        expect(newState.piecePositions[Color.WHITE][Piece.RUA]).not.toContain(SquareIndex.a1)
    })

    test("should not mutate original state", () => {
        const state = importFen("4k3/8/8/8/8/8/8/R3K3 w 1")
        const originalBoardState = state.boardState[SquareIndex.a1]
        const originalPositions = [...state.piecePositions[Color.WHITE][Piece.RUA]]

        remove(state, SquareIndex.a1)

        expect(state.boardState[SquareIndex.a1]).toBe(originalBoardState)
        expect(state.piecePositions[Color.WHITE][Piece.RUA]).toEqual(originalPositions)
    })

    test("should handle removing from empty square gracefully", () => {
        const state = importFen("4k3/8/8/8/8/8/8/4K3 w 1")
        const newState = remove(state, SquareIndex.a1)

        expect(newState.boardState[SquareIndex.a1]).toEqual(null)
    })

    test("should remove black piece correctly", () => {
        const state = importFen("r3k3/8/8/8/8/8/8/4K3 w 1")
        const newState = remove(state, SquareIndex.a8)

        expect(newState.boardState[SquareIndex.a8]).toEqual(null)
        expect(newState.piecePositions[Color.BLACK][Piece.RUA]).not.toContain(SquareIndex.a8)
    })

    test("should only remove piece at specified position from position list", () => {
        let state = importFen("4k3/8/8/8/8/8/8/4K3 w 1")
        state = put(state, Color.WHITE, Piece.RUA, SquareIndex.a1)
        state = put(state, Color.WHITE, Piece.RUA, SquareIndex.h1)

        const newState = remove(state, SquareIndex.a1)

        expect(newState.piecePositions[Color.WHITE][Piece.RUA]).toHaveLength(1)
        expect(newState.piecePositions[Color.WHITE][Piece.RUA]).toContain(SquareIndex.h1)
        expect(newState.piecePositions[Color.WHITE][Piece.RUA]).not.toContain(SquareIndex.a1)
    })
})
