const { describe, expect, test } = globalThis as any

import { BITS, Color, EMPTY_FEN, INITIAL_FEN, Piece, SquareIndex } from "../../config"
import { importFen, exportFen } from "../fen"
import { put } from "../board"
import {
    changePiecePosition,
    step,
    applyMove,
    undoMove,
} from "./execution"
import { MoveObject } from "../types"

describe("changePiecePosition", () => {
    test("should move piece from one square to another", () => {
        const state = importFen(INITIAL_FEN)
        changePiecePosition(state.boardState, SquareIndex.a3, SquareIndex.a4)
        expect(state.boardState[SquareIndex.a3]).toBeNull()
        expect(state.boardState[SquareIndex.a4]).toEqual([Color.WHITE, Piece.BIA])
    })

    test("should do nothing when from is null", () => {
        const state = importFen(INITIAL_FEN)
        const originalBoardState = [...state.boardState]
        changePiecePosition(state.boardState, null as any, SquareIndex.a3)
        expect(state.boardState).toEqual(originalBoardState)
    })

    test("should do nothing when from equals to", () => {
        const state = importFen(INITIAL_FEN)
        const originalPiece = state.boardState[SquareIndex.a3]
        changePiecePosition(state.boardState, SquareIndex.a3, SquareIndex.a3)
        expect(state.boardState[SquareIndex.a3]).toEqual(originalPiece)
    })

    test("should overwrite destination square", () => {
        const state = importFen(INITIAL_FEN)
        changePiecePosition(state.boardState, SquareIndex.a3, SquareIndex.a6)
        expect(state.boardState[SquareIndex.a6]).toEqual([Color.WHITE, Piece.BIA])
    })
})

describe("step", () => {
    test("should swap white to black without incrementing move number", () => {
        const state = importFen(INITIAL_FEN)
        expect(state.activeColor).toBe(Color.WHITE)
        expect(state.moveNumber).toBe(1)
        step(state)
        expect(state.activeColor).toBe(Color.BLACK)
        expect(state.moveNumber).toBe(1)
    })

    test("should swap black to white and increment move number", () => {
        let state = importFen(INITIAL_FEN)
        state.activeColor = Color.BLACK
        state.moveNumber = 5
        step(state)
        expect(state.activeColor).toBe(Color.WHITE)
        expect(state.moveNumber).toBe(6)
    })
})

