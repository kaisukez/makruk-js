import { Color, SquareIndex } from "config"
import { importFen, INITIAL_FEN } from "core/fen/importer"

import { canThisColorAttackThisSquare, isKhunAttacked } from "core/rules/attacks"

describe("attacks", () => {
    describe("canThisColorAttackThisSquare", () => {
        it("should detect no attacks on empty board", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4K3 w 1")
            const result = canThisColorAttackThisSquare(
                state.boardState,
                Color.WHITE,
                SquareIndex.e4
            )
            expect(result).toBe(false)
        })

        it("should detect Khun attack on adjacent square", () => {
            const state = importFen("4k3/8/8/8/4K3/8/8/8 w 1")
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.e5)).toBe(true)
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.d4)).toBe(true)
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.f4)).toBe(true)
        })

        it("should not detect Khun attack on distant square", () => {
            const state = importFen("4k3/8/8/8/4K3/8/8/8 w 1")
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.a1)).toBe(false)
        })

        it("should detect Met attack on diagonal", () => {
            const state = importFen("4k3/8/8/8/4E3/8/8/4K3 w 1")
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.d5)).toBe(true)
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.f5)).toBe(true)
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.d3)).toBe(true)
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.f3)).toBe(true)
        })

        it("should detect Ma attack in L-shape", () => {
            const state = importFen("4k3/8/8/8/4M3/8/8/4K3 w 1")
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.c3)).toBe(true)
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.c5)).toBe(true)
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.d2)).toBe(true)
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.d6)).toBe(true)
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.f2)).toBe(true)
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.f6)).toBe(true)
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.g3)).toBe(true)
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.g5)).toBe(true)
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.e6)).toBe(false)
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.e3)).toBe(false)
        })

        it("should detect white Bia attack diagonally forward", () => {
            const state = importFen("4k3/8/8/8/4B3/8/8/4K3 w 1")
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.d5)).toBe(true)
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.f5)).toBe(true)
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.d3)).toBe(false)
        })

        it("should detect black Bia attack diagonally forward", () => {
            const state = importFen("4k3/8/8/8/3b4/8/8/4K3 w 1")
            expect(canThisColorAttackThisSquare(state.boardState, Color.BLACK, SquareIndex.c3)).toBe(true)
            expect(canThisColorAttackThisSquare(state.boardState, Color.BLACK, SquareIndex.e3)).toBe(true)
            expect(canThisColorAttackThisSquare(state.boardState, Color.BLACK, SquareIndex.c5)).toBe(false)
            expect(canThisColorAttackThisSquare(state.boardState, Color.BLACK, SquareIndex.e5)).toBe(false)
        })

        it("should detect Rua attack along rank", () => {
            const state = importFen("4k3/8/8/8/3R4/8/8/4K3 w 1")
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.a4)).toBe(true)
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.h4)).toBe(true)
        })

        it("should detect Rua attack along file", () => {
            const state = importFen("4k3/8/8/8/3R4/8/8/4K3 w 1")
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.d1)).toBe(true)
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.d8)).toBe(true)
        })

        it("should not detect Rua attack when blocked", () => {
            const state = importFen("4k3/8/8/8/3Rb3/8/8/4K3 w 1")
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.h4)).toBe(false)
        })

        it("should detect Thon attack (one square diagonally or straight forward)", () => {
            const state = importFen("4k3/8/8/8/3T4/8/8/4K3 w 1")
            // White Thon at d4 can attack one square diagonally (all 4 directions) or one square straight up
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.c5)).toBe(true)
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.d5)).toBe(true)
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.e5)).toBe(true)
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.c3)).toBe(true)
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.e3)).toBe(true)
            // Cannot attack sideways or straight down
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.c4)).toBe(false)
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.e4)).toBe(false)
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.d3)).toBe(false)
        })

        it("should detect black Thon attack (one square diagonally or straight forward)", () => {
            const state = importFen("4k3/8/8/3t4/8/8/8/4K3 w 1")
            // Black Thon at d5 can attack one square diagonally (all 4 directions) or one square straight down
            expect(canThisColorAttackThisSquare(state.boardState, Color.BLACK, SquareIndex.c4)).toBe(true)
            expect(canThisColorAttackThisSquare(state.boardState, Color.BLACK, SquareIndex.d4)).toBe(true)
            expect(canThisColorAttackThisSquare(state.boardState, Color.BLACK, SquareIndex.e4)).toBe(true)
            expect(canThisColorAttackThisSquare(state.boardState, Color.BLACK, SquareIndex.c6)).toBe(true)
            expect(canThisColorAttackThisSquare(state.boardState, Color.BLACK, SquareIndex.e6)).toBe(true)
            // Cannot attack sideways or straight up
            expect(canThisColorAttackThisSquare(state.boardState, Color.BLACK, SquareIndex.c5)).toBe(false)
            expect(canThisColorAttackThisSquare(state.boardState, Color.BLACK, SquareIndex.e5)).toBe(false)
            expect(canThisColorAttackThisSquare(state.boardState, Color.BLACK, SquareIndex.d6)).toBe(false)
        })

        it("should only consider pieces of specified color", () => {
            const state = importFen("4k3/8/8/8/3r4/8/8/4K3 w 1")
            expect(canThisColorAttackThisSquare(state.boardState, Color.WHITE, SquareIndex.a4)).toBe(false)
            expect(canThisColorAttackThisSquare(state.boardState, Color.BLACK, SquareIndex.a4)).toBe(true)
        })
    })

    describe("isKhunAttacked", () => {
        it("should return false when Khun not attacked", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4K3 w 1")
            expect(isKhunAttacked(state, Color.WHITE)).toBe(false)
            expect(isKhunAttacked(state, Color.BLACK)).toBe(false)
        })

        it("should return true when white Khun attacked by black Rua", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4Kr2 w 1")
            expect(isKhunAttacked(state, Color.WHITE)).toBe(true)
        })

        it("should return true when black Khun attacked by white Rua", () => {
            const state = importFen("4kR2/8/8/8/8/8/8/4K3 w 1")
            expect(isKhunAttacked(state, Color.BLACK)).toBe(true)
        })

        it("should return true when Khun attacked by Ma", () => {
            const state = importFen("4k3/8/8/8/8/3m4/8/4K3 w 1")
            expect(isKhunAttacked(state, Color.WHITE)).toBe(true)
        })

        it("should return false when attack is blocked", () => {
            const state = importFen("4kr2/4B3/8/8/8/8/8/4K3 w 1")
            expect(isKhunAttacked(state, Color.BLACK)).toBe(false)
        })

        it("should work on initial position", () => {
            const state = importFen(INITIAL_FEN)
            expect(isKhunAttacked(state, Color.WHITE)).toBe(false)
            expect(isKhunAttacked(state, Color.BLACK)).toBe(false)
        })
    })
})
