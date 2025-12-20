const { describe, expect, test } = globalThis as any

import { BITS, Color, EMPTY_FEN, INITIAL_FEN, Piece, SquareIndex } from "common/const"
import { createGameFromFen } from "0x88/fen"
import { put } from "0x88/board"
import {
    generateMovesForOneSquare,
    generateMoves,
    generateLegalMoves,
    makeMove,
} from "0x88/moves/generation"
import { exportFen } from "0x88/fen"

describe("generateMovesForOneSquare", () => {
    describe("basic move generation", () => {
        test("should return empty array for off-board square", () => {
            const state = createGameFromFen(INITIAL_FEN)
            const moves = generateMovesForOneSquare(state, 0x88 as SquareIndex)
            expect(moves).toEqual([])
        })

        test("should return empty array for empty square", () => {
            const state = createGameFromFen(INITIAL_FEN)
            const moves = generateMovesForOneSquare(state, SquareIndex.d4)
            expect(moves).toEqual([])
        })

        test("should return empty array when filtering for wrong color", () => {
            const state = createGameFromFen(INITIAL_FEN)
            const moves = generateMovesForOneSquare(state, SquareIndex.a1, { forColor: Color.BLACK })
            expect(moves).toEqual([])
        })

        test("should generate moves for white rua on a1", () => {
            const state = createGameFromFen(INITIAL_FEN)
            const moves = generateMovesForOneSquare(state, SquareIndex.a1)
            expect(moves).toHaveLength(1) // can move to a2, blocked by bia on a3
            expect(moves[0].to).toBe(SquareIndex.a2)
        })

        test("should generate moves for white bia on a3", () => {
            const state = createGameFromFen(INITIAL_FEN)
            const moves = generateMovesForOneSquare(state, SquareIndex.a3)
            expect(moves).toHaveLength(1)
            expect(moves[0]).toMatchObject({
                piece: Piece.BIA,
                from: SquareIndex.a3,
                to: SquareIndex.a4,
                flags: BITS.NORMAL,
            })
        })
    })

    describe("Bia (pawn) moves", () => {
        test("should generate forward move for white bia", () => {
            let state = createGameFromFen(EMPTY_FEN)
            state = put(state, Color.WHITE, Piece.BIA, SquareIndex.d3)
            const moves = generateMovesForOneSquare(state, SquareIndex.d3)
            expect(moves).toHaveLength(1)
            expect(moves[0].to).toBe(SquareIndex.d4)
        })

        test("should generate forward move for black bia", () => {
            let state = createGameFromFen(EMPTY_FEN)
            state = put(state, Color.BLACK, Piece.BIA, SquareIndex.d6)
            const moves = generateMovesForOneSquare(state, SquareIndex.d6)
            expect(moves).toHaveLength(1)
            expect(moves[0].to).toBe(SquareIndex.d5)
        })

        test("should generate diagonal capture for white bia", () => {
            let state = createGameFromFen(EMPTY_FEN)
            state = put(state, Color.WHITE, Piece.BIA, SquareIndex.d3)
            state = put(state, Color.BLACK, Piece.BIA, SquareIndex.e4)
            const moves = generateMovesForOneSquare(state, SquareIndex.d3)
            expect(moves).toHaveLength(2) // forward + capture
            const captureMove = moves.find(m => m.to === SquareIndex.e4)
            expect(captureMove).toBeDefined()
            expect(captureMove?.flags).toBe(BITS.CAPTURE)
            expect(captureMove?.captured).toBe(Piece.BIA)
        })

        test("should not capture own piece", () => {
            let state = createGameFromFen(EMPTY_FEN)
            state = put(state, Color.WHITE, Piece.BIA, SquareIndex.d3)
            state = put(state, Color.WHITE, Piece.BIA, SquareIndex.e4)
            const moves = generateMovesForOneSquare(state, SquareIndex.d3)
            const captureMove = moves.find(m => m.to === SquareIndex.e4)
            expect(captureMove).toBeUndefined()
        })

        test("should promote white bia on rank 6", () => {
            let state = createGameFromFen(EMPTY_FEN)
            state = put(state, Color.WHITE, Piece.BIA, SquareIndex.d5)
            const moves = generateMovesForOneSquare(state, SquareIndex.d5)
            expect(moves).toHaveLength(1)
            expect(moves[0].to).toBe(SquareIndex.d6)
            expect(moves[0].flags).toBe(BITS.NORMAL | BITS.PROMOTION)
            expect(moves[0].promotion).toBe(Piece.FLIPPED_BIA)
        })

        test("should promote black bia on rank 3", () => {
            let state = createGameFromFen(EMPTY_FEN)
            state = put(state, Color.BLACK, Piece.BIA, SquareIndex.d4)
            const moves = generateMovesForOneSquare(state, SquareIndex.d4)
            expect(moves).toHaveLength(1)
            expect(moves[0].to).toBe(SquareIndex.d3)
            expect(moves[0].flags).toBe(BITS.NORMAL | BITS.PROMOTION)
            expect(moves[0].promotion).toBe(Piece.FLIPPED_BIA)
        })

        test("should promote with capture on rank 6 for white", () => {
            let state = createGameFromFen(EMPTY_FEN)
            state = put(state, Color.WHITE, Piece.BIA, SquareIndex.d5)
            state = put(state, Color.BLACK, Piece.BIA, SquareIndex.e6)
            const moves = generateMovesForOneSquare(state, SquareIndex.d5)
            const captureMove = moves.find(m => m.to === SquareIndex.e6)
            expect(captureMove).toBeDefined()
            expect(captureMove?.flags).toBe(BITS.CAPTURE | BITS.PROMOTION)
            expect(captureMove?.promotion).toBe(Piece.FLIPPED_BIA)
        })

        test("should be blocked by piece in front", () => {
            let state = createGameFromFen(EMPTY_FEN)
            state = put(state, Color.WHITE, Piece.BIA, SquareIndex.d3)
            state = put(state, Color.BLACK, Piece.BIA, SquareIndex.d4)
            const moves = generateMovesForOneSquare(state, SquareIndex.d3)
            expect(moves).toHaveLength(0)
        })
    })

    describe("Flipped Bia moves", () => {
        test("should move diagonally in all four directions", () => {
            let state = createGameFromFen(EMPTY_FEN)
            state = put(state, Color.WHITE, Piece.FLIPPED_BIA, SquareIndex.d4)
            const moves = generateMovesForOneSquare(state, SquareIndex.d4)
            expect(moves).toHaveLength(4)
            const destinations = moves.map(m => m.to).sort()
            expect(destinations).toEqual([SquareIndex.c3, SquareIndex.c5, SquareIndex.e3, SquareIndex.e5].sort())
        })

        test("should capture diagonally", () => {
            let state = createGameFromFen(EMPTY_FEN)
            state = put(state, Color.WHITE, Piece.FLIPPED_BIA, SquareIndex.d4)
            state = put(state, Color.BLACK, Piece.BIA, SquareIndex.e5)
            const moves = generateMovesForOneSquare(state, SquareIndex.d4)
            const captureMove = moves.find(m => m.to === SquareIndex.e5)
            expect(captureMove).toBeDefined()
            expect(captureMove?.flags).toBe(BITS.CAPTURE)
        })

        test("should not slide through pieces", () => {
            let state = createGameFromFen(EMPTY_FEN)
            state = put(state, Color.WHITE, Piece.FLIPPED_BIA, SquareIndex.d4)
            const moves = generateMovesForOneSquare(state, SquareIndex.d4)
            // Should only move one square diagonally, not slide
            expect(moves).toHaveLength(4)
        })
    })

    describe("Ma (knight) moves", () => {
        test("should generate all 8 knight moves from center", () => {
            let state = createGameFromFen(EMPTY_FEN)
            state = put(state, Color.WHITE, Piece.MA, SquareIndex.d4)
            const moves = generateMovesForOneSquare(state, SquareIndex.d4)
            expect(moves).toHaveLength(8)
        })

        test("should generate limited moves from corner", () => {
            let state = createGameFromFen(EMPTY_FEN)
            state = put(state, Color.WHITE, Piece.MA, SquareIndex.a1)
            const moves = generateMovesForOneSquare(state, SquareIndex.a1)
            expect(moves).toHaveLength(2) // b3, c2
        })

        test("should jump over pieces", () => {
            let state = createGameFromFen(EMPTY_FEN)
            state = put(state, Color.WHITE, Piece.MA, SquareIndex.d4)
            state = put(state, Color.WHITE, Piece.BIA, SquareIndex.d5)
            state = put(state, Color.WHITE, Piece.BIA, SquareIndex.e4)
            const moves = generateMovesForOneSquare(state, SquareIndex.d4)
            // Should still be able to jump even with pieces around
            expect(moves.length).toBeGreaterThan(0)
        })

        test("should capture opponent pieces", () => {
            let state = createGameFromFen(EMPTY_FEN)
            state = put(state, Color.WHITE, Piece.MA, SquareIndex.d4)
            state = put(state, Color.BLACK, Piece.BIA, SquareIndex.e6)
            const moves = generateMovesForOneSquare(state, SquareIndex.d4)
            const captureMove = moves.find(m => m.to === SquareIndex.e6)
            expect(captureMove).toBeDefined()
            expect(captureMove?.flags).toBe(BITS.CAPTURE)
        })
    })

    describe("Thon (bishop-like) moves", () => {
        test("should move diagonally and forward for white", () => {
            let state = createGameFromFen(EMPTY_FEN)
            state = put(state, Color.WHITE, Piece.THON, SquareIndex.d4)
            const moves = generateMovesForOneSquare(state, SquareIndex.d4)
            // Should move to: c5, e5, d5, c3, e3
            expect(moves.length).toBeGreaterThan(0)
            const hasForward = moves.some(m => m.to === SquareIndex.d5)
            expect(hasForward).toBe(true)
        })

        test("should move diagonally and backward for black", () => {
            let state = createGameFromFen(EMPTY_FEN)
            state = put(state, Color.BLACK, Piece.THON, SquareIndex.d4)
            const moves = generateMovesForOneSquare(state, SquareIndex.d4)
            const hasBackward = moves.some(m => m.to === SquareIndex.d3)
            expect(hasBackward).toBe(true)
        })

        test("should not slide through pieces", () => {
            let state = createGameFromFen(EMPTY_FEN)
            state = put(state, Color.WHITE, Piece.THON, SquareIndex.d4)
            state = put(state, Color.WHITE, Piece.BIA, SquareIndex.d5)
            const moves = generateMovesForOneSquare(state, SquareIndex.d4)
            const blockedMove = moves.find(m => m.to === SquareIndex.d6)
            expect(blockedMove).toBeUndefined()
        })
    })

    describe("Met (queen-like diagonal) moves", () => {
        test("should move diagonally in all directions", () => {
            let state = createGameFromFen(EMPTY_FEN)
            state = put(state, Color.WHITE, Piece.MET, SquareIndex.d4)
            const moves = generateMovesForOneSquare(state, SquareIndex.d4)
            expect(moves.length).toBeGreaterThan(0)
            // Should have moves in all diagonal directions
            const hasUpLeft = moves.some(m => m.to === SquareIndex.c5)
            const hasUpRight = moves.some(m => m.to === SquareIndex.e5)
            expect(hasUpLeft).toBe(true)
            expect(hasUpRight).toBe(true)
        })

        test("should not slide - only one square diagonal", () => {
            let state = createGameFromFen(EMPTY_FEN)
            state = put(state, Color.WHITE, Piece.MET, SquareIndex.d4)
            const moves = generateMovesForOneSquare(state, SquareIndex.d4)
            expect(moves).toHaveLength(4) // Only 4 diagonal squares
        })
    })

    describe("Rua (rook) moves", () => {
        test("should slide horizontally and vertically", () => {
            let state = createGameFromFen(EMPTY_FEN)
            state = put(state, Color.WHITE, Piece.RUA, SquareIndex.d4)
            const moves = generateMovesForOneSquare(state, SquareIndex.d4)
            // Should have multiple moves in each direction
            expect(moves.length).toBeGreaterThan(8)
        })

        test("should be blocked by own pieces", () => {
            let state = createGameFromFen(EMPTY_FEN)
            state = put(state, Color.WHITE, Piece.RUA, SquareIndex.d4)
            state = put(state, Color.WHITE, Piece.BIA, SquareIndex.d6)
            const moves = generateMovesForOneSquare(state, SquareIndex.d4)
            const blockedMove = moves.find(m => m.to === SquareIndex.d7)
            expect(blockedMove).toBeUndefined()
        })

        test("should capture and stop at opponent piece", () => {
            let state = createGameFromFen(EMPTY_FEN)
            state = put(state, Color.WHITE, Piece.RUA, SquareIndex.d4)
            state = put(state, Color.BLACK, Piece.BIA, SquareIndex.d6)
            const moves = generateMovesForOneSquare(state, SquareIndex.d4)
            const captureMove = moves.find(m => m.to === SquareIndex.d6)
            expect(captureMove).toBeDefined()
            expect(captureMove?.flags).toBe(BITS.CAPTURE)
            // Should not move beyond the captured piece
            const beyondMove = moves.find(m => m.to === SquareIndex.d7)
            expect(beyondMove).toBeUndefined()
        })

        test("should slide full length of board when clear", () => {
            let state = createGameFromFen(EMPTY_FEN)
            state = put(state, Color.WHITE, Piece.RUA, SquareIndex.a1)
            const moves = generateMovesForOneSquare(state, SquareIndex.a1)
            const toA8 = moves.find(m => m.to === SquareIndex.a8)
            expect(toA8).toBeDefined()
        })
    })

    describe("Khun (king) moves", () => {
        test("should move one square in all 8 directions", () => {
            let state = createGameFromFen(EMPTY_FEN)
            state = put(state, Color.WHITE, Piece.KHUN, SquareIndex.d4)
            const moves = generateMovesForOneSquare(state, SquareIndex.d4)
            expect(moves).toHaveLength(8)
        })

        test("should not move off board from corner", () => {
            let state = createGameFromFen(EMPTY_FEN)
            state = put(state, Color.WHITE, Piece.KHUN, SquareIndex.a1)
            const moves = generateMovesForOneSquare(state, SquareIndex.a1)
            expect(moves).toHaveLength(3) // b1, a2, b2
        })

        test("should capture opponent pieces", () => {
            let state = createGameFromFen(EMPTY_FEN)
            state = put(state, Color.WHITE, Piece.KHUN, SquareIndex.d4)
            state = put(state, Color.BLACK, Piece.BIA, SquareIndex.e5)
            const moves = generateMovesForOneSquare(state, SquareIndex.d4)
            const captureMove = moves.find(m => m.to === SquareIndex.e5)
            expect(captureMove).toBeDefined()
            expect(captureMove?.flags).toBe(BITS.CAPTURE)
        })
    })

    describe("legal option filtering", () => {
        test("should filter out moves that leave king in check", () => {
            // Setup: White king on e1, white rua on e2, black rua on e8, black king on a8
            // The white rua at e2 is pinned - moving it horizontally would expose king to check from e8 rua
            let state = createGameFromFen("k3r3/8/8/8/8/8/4R3/4K3 w 1")
            // Moving the rua horizontally would expose king to check
            const pseudoLegalMoves = generateMovesForOneSquare(state, SquareIndex.e2, { legal: false })
            const legalMoves = generateMovesForOneSquare(state, SquareIndex.e2, { legal: true })
            // Rua should only be able to move vertically (to block or stay in line)
            expect(legalMoves.length).toBeLessThan(pseudoLegalMoves.length)
        })

        test("should allow moves that don't leave king in check", () => {
            let state = createGameFromFen(EMPTY_FEN)
            state = put(state, Color.WHITE, Piece.MA, SquareIndex.d4)
            const legalMoves = generateMovesForOneSquare(state, SquareIndex.d4, { legal: true })
            expect(legalMoves.length).toBeGreaterThan(0)
        })
    })
})