describe("applyMove", () => {
    test("should return new state without mutating original", () => {
        const state = importFen(INITIAL_FEN)
        const move: MoveObject = {
            color: Color.WHITE,
            piece: Piece.BIA,
            from: SquareIndex.a3,
            to: SquareIndex.a4,
            flags: BITS.NORMAL,
        }
        const originalFen = exportFen(state)
        const { newState } = applyMove(state, move)
        expect(exportFen(state)).toBe(originalFen)
        expect(exportFen(newState)).not.toBe(originalFen)
    })

    test("should move piece on board", () => {
        const state = importFen(INITIAL_FEN)
        const move: MoveObject = {
            color: Color.WHITE,
            piece: Piece.BIA,
            from: SquareIndex.a3,
            to: SquareIndex.a4,
            flags: BITS.NORMAL,
        }
        const { newState } = applyMove(state, move)
        expect(newState.boardState[SquareIndex.a3]).toBeNull()
        expect(newState.boardState[SquareIndex.a4]).toEqual([Color.WHITE, Piece.BIA])
    })

    test("should handle promotion", () => {
        let state = importFen(EMPTY_FEN)
        state = put(state, Color.WHITE, Piece.BIA, SquareIndex.d5)
        const move: MoveObject = {
            color: Color.WHITE,
            piece: Piece.BIA,
            from: SquareIndex.d5,
            to: SquareIndex.d6,
            flags: BITS.PROMOTION,
            promotion: Piece.FLIPPED_BIA,
        }
        const { newState } = applyMove(state, move)
        expect(newState.boardState[SquareIndex.d6]).toEqual([Color.WHITE, Piece.FLIPPED_BIA])
    })

    test("should update piece positions", () => {
        const state = importFen(INITIAL_FEN)
        const move: MoveObject = {
            color: Color.WHITE,
            piece: Piece.BIA,
            from: SquareIndex.a3,
            to: SquareIndex.a4,
            flags: BITS.NORMAL,
        }
        const { newState } = applyMove(state, move)
        expect(newState.piecePositions[Color.WHITE][Piece.BIA]).toContain(SquareIndex.a4)
        expect(newState.piecePositions[Color.WHITE][Piece.BIA]).not.toContain(SquareIndex.a3)
    })

    test("should swap active color", () => {
        const state = importFen(INITIAL_FEN)
        const move: MoveObject = {
            color: Color.WHITE,
            piece: Piece.BIA,
            from: SquareIndex.a3,
            to: SquareIndex.a4,
            flags: BITS.NORMAL,
        }
        const { newState } = applyMove(state, move)
        expect(newState.activeColor).toBe(Color.BLACK)
    })

    test("should increment move number after black move", () => {
        let state = importFen(INITIAL_FEN)
        state.activeColor = Color.BLACK
        const move: MoveObject = {
            color: Color.BLACK,
            piece: Piece.BIA,
            from: SquareIndex.a6,
            to: SquareIndex.a5,
            flags: BITS.NORMAL,
        }
        const { newState } = applyMove(state, move)
        expect(newState.moveNumber).toBe(2)
    })

    test("should track undo when requested", () => {
        const state = importFen(INITIAL_FEN)
        const move: MoveObject = {
            color: Color.WHITE,
            piece: Piece.BIA,
            from: SquareIndex.a3,
            to: SquareIndex.a4,
            flags: BITS.NORMAL,
        }
        const { undo } = applyMove(state, move, { trackUndo: true })
        expect(undo).toBeDefined()
        expect(undo?.board?.from).toBe(SquareIndex.a3)
        expect(undo?.board?.to).toBe(SquareIndex.a4)
    })

    test("should not track undo when not requested", () => {
        const state = importFen(INITIAL_FEN)
        const move: MoveObject = {
            color: Color.WHITE,
            piece: Piece.BIA,
            from: SquareIndex.a3,
            to: SquareIndex.a4,
            flags: BITS.NORMAL,
        }
        const { undo } = applyMove(state, move, { trackUndo: false })
        expect(undo).toBeUndefined()
    })

    test("should update FEN occurrence when updateFen is true", () => {
        const state = importFen(INITIAL_FEN)
        const move: MoveObject = {
            color: Color.WHITE,
            piece: Piece.BIA,
            from: SquareIndex.a3,
            to: SquareIndex.a4,
            flags: BITS.NORMAL,
        }
        const { newState } = applyMove(state, move, { updateFen: true })
        const newFen = exportFen(newState)
        expect(newState.fenOccurrence[newFen]).toBe(1)
    })

    test("should handle capture moves", () => {
        let state = importFen(EMPTY_FEN)
        state = put(state, Color.WHITE, Piece.BIA, SquareIndex.d4)
        state = put(state, Color.BLACK, Piece.BIA, SquareIndex.e5)
        const move: MoveObject = {
            color: Color.WHITE,
            piece: Piece.BIA,
            from: SquareIndex.d4,
            to: SquareIndex.e5,
            flags: BITS.CAPTURE,
            captured: Piece.BIA,
        }
        const { newState } = applyMove(state, move)
        expect(newState.boardState[SquareIndex.e5]).toEqual([Color.WHITE, Piece.BIA])
        expect(newState.piecePositions[Color.BLACK][Piece.BIA]).not.toContain(SquareIndex.e5)
    })
})

