const { describe, expect, test } = globalThis as any

import { BITS, Color, EMPTY_FEN, INITIAL_FEN, Piece, SquareIndex } from "common/const"
import { importFen, exportFen } from "0x88/fen"
import { put } from "0x88/board"
import { generateLegalMoves } from "0x88/moves/generation"
import { move } from "0x88/moves/notation"
import { applyMove, undoMove } from "0x88/moves/execution"

describe("Integration: Complete game flow", () => {
    test("should play sequence of moves and undo them", () => {
        const state = importFen(INITIAL_FEN)
        const originalFen = exportFen(state)

        // Make 3 moves
        const { newState: state1, undo: undo1 } = applyMove(state, generateLegalMoves(state)[0], { trackUndo: true })
        const { newState: state2, undo: undo2 } = applyMove(state1, generateLegalMoves(state1)[0], { trackUndo: true })
        const { newState: state3, undo: undo3 } = applyMove(state2, generateLegalMoves(state2)[0], { trackUndo: true })

        // Undo all moves
        let undoState = undoMove(state3, undo3)
        undoState = undoMove(undoState, undo2)
        undoState = undoMove(undoState, undo1)

        expect(exportFen(undoState)).toBe(originalFen)
    })

    test("should maintain immutability throughout move sequence", () => {
        const state = importFen(INITIAL_FEN)
        const fen0 = exportFen(state)

        const state1 = move(state, "a4")
        const fen1 = exportFen(state)
        expect(fen1).toBe(fen0)

        const state2 = move(state1, "a5")
        const fen1Again = exportFen(state1)
        expect(fen1Again).not.toBe(fen0)
        expect(fen1Again).not.toBe(exportFen(state2))
    })

    test("should correctly track FEN occurrences for repetition", () => {
        let state = importFen(EMPTY_FEN)
        state = put(state, Color.WHITE, Piece.MA, SquareIndex.b1)

        // Move knight back and forth
        const { newState: s1 } = applyMove(state, { color: Color.WHITE, piece: Piece.MA, from: SquareIndex.b1, to: SquareIndex.c3, flags: BITS.NORMAL }, { updateFen: true })
        const { newState: s2 } = applyMove(s1, { color: Color.BLACK, piece: Piece.KHUN, from: SquareIndex.a8, to: SquareIndex.b8, flags: BITS.NORMAL }, { updateFen: true })
        const { newState: s3 } = applyMove(s2, { color: Color.WHITE, piece: Piece.MA, from: SquareIndex.c3, to: SquareIndex.b1, flags: BITS.NORMAL }, { updateFen: true })
        const { newState: s4 } = applyMove(s3, { color: Color.BLACK, piece: Piece.KHUN, from: SquareIndex.b8, to: SquareIndex.a8, flags: BITS.NORMAL }, { updateFen: true })

        // Position should repeat
        const finalFen = exportFen(s4)
        expect(s4.fenOccurrence[finalFen]).toBeGreaterThanOrEqual(1)
    })
})