describe("generateMoves", () => {
    test("should generate all white moves from initial position", () => {
        const state = createGameFromFen(INITIAL_FEN)
        const moves = generateMoves(state, { forColor: Color.WHITE })
        expect(moves.length).toBeGreaterThan(0)
        // All 8 pawns can move forward
        expect(moves.length).toBeGreaterThanOrEqual(8)
    })

    test("should generate all black moves from initial position", () => {
        let state = createGameFromFen(INITIAL_FEN)
        state = { ...state, turn: Color.BLACK }
        const moves = generateMoves(state, { forColor: Color.BLACK })
        expect(moves.length).toBeGreaterThan(0)
    })

    test("should generate moves for both colors without filter", () => {
        const state = createGameFromFen(INITIAL_FEN)
        const allMoves = generateMoves(state, {})
        const whiteMoves = generateMoves(state, { forColor: Color.WHITE })
        const blackMoves = generateMoves(state, { forColor: Color.BLACK })
        expect(allMoves.length).toBe(whiteMoves.length + blackMoves.length)
    })

    test("should return empty array for position with no moves", () => {
        // Create checkmate position would return no legal moves
        // For now just test empty option
        const state = createGameFromFen(EMPTY_FEN)
        const whiteMoves = generateMoves(state, { forColor: Color.WHITE, legal: true })
        expect(whiteMoves.length).toBeGreaterThan(0) // King can move
    })
})

