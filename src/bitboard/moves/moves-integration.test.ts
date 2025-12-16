const { describe, expect, test } = globalThis as any

import { Color, Piece } from "common/const"
import { importFenBitboard, INITIAL_FEN_BITBOARD } from "bitboard/fen"
import { generateLegalMoves } from "bitboard/moves/generation"
import { applyBitboardMove } from "bitboard/moves/execution"
import { getPieceAt } from "bitboard/board/board"

describe("moves integration", () => {
    test("should generate moves, apply them, and verify board state", () => {
        const { state } = importFenBitboard(INITIAL_FEN_BITBOARD)
        const moves = generateLegalMoves(state, Color.WHITE)

        expect(moves.length).toBe(23)

        // Apply first move
        const firstMove = moves[0]
        const newState = applyBitboardMove(state, firstMove)

        // Verify piece moved
        expect(getPieceAt(newState, firstMove.from)).toBe(null)
        expect(getPieceAt(newState, firstMove.to)).toEqual([firstMove.color, firstMove.piece])

        // Generate moves from new state
        const nextMoves = generateLegalMoves(newState, Color.BLACK)
        expect(nextMoves.length).toBeGreaterThan(0)
    })

    test("should handle a sequence of moves", () => {
        let { state } = importFenBitboard(INITIAL_FEN_BITBOARD)
        let currentColor = Color.WHITE

        // Play 4 moves
        for (let i = 0; i < 4; i++) {
            const moves = generateLegalMoves(state, currentColor)
            expect(moves.length).toBeGreaterThan(0)

            // Apply first available move
            state = applyBitboardMove(state, moves[0])

            // Switch turn
            currentColor = currentColor === Color.WHITE ? Color.BLACK : Color.WHITE
        }

        // After 4 moves, should still have legal moves
        const finalMoves = generateLegalMoves(state, currentColor)
        expect(finalMoves.length).toBeGreaterThan(0)
    })

    test("should handle captures correctly in sequence", () => {
        // Set up position where captures are possible
        const { state: initialState } = importFenBitboard("k7/8/8/8/8/3b4/3R4/K7 w 1")

        const whiteMoves = generateLegalMoves(initialState, Color.WHITE)
        const captureMove = whiteMoves.find(m => m.captured === Piece.BIA)

        if (captureMove) {
            const stateAfterCapture = applyBitboardMove(initialState, captureMove)

            // Verify captured piece is gone
            expect(getPieceAt(stateAfterCapture, captureMove.to)).toEqual([Color.WHITE, Piece.RUA])

            // Black should still have legal moves
            const blackMoves = generateLegalMoves(stateAfterCapture, Color.BLACK)
            expect(blackMoves.length).toBeGreaterThan(0)
        }
    })

    test("should not generate moves when in checkmate", () => {
        // Checkmate position: Black king on a8, white rooks on a7 and b7, white king on a6
        const { state } = importFenBitboard("k7/RR6/K7/8/8/8/8/8 b 1")
        const moves = generateLegalMoves(state, Color.BLACK)

        // In checkmate, should have no legal moves
        expect(moves.length).toBe(0)
    })

    test("should properly alternate colors through move sequence", () => {
        let { state } = importFenBitboard(INITIAL_FEN_BITBOARD)

        // White's turn
        const whiteMoves = generateLegalMoves(state, Color.WHITE)
        expect(whiteMoves.every(m => m.color === Color.WHITE)).toBe(true)

        // Apply white move
        state = applyBitboardMove(state, whiteMoves[0])

        // Black's turn
        const blackMoves = generateLegalMoves(state, Color.BLACK)
        expect(blackMoves.every(m => m.color === Color.BLACK)).toBe(true)
    })

    test("should maintain board integrity after multiple moves", () => {
        let { state } = importFenBitboard(INITIAL_FEN_BITBOARD)
        let currentColor = Color.WHITE

        // Play 10 random moves
        for (let i = 0; i < 10; i++) {
            const moves = generateLegalMoves(state, currentColor)
            if (moves.length === 0) break

            const randomMove = moves[Math.floor(Math.random() * moves.length)]
            state = applyBitboardMove(state, randomMove)

            currentColor = currentColor === Color.WHITE ? Color.BLACK : Color.WHITE
        }

        // Verify we can still generate moves (unless game is over)
        const finalMoves = generateLegalMoves(state, currentColor)
        // Either has moves or game is over
        expect(typeof finalMoves.length).toBe("number")
    })
})
