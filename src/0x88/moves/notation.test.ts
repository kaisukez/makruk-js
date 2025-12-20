const { describe, expect, test } = globalThis as any

import { BITS, Color, EMPTY_FEN, INITIAL_FEN, Piece, SquareIndex } from "common/const"
import { createGameFromFen, exportFen } from "0x88/fen"
import { put } from "0x88/board"
import { generateLegalMoves } from "0x88/moves/generation"
import {
    getDisambiguator,
    moveToSan,
    strippedSan,
    moveFromSan,
    moveFromMoveObject,
    move,
} from "0x88/moves/notation"
import { MoveObject } from "0x88/types"

describe("getDisambiguator", () => {
    test("should return empty string when no ambiguity", () => {
        const state = createGameFromFen(INITIAL_FEN)
        const moves = generateLegalMoves(state)
        const biaMove = moves.find(m => m.piece === Piece.BIA && m.from === SquareIndex.a3)!
        const disambiguator = getDisambiguator(moves, biaMove)
        expect(disambiguator).toBe("")
    })

    test("should return file when pieces on same rank", () => {
        // Two rooks on same rank, different files
        let state = createGameFromFen(EMPTY_FEN)
        state = put(state, Color.WHITE, Piece.RUA, SquareIndex.a4)
        state = put(state, Color.WHITE, Piece.RUA, SquareIndex.h4)
        const moves = generateLegalMoves(state)
        const move = moves.find(m => m.from === SquareIndex.a4 && m.to === SquareIndex.d4)!
        const disambiguator = getDisambiguator(moves, move)
        expect(disambiguator).toBe("a")
    })

    test("should return rank when pieces on same file", () => {
        // Two rooks on same file, different ranks
        let state = createGameFromFen(EMPTY_FEN)
        state = put(state, Color.WHITE, Piece.RUA, SquareIndex.d1)
        state = put(state, Color.WHITE, Piece.RUA, SquareIndex.d8)
        const moves = generateLegalMoves(state)
        const move = moves.find(m => m.from === SquareIndex.d1 && m.to === SquareIndex.d4)!
        const disambiguator = getDisambiguator(moves, move)
        expect(disambiguator).toBe("1")
    })

    test("should return rank when pieces on same file", () => {
        // Rooks at d1 and d7 can both move to d4 (same file), need rank disambiguation
        let state = createGameFromFen(EMPTY_FEN)
        state = put(state, Color.WHITE, Piece.RUA, SquareIndex.d1)
        state = put(state, Color.WHITE, Piece.RUA, SquareIndex.d7)
        const moves = generateLegalMoves(state)
        const move = moves.find(m => m.from === SquareIndex.d1 && m.to === SquareIndex.d4)!
        const disambiguator = getDisambiguator(moves, move)
        expect(disambiguator).toBe("1")
    })
})

