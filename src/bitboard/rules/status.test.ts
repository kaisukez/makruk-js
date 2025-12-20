const { describe, expect, test } = globalThis as any

import { Color } from "common/const"
import { createGameFromFen } from "bitboard/fen"
import {
    isCheck,
    isCheckmate,
    isStalemate,
    isInsufficientMaterial,
    isDraw,
    isGameOver,
    isKhunAttacked,
} from "bitboard/rules/status"

describe("isKhunAttacked", () => {
    test("should detect when white king is under attack from black rook", () => {
        const { board } = createGameFromFen("4k3/8/8/8/4r3/8/8/4K3 w 1")
        expect(isKhunAttacked(board, Color.WHITE)).toBe(true)
    })

    test("should detect when black king is under attack from white rook", () => {
        const { board } = createGameFromFen("4k3/8/8/8/4R3/8/8/4K3 b 1")
        expect(isKhunAttacked(board, Color.BLACK)).toBe(true)
    })

    test("should return false when king is not under attack", () => {
        const { board } = createGameFromFen("k7/8/8/8/8/8/8/7K w 1")
        expect(isKhunAttacked(board, Color.WHITE)).toBe(false)
        expect(isKhunAttacked(board, Color.BLACK)).toBe(false)
    })

    test("should return false when kings are far apart", () => {
        // Kings far apart - neither is attacked
        const { board } = createGameFromFen("k7/8/8/8/8/8/8/7K w 1")
        expect(isKhunAttacked(board, Color.WHITE)).toBe(false)
        expect(isKhunAttacked(board, Color.BLACK)).toBe(false)
    })
})

describe("isCheck", () => {
    test("should detect check", () => {
        const game = createGameFromFen("4k3/8/8/8/4r3/8/8/4K3 w 1")
        expect(isCheck(game)).toBe(true)
    })

    test("should return false when not in check", () => {
        const game = createGameFromFen("k7/8/8/8/8/8/8/7K w 1")
        expect(isCheck(game)).toBe(false)
    })
})

describe("isCheckmate", () => {
    test("should detect checkmate - back rank mate with two rooks", () => {
        // Black king on a8, White rooks on a7 and b7, White king on a6
        // King is in check and has no escape squares
        const game = createGameFromFen("k7/RR6/K7/8/8/8/8/8 b 1")
        expect(isCheckmate(game)).toBe(true)
    })

    test("should return false when in check but has escape moves", () => {
        const game = createGameFromFen("4k3/8/8/8/4r3/8/8/4K3 w 1")
        const inCheckmate = isCheckmate(game)
        // King should have escape squares
        expect(inCheckmate).toBe(false)
    })

    test("should return false when not in check", () => {
        const game = createGameFromFen("k7/8/8/8/8/8/8/7K w 1")
        expect(isCheckmate(game)).toBe(false)
    })
})

describe("isStalemate", () => {
    test("should detect stalemate - king trapped in corner", () => {
        // White king on h1, black rook on g2, black king on f3
        // White king has no legal moves but is not in check
        const game = createGameFromFen("8/8/8/8/8/5k2/6r1/7K w 1")
        expect(isStalemate(game)).toBe(true)
    })

    test("should return false when has legal moves", () => {
        const game = createGameFromFen("k7/8/8/8/8/8/8/7K w 1")
        expect(isStalemate(game)).toBe(false)
    })

    test("should return false when in check", () => {
        const game = createGameFromFen("4k3/8/8/8/4r3/8/8/4K3 w 1")
        expect(isStalemate(game)).toBe(false)
    })
})

describe("isInsufficientMaterial", () => {
    test("should detect insufficient material with only kings", () => {
        const game = createGameFromFen("k7/8/8/8/8/8/8/7K w 1")
        expect(isInsufficientMaterial(game)).toBe(true)
    })

    test("should detect insufficient material with king + bia", () => {
        const game = createGameFromFen("k7/8/8/8/8/8/B7/7K w 1")
        expect(isInsufficientMaterial(game)).toBe(true)
    })

    test("should detect insufficient material with king + met", () => {
        const game = createGameFromFen("k7/8/8/8/8/8/E7/7K w 1")
        expect(isInsufficientMaterial(game)).toBe(true)
    })

    test("should detect insufficient material with king + ma", () => {
        const game = createGameFromFen("k7/8/8/8/8/8/M7/7K w 1")
        expect(isInsufficientMaterial(game)).toBe(true)
    })

    test("should detect insufficient material with king + white flipped bia", () => {
        const game = createGameFromFen("k7/8/8/8/8/8/F7/7K w 1")
        expect(isInsufficientMaterial(game)).toBe(true)
    })

    test("should detect insufficient material with king + black flipped bia", () => {
        const game = createGameFromFen("k7/8/8/8/8/8/f7/7K w 1")
        expect(isInsufficientMaterial(game)).toBe(true)
    })

    test("should return false when rooks present", () => {
        const game = createGameFromFen("k7/8/8/8/8/8/R7/7K w 1")
        expect(isInsufficientMaterial(game)).toBe(false)
    })

    test("should return false when thons present", () => {
        const game = createGameFromFen("k7/8/8/8/8/8/T7/7K w 1")
        expect(isInsufficientMaterial(game)).toBe(false)
    })

    test("should return false when multiple pieces present", () => {
        const game = createGameFromFen("k7/8/8/8/8/8/BB6/7K w 1")
        expect(isInsufficientMaterial(game)).toBe(false)
    })
})

describe("isDraw", () => {
    test("should detect draw by stalemate", () => {
        const game = createGameFromFen("8/8/8/8/8/5k2/6r1/7K w 1")
        expect(isDraw(game)).toBe(true)
    })

    test("should detect draw by insufficient material", () => {
        const game = createGameFromFen("k7/8/8/8/8/8/8/7K w 1")
        expect(isDraw(game)).toBe(true)
    })

    test("should detect draw by threefold repetition", () => {
        const game = createGameFromFen("k7/8/8/8/8/8/8/7K w 1")
        game.positionOccurrence.set(game.hash, 3)
        expect(isDraw(game)).toBe(true)
    })

    test("should return false when game can continue", () => {
        const game = createGameFromFen("rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1")
        expect(isDraw(game)).toBe(false)
    })
})

describe("isGameOver", () => {
    test("should detect game over by checkmate", () => {
        const game = createGameFromFen("k7/RR6/K7/8/8/8/8/8 b 1")
        expect(isGameOver(game)).toBe(true)
    })

    test("should detect game over by stalemate", () => {
        const game = createGameFromFen("8/8/8/8/8/5k2/6r1/7K w 1")
        expect(isGameOver(game)).toBe(true)
    })

    test("should detect game over by insufficient material", () => {
        const game = createGameFromFen("k7/8/8/8/8/8/8/7K w 1")
        expect(isGameOver(game)).toBe(true)
    })

    test("should return false when game can continue", () => {
        const game = createGameFromFen("k7/8/8/8/8/8/R7/7K w 1")
        expect(isGameOver(game)).toBe(false)
    })
})