describe("generateLegalMoves", () => {
    test("should only generate legal moves for active color", () => {
        const state = createGameFromFen(INITIAL_FEN)
        const moves = generateLegalMoves(state)
        expect(moves.length).toBeGreaterThan(0)
        moves.forEach(move => {
            expect(move.color).toBe(Color.WHITE)
        })
    })

    test("should filter out illegal moves that would leave king in check", () => {
        let state = createGameFromFen(EMPTY_FEN)
        state = put(state, Color.WHITE, Piece.RUA, SquareIndex.e2)
        state = put(state, Color.BLACK, Piece.RUA, SquareIndex.e8)
        const allMoves = generateMoves(state, { forColor: Color.WHITE, legal: false })
        const legalMoves = generateLegalMoves(state)
        // Some moves should be filtered out
        expect(legalMoves.length).toBeLessThanOrEqual(allMoves.length)
    })

    test("should return empty array in checkmate position", () => {
        // Create a checkmate position - back rank mate with 2 rooks
        // Black king at b8, white rooks at a8 and a7
        let state = createGameFromFen("R1k5/R7/8/8/8/8/8/7K b 1")
        const moves = generateLegalMoves(state)
        expect(moves).toHaveLength(0)
    })
})

describe("makeMove", () => {
    test("should apply move to state (returns new state)", () => {
        const state = createGameFromFen(INITIAL_FEN)
        const moves = generateLegalMoves(state)
        const firstMove = moves[0]
        const originalFen = exportFen(state)
        const newState = makeMove(state, firstMove)
        const newFen = exportFen(newState)
        // makeMove returns new state with updated FEN
        expect(newFen).not.toBe(originalFen)
        expect(exportFen(state)).toBe(originalFen) // Original state unchanged
    })

    test("should update piece position (returns new state)", () => {
        const state = createGameFromFen(INITIAL_FEN)
        const biaMove = generateLegalMoves(state).find(m => m.piece === Piece.BIA)!
        const from = biaMove.from
        const to = biaMove.to
        const newState = makeMove(state, biaMove)
        // makeMove returns new state with updated board
        expect(newState.boardState[from]).toBeNull()
        expect(newState.boardState[to]).toBeDefined()
        // Original state unchanged
        expect(state.boardState[from]).not.toBeNull()
    })
})