describe("moveToSan", () => {
    test("should convert simple bia move to SAN", () => {
        const state = createGameFromFen(INITIAL_FEN)
        const move: MoveObject = {
            color: Color.WHITE,
            piece: Piece.BIA,
            from: SquareIndex.a3,
            to: SquareIndex.a4,
            flags: BITS.NORMAL,
        }
        const san = moveToSan(state, move)
        expect(san).toBe("a4")
    })

    test("should convert piece move with piece letter", () => {
        let state = createGameFromFen(EMPTY_FEN)
        state = put(state, Color.WHITE, Piece.MA, SquareIndex.b1)
        const move: MoveObject = {
            color: Color.WHITE,
            piece: Piece.MA,
            from: SquareIndex.b1,
            to: SquareIndex.c3,
            flags: BITS.NORMAL,
        }
        const san = moveToSan(state, move)
        expect(san).toBe("Mc3")
    })

    test("should include capture symbol for captures", () => {
        let state = createGameFromFen(EMPTY_FEN)
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
        const san = moveToSan(state, move)
        expect(san).toBe("dxe5")
    })

    test("should include promotion symbol", () => {
        let state = createGameFromFen(EMPTY_FEN)
        state = put(state, Color.WHITE, Piece.BIA, SquareIndex.d5)
        const move: MoveObject = {
            color: Color.WHITE,
            piece: Piece.BIA,
            from: SquareIndex.d5,
            to: SquareIndex.d6,
            flags: BITS.NORMAL | BITS.PROMOTION,
            promotion: Piece.FLIPPED_BIA,
        }
        const san = moveToSan(state, move)
        expect(san).toBe("d6=F")
    })

    test("should include check symbol", () => {
        // Setup position where move gives check
        let state = createGameFromFen(EMPTY_FEN)
        state = put(state, Color.WHITE, Piece.RUA, SquareIndex.a1)
        state = put(state, Color.BLACK, Piece.KHUN, SquareIndex.h1)
        // This would be capturing the king, which shouldn't happen
        // Let's test a valid check instead
        // TODO: Add proper check test
    })

    test("should include checkmate symbol", () => {
        // Setup checkmate position
        let state = createGameFromFen(EMPTY_FEN)
        state = put(state, Color.WHITE, Piece.RUA, SquareIndex.e7)
        state = put(state, Color.BLACK, Piece.KHUN, SquareIndex.e8)
        // Can't capture king, this is theoretical
        // TODO: Add proper checkmate test
    })

    test("should include disambiguator for ambiguous moves", () => {
        let state = createGameFromFen(EMPTY_FEN)
        state = put(state, Color.WHITE, Piece.RUA, SquareIndex.a4)
        state = put(state, Color.WHITE, Piece.RUA, SquareIndex.h4)
        const move: MoveObject = {
            color: Color.WHITE,
            piece: Piece.RUA,
            from: SquareIndex.a4,
            to: SquareIndex.d4,
            flags: BITS.NORMAL,
        }
        const san = moveToSan(state, move)
        expect(san).toBe("Rad4")
    })
})

describe("strippedSan", () => {
    test("should remove check symbol", () => {
        const stripped = strippedSan("Mc3+")
        expect(stripped).toBe("Mc3")
    })

    test("should remove checkmate symbol", () => {
        const stripped = strippedSan("Rh8#")
        expect(stripped).toBe("Rh8")
    })

    test("should remove capture symbol", () => {
        const stripped = strippedSan("dxe5")
        expect(stripped).toBe("de5")
    })

    test("should remove promotion symbol", () => {
        const stripped = strippedSan("d8=F")
        expect(stripped).toBe("d8F")
    })

    test("should handle multiple decorations", () => {
        const stripped = strippedSan("dxe8=F+")
        expect(stripped).toBe("de8F")
    })

    test("should preserve piece letters and coordinates", () => {
        const stripped = strippedSan("Rad4")
        expect(stripped).toBe("Rad4")
    })

    test("should handle Thai characters in SAN", () => {
        // Thai file characters: กขคงจฉชญ for abcdefgh
        const stripped = strippedSan("ก3") // Thai 'a'
        expect(stripped).toBe("ก3")
    })
})

describe("moveFromSan", () => {
    test("should parse simple bia move", () => {
        const state = createGameFromFen(INITIAL_FEN)
        const move = moveFromSan(state, "a4")
        expect(move).toBeDefined()
        expect(move?.from).toBe(SquareIndex.a3)
        expect(move?.to).toBe(SquareIndex.a4)
    })

    test("should parse piece move", () => {
        let state = createGameFromFen(EMPTY_FEN)
        state = put(state, Color.WHITE, Piece.MA, SquareIndex.b1)
        const move = moveFromSan(state, "Mc3")
        expect(move?.piece).toBe(Piece.MA)
    })

    test("should parse capture move", () => {
        let state = createGameFromFen(EMPTY_FEN)
        state = put(state, Color.WHITE, Piece.BIA, SquareIndex.d4)
        state = put(state, Color.BLACK, Piece.BIA, SquareIndex.e5)
        const move = moveFromSan(state, "dxe5")
        expect(move).toBeDefined()
        expect(move?.flags).toBe(BITS.CAPTURE)
    })

    test("should parse move with check decoration", () => {
        const state = createGameFromFen(INITIAL_FEN)
        const move = moveFromSan(state, "a4+")
        // Will parse even if it doesn't actually give check
        expect(move?.to).toBe(SquareIndex.a4)
    })

    test("should return undefined for illegal move", () => {
        const state = createGameFromFen(INITIAL_FEN)
        const move = moveFromSan(state, "a5")
        expect(move).toBeUndefined()
    })

    test("should parse disambiguated move", () => {
        let state = createGameFromFen(EMPTY_FEN)
        state = put(state, Color.WHITE, Piece.RUA, SquareIndex.a4)
        state = put(state, Color.WHITE, Piece.RUA, SquareIndex.h4)
        const move = moveFromSan(state, "Rad4")
        expect(move).toBeDefined()
        expect(move?.from).toBe(SquareIndex.a4)
    })
})