describe("undoMove", () => {
    test("should restore board state", () => {
        const state = importFen(INITIAL_FEN)
        const move: MoveObject = {
            color: Color.WHITE,
            piece: Piece.BIA,
            from: SquareIndex.a3,
            to: SquareIndex.a4,
            flags: BITS.NORMAL,
        }
        const { newState, undo } = applyMove(state, move, { trackUndo: true })
        const restoredState = undoMove(newState, undo)
        expect(restoredState.boardState[SquareIndex.a3]).toEqual([Color.WHITE, Piece.BIA])
        expect(restoredState.boardState[SquareIndex.a4]).toBeNull()
    })

    test("should restore active color", () => {
        const state = importFen(INITIAL_FEN)
        const move: MoveObject = {
            color: Color.WHITE,
            piece: Piece.BIA,
            from: SquareIndex.a3,
            to: SquareIndex.a4,
            flags: BITS.NORMAL,
        }
        const { newState, undo } = applyMove(state, move, { trackUndo: true })
        const restoredState = undoMove(newState, undo)
        expect(restoredState.activeColor).toBe(Color.WHITE)
    })

    test("should restore move number", () => {
        let state = importFen(INITIAL_FEN)
        state.activeColor = Color.BLACK
        const move: MoveObject = {
            color: Color.BLACK,
            piece: Piece.BIA,
            from: SquareIndex.a6,
            to: SquareIndex.a5,
            flags: BITS.NORMAL,
        }
        const { newState, undo } = applyMove(state, move, { trackUndo: true })
        expect(newState.moveNumber).toBe(2)
        const restoredState = undoMove(newState, undo)
        expect(restoredState.moveNumber).toBe(1)
    })

    test("should restore piece positions", () => {
        const state = importFen(INITIAL_FEN)
        const move: MoveObject = {
            color: Color.WHITE,
            piece: Piece.BIA,
            from: SquareIndex.a3,
            to: SquareIndex.a4,
            flags: BITS.NORMAL,
        }
        const { newState, undo } = applyMove(state, move, { trackUndo: true })
        const restoredState = undoMove(newState, undo)
        expect(restoredState.piecePositions[Color.WHITE][Piece.BIA]).toContain(SquareIndex.a3)
        expect(restoredState.piecePositions[Color.WHITE][Piece.BIA]).not.toContain(SquareIndex.a4)
    })

    test("should restore captured piece", () => {
        let state = importFen(EMPTY_FEN)
        state = put(state, Color.WHITE, Piece.BIA, SquareIndex.d4)
        state = put(state, Color.BLACK, Piece.BIA, SquareIndex.e5)
        const move: MoveObject = {
            color: Color.WHITE,
            piece: Piece.BIA,
            from: SquareIndex.d4,
            to: SquareIndex.e5,
            flags: BITS.CAPTURE,
            captured: Piece.BIA,
        }
        const { newState, undo } = applyMove(state, move, { trackUndo: true })
        const restoredState = undoMove(newState, undo)
        expect(restoredState.boardState[SquareIndex.d4]).toEqual([Color.WHITE, Piece.BIA])
        expect(restoredState.boardState[SquareIndex.e5]).toEqual([Color.BLACK, Piece.BIA])
    })

    test("should update FEN occurrence", () => {
        const state = importFen(INITIAL_FEN)
        const move: MoveObject = {
            color: Color.WHITE,
            piece: Piece.BIA,
            from: SquareIndex.a3,
            to: SquareIndex.a4,
            flags: BITS.NORMAL,
        }
        const { newState, undo } = applyMove(state, move, { trackUndo: true, updateFen: true })
        const newFen = exportFen(newState)
        expect(newState.fenOccurrence[newFen]).toBe(1)
        const restoredState = undoMove(newState, undo)
        expect(restoredState.fenOccurrence[newFen]).toBeUndefined()
    })

    test("should do nothing when undo is undefined", () => {
        const state = importFen(INITIAL_FEN)
        const restoredState = undoMove(state, undefined)
        expect(restoredState.activeColor).toBe(state.activeColor)
        expect(restoredState).toBe(state)
    })

    test("should handle promotion undo", () => {
        let state = importFen(EMPTY_FEN)
        state = put(state, Color.WHITE, Piece.BIA, SquareIndex.d5)
        const move: MoveObject = {
            color: Color.WHITE,
            piece: Piece.BIA,
            from: SquareIndex.d5,
            to: SquareIndex.d6,
            flags: BITS.PROMOTION,
            promotion: Piece.FLIPPED_BIA,
        }
        const { newState, undo } = applyMove(state, move, { trackUndo: true })
        expect(newState.boardState[SquareIndex.d6]).toEqual([Color.WHITE, Piece.FLIPPED_BIA])
        const restoredState = undoMove(newState, undo)
        expect(restoredState.boardState[SquareIndex.d5]).toEqual([Color.WHITE, Piece.BIA])
        expect(restoredState.boardState[SquareIndex.d6]).toBeNull()
    })
})
