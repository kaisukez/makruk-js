import { INITIAL_FEN } from "./constants"
import { generateLegalMoves, applyMove, undoMove } from "./move"
import { exportFen, importFen } from "./state"

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
})