describe("moveFromMoveObject", () => {
    test("should validate move object with numeric coordinates", () => {
        const state = createGameFromFen(INITIAL_FEN)
        const moveObj = {
            from: SquareIndex.a3,
            to: SquareIndex.a4,
        }
        const move = moveFromMoveObject(state, moveObj as any)
        expect(move).toBeDefined()
        expect(move?.piece).toBe(Piece.BIA)
    })

    test("should validate move object with algebraic coordinates", () => {
        const state = createGameFromFen(INITIAL_FEN)
        const moveObj = {
            from: "a3",
            to: "a4",
        }
        const move = moveFromMoveObject(state, moveObj as any)
        expect(move).toBeDefined()
    })

    test("should return undefined for illegal move object", () => {
        const state = createGameFromFen(INITIAL_FEN)
        const moveObj = {
            from: SquareIndex.a2,
            to: SquareIndex.a5,
        }
        const move = moveFromMoveObject(state, moveObj as any)
        expect(move).toBeUndefined()
    })
})

describe("move", () => {
    test("should execute move from SAN string", () => {
        const state = createGameFromFen(INITIAL_FEN)
        const newState = move(state, "a4")
        expect(newState.boardState[SquareIndex.a3]).toBeNull()
        expect(newState.boardState[SquareIndex.a4]).toEqual([Color.WHITE, Piece.BIA])
    })

    test("should execute move from move object", () => {
        const state = createGameFromFen(INITIAL_FEN)
        const newState = move(state, { from: SquareIndex.a3, to: SquareIndex.a4 } as any)
        expect(newState.boardState[SquareIndex.a4]).toEqual([Color.WHITE, Piece.BIA])
    })

    test("should throw error for invalid SAN", () => {
        const state = createGameFromFen(INITIAL_FEN)
        try {
            move(state, "a8")
            fail("Should have thrown error")
        } catch (error: any) {
            expect(error.code).toBe("INVALID_MOVE")
        }
    })

    test("should throw error for invalid move object", () => {
        const state = createGameFromFen(INITIAL_FEN)
        try {
            move(state, { from: SquareIndex.a3, to: SquareIndex.a8 } as any)
            fail("Should have thrown error")
        } catch (error: any) {
            expect(error.code).toBe("INVALID_MOVE")
        }
    })

    test("should update active color after move", () => {
        const state = createGameFromFen(INITIAL_FEN)
        const newState = move(state, "a4")
        expect(newState.turn).toBe(Color.BLACK)
    })

    test("should increment move number after black moves", () => {
        let state = createGameFromFen(INITIAL_FEN)
        state = move(state, "a4") // White
        expect(state.moveNumber).toBe(1)
        state = move(state, "a5") // Black (bia on a6 moves to a5)
        expect(state.moveNumber).toBe(2)
    })

    test("should not mutate original state", () => {
        const state = createGameFromFen(INITIAL_FEN)
        const originalFen = exportFen(state)
        const newState = move(state, "a4")
        expect(exportFen(state)).toBe(originalFen)
        expect(exportFen(newState)).not.toBe(originalFen)
    })
})
