const { describe, expect, test } = globalThis as any

import { Color, Piece } from "common/const"
import { importFenBitboard } from "bitboard/fen"
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
        const { state } = importFenBitboard("4k3/8/8/8/4r3/8/8/4K3 w 1")
        expect(isKhunAttacked(state, Color.WHITE)).toBe(true)
    })

    test("should detect when black king is under attack from white rook", () => {
        const { state } = importFenBitboard("4k3/8/8/8/4R3/8/8/4K3 b 1")
        expect(isKhunAttacked(state, Color.BLACK)).toBe(true)
    })

    test("should return false when king is not under attack", () => {
        const { state } = importFenBitboard("k7/8/8/8/8/8/8/7K w 1")
        expect(isKhunAttacked(state, Color.WHITE)).toBe(false)
        expect(isKhunAttacked(state, Color.BLACK)).toBe(false)
    })

    test("should return false when no king on board", () => {
        // Empty board - no kings
        const { state } = importFenBitboard("8/8/8/8/8/8/8/8 w 1")
        expect(isKhunAttacked(state, Color.WHITE)).toBe(false)
        expect(isKhunAttacked(state, Color.BLACK)).toBe(false)
    })
})

describe("isCheck", () => {
    test("should detect check", () => {
        const { state } = importFenBitboard("4k3/8/8/8/4r3/8/8/4K3 w 1")
        expect(isCheck(state, Color.WHITE)).toBe(true)
    })

    test("should return false when not in check", () => {
        const { state } = importFenBitboard("k7/8/8/8/8/8/8/7K w 1")
        expect(isCheck(state, Color.WHITE)).toBe(false)
    })
})

describe("isCheckmate", () => {
    test("should detect checkmate - back rank mate with two rooks", () => {
        // Black king on a8, White rooks on a7 and b7, White king on a6
        // King is in check and has no escape squares
        const { state } = importFenBitboard("k7/RR6/K7/8/8/8/8/8 b 1")
        expect(isCheckmate(state, Color.BLACK)).toBe(true)
    })

    test("should return false when in check but has escape moves", () => {
        const { state } = importFenBitboard("4k3/8/8/8/4r3/8/8/4K3 w 1")
        const inCheckmate = isCheckmate(state, Color.WHITE)
        // King should have escape squares
        expect(inCheckmate).toBe(false)
    })

    test("should return false when not in check", () => {
        const { state } = importFenBitboard("k7/8/8/8/8/8/8/7K w 1")
        expect(isCheckmate(state, Color.WHITE)).toBe(false)
    })
})

describe("isStalemate", () => {
    test("should detect stalemate - king trapped in corner", () => {
        // White king on h1, black rook on g2, black king on f3
        // White king has no legal moves but is not in check
        const { state } = importFenBitboard("8/8/8/8/8/5k2/6r1/7K w 1")
        expect(isStalemate(state, Color.WHITE)).toBe(true)
    })

    test("should return false when has legal moves", () => {
        const { state } = importFenBitboard("k7/8/8/8/8/8/8/7K w 1")
        expect(isStalemate(state, Color.WHITE)).toBe(false)
    })

    test("should return false when in check", () => {
        const { state } = importFenBitboard("4k3/8/8/8/4r3/8/8/4K3 w 1")
        expect(isStalemate(state, Color.WHITE)).toBe(false)
    })
})

describe("isInsufficientMaterial", () => {
    test("should detect insufficient material with only kings", () => {
        const { state } = importFenBitboard("k7/8/8/8/8/8/8/7K w 1")
        expect(isInsufficientMaterial(state)).toBe(true)
    })

    test("should detect insufficient material with king + bia", () => {
        const { state } = importFenBitboard("k7/8/8/8/8/8/B7/7K w 1")
        expect(isInsufficientMaterial(state)).toBe(true)
    })

    test("should detect insufficient material with king + met", () => {
        const { state } = importFenBitboard("k7/8/8/8/8/8/E7/7K w 1")
        expect(isInsufficientMaterial(state)).toBe(true)
    })

    test("should detect insufficient material with king + ma", () => {
        const { state } = importFenBitboard("k7/8/8/8/8/8/M7/7K w 1")
        expect(isInsufficientMaterial(state)).toBe(true)
    })

    test("should detect insufficient material with king + white flipped bia", () => {
        const { state } = importFenBitboard("k7/8/8/8/8/8/F7/7K w 1")
        expect(isInsufficientMaterial(state)).toBe(true)
    })

    test("should detect insufficient material with king + black flipped bia", () => {
        const { state } = importFenBitboard("k7/8/8/8/8/8/f7/7K w 1")
        expect(isInsufficientMaterial(state)).toBe(true)
    })

    test("should return false when rooks present", () => {
        const { state } = importFenBitboard("k7/8/8/8/8/8/R7/7K w 1")
        expect(isInsufficientMaterial(state)).toBe(false)
    })

    test("should return false when thons present", () => {
        const { state } = importFenBitboard("k7/8/8/8/8/8/T7/7K w 1")
        expect(isInsufficientMaterial(state)).toBe(false)
    })

    test("should return false when multiple pieces present", () => {
        const { state } = importFenBitboard("k7/8/8/8/8/8/BB6/7K w 1")
        expect(isInsufficientMaterial(state)).toBe(false)
    })
})

describe("isDraw", () => {
    test("should detect draw by stalemate", () => {
        const { state } = importFenBitboard("8/8/8/8/8/5k2/6r1/7K w 1")
        expect(isDraw(state, Color.WHITE)).toBe(true)
    })

    test("should detect draw by insufficient material", () => {
        const { state } = importFenBitboard("k7/8/8/8/8/8/8/7K w 1")
        expect(isDraw(state, Color.WHITE)).toBe(true)
    })

    test("should return false when game can continue", () => {
        const { state } = importFenBitboard("rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1")
        expect(isDraw(state, Color.WHITE)).toBe(false)
    })
})

describe("isGameOver", () => {
    test("should detect game over by checkmate", () => {
        const { state } = importFenBitboard("k7/RR6/K7/8/8/8/8/8 b 1")
        expect(isGameOver(state, Color.BLACK)).toBe(true)
    })

    test("should detect game over by stalemate", () => {
        const { state } = importFenBitboard("8/8/8/8/8/5k2/6r1/7K w 1")
        expect(isGameOver(state, Color.WHITE)).toBe(true)
    })

    test("should detect game over by insufficient material", () => {
        const { state } = importFenBitboard("k7/8/8/8/8/8/8/7K w 1")
        expect(isGameOver(state, Color.WHITE)).toBe(true)
    })

    test("should return false when game can continue", () => {
        const { state } = importFenBitboard("k7/8/8/8/8/8/R7/7K w 1")
        expect(isGameOver(state, Color.WHITE)).toBe(false)
    })
})
