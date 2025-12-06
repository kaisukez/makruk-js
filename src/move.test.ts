import { BITS, Color, EMPTY_FEN, INITIAL_FEN, Piece, SquareIndex } from "./constants"
import { generateLegalMoves, applyMove, undoMove } from "./move"
import { exportFen, importFen, put } from "./state"

const { describe, expect, test } = globalThis as any

describe("applyMove / undoMove", () => {
    test("mutates and restores state", () => {
        const state = importFen(INITIAL_FEN)
        const [firstMove] = generateLegalMoves(state)
        expect(firstMove).toBeDefined()

        const originalFen = exportFen(state)
        const undo = applyMove(state, firstMove!, {
            trackUndo: true,
            updateFen: true,
        })!

        expect(exportFen(state)).not.toBe(originalFen)

        undoMove(state, undo)
        expect(exportFen(state)).toBe(originalFen)
    })

    test("moves pieces from a1 (square index 0)", () => {
        const state = importFen(EMPTY_FEN)
        put(state, Color.WHITE, Piece.RUA, SquareIndex.a1)

        const move = {
            color: Color.WHITE,
            piece: Piece.RUA,
            from: SquareIndex.a1,
            to: SquareIndex.a2,
            flags: BITS.NORMAL,
        }

        applyMove(state, move)

        expect(state.boardState[SquareIndex.a1]).toBeNull()
        expect(state.boardState[SquareIndex.a2]).toEqual([Color.WHITE, Piece.RUA])
        expect(state.piecePositions[Color.WHITE][Piece.RUA]).toEqual([SquareIndex.a2])
    })
})