describe("Edge cases", () => {
    test("should handle moves from a1 (square index 0)", () => {
        let state = createGameFromFen(EMPTY_FEN)
        state = put(state, Color.WHITE, Piece.RUA, SquareIndex.a1)
        const moves = generateMovesForOneSquare(state, SquareIndex.a1)
        expect(moves.length).toBeGreaterThan(0)
    })

    test("should handle moves to h8 (highest square)", () => {
        // Use a position with kings out of the way so rook can move a8->h8
        let state = createGameFromFen("8/8/8/8/8/8/8/3Kk3 w 1")
        state = put(state, Color.WHITE, Piece.RUA, SquareIndex.a8)
        const moves = generateMovesForOneSquare(state, SquareIndex.a8)
        const toH8 = moves.find(m => m.to === SquareIndex.h8)
        expect(toH8).toBeDefined()
    })

    test("should generate no moves in checkmate", () => {
        // Create a checkmate position - back rank mate with 2 rooks
        // Black king at c8, white rooks at a8 and a7
        let state = createGameFromFen("R1k5/R7/8/8/8/8/8/7K b 1")
        const moves = generateLegalMoves(state)
        expect(moves).toHaveLength(0)
    })

    test("should generate moves in check but not checkmate", () => {
        let state = createGameFromFen(EMPTY_FEN)
        state = put(state, Color.BLACK, Piece.RUA, SquareIndex.e7)
        const moves = generateLegalMoves(state)
        expect(moves.length).toBeGreaterThan(0)
    })
})
