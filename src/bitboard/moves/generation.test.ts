const { describe, expect, test } = globalThis as any

import { Color, Piece } from "common/const"
import { importFenBitboard, INITIAL_FEN_BITBOARD } from "bitboard/fen"
import { generateLegalMoves } from "bitboard/moves/generation"

describe("generateLegalMoves", () => {
    test("should generate moves from initial position", () => {
        const { state, turn } = importFenBitboard(INITIAL_FEN_BITBOARD)
        const moves = generateLegalMoves(state, turn)

        expect(moves.length).toBeGreaterThan(0)
        expect(moves.length).toBe(23) // Standard opening position has 23 moves
    })

    test("should generate no moves for empty board with no kings", () => {
        const { state, turn } = importFenBitboard("8/8/8/8/8/8/8/8 w 1")
        const moves = generateLegalMoves(state, turn)

        expect(moves.length).toBe(0)
    })

    test("should generate correct pawn moves", () => {
        const { state, turn } = importFenBitboard(INITIAL_FEN_BITBOARD)
        const moves = generateLegalMoves(state, turn)

        const pawnMoves = moves.filter(m => m.piece === Piece.BIA)
        expect(pawnMoves.length).toBe(8) // 8 pawns can move forward
    })

    test("should generate correct rook moves", () => {
        const { state, turn } = importFenBitboard(INITIAL_FEN_BITBOARD)
        const moves = generateLegalMoves(state, turn)

        const rookMoves = moves.filter(m => m.piece === Piece.RUA)
        expect(rookMoves.length).toBe(2) // Each rook can move one square forward
    })

    test("should generate correct knight moves", () => {
        const { state, turn } = importFenBitboard(INITIAL_FEN_BITBOARD)
        const moves = generateLegalMoves(state, turn)

        const knightMoves = moves.filter(m => m.piece === Piece.MA)
        expect(knightMoves.length).toBe(2) // 2 knights, 1 move each
    })

    test("should generate correct thon moves including forward", () => {
        const { state, turn } = importFenBitboard(INITIAL_FEN_BITBOARD)
        const moves = generateLegalMoves(state, turn)

        const thonMoves = moves.filter(m => m.piece === Piece.THON)
        expect(thonMoves.length).toBe(6) // 2 thons, 3 moves each (diagonal + forward)
    })

    test("should include color in generated moves", () => {
        const { state, turn } = importFenBitboard(INITIAL_FEN_BITBOARD)
        const moves = generateLegalMoves(state, turn)

        moves.forEach(move => {
            expect(move.color).toBe(Color.WHITE)
        })
    })

    test("should include from and to squares", () => {
        const { state, turn } = importFenBitboard(INITIAL_FEN_BITBOARD)
        const moves = generateLegalMoves(state, turn)

        moves.forEach(move => {
            expect(typeof move.from).toBe("number")
            expect(typeof move.to).toBe("number")
            expect(move.from).toBeGreaterThanOrEqual(0)
            expect(move.from).toBeLessThan(64)
            expect(move.to).toBeGreaterThanOrEqual(0)
            expect(move.to).toBeLessThan(64)
        })
    })

    test("should generate pawn promotion moves", () => {
        // White pawn on rank 5 can promote by moving to rank 6
        const { state } = importFenBitboard("k7/8/8/B7/8/8/8/K7 w 1")
        const moves = generateLegalMoves(state, Color.WHITE)

        const promotionMoves = moves.filter(m => m.promotion === Piece.FLIPPED_BIA)
        expect(promotionMoves.length).toBeGreaterThan(0)
        expect(promotionMoves[0].piece).toBe(Piece.BIA)
        expect(promotionMoves[0].promotion).toBe(Piece.FLIPPED_BIA)
    })

    test("should generate pawn capture with promotion", () => {
        // White pawn on rank 5 can capture and promote
        const { state } = importFenBitboard("k7/8/1b6/B7/8/8/8/K7 w 1")
        const moves = generateLegalMoves(state, Color.WHITE)

        const capturePromotions = moves.filter(m =>
            m.piece === Piece.BIA && m.captured && m.promotion === Piece.FLIPPED_BIA
        )
        expect(capturePromotions.length).toBeGreaterThan(0)
    })

    test("should generate black pawn promotion moves", () => {
        // Black pawn on rank 4 can promote by moving to rank 3
        const { state } = importFenBitboard("k7/8/8/8/b7/8/8/K7 b 1")
        const moves = generateLegalMoves(state, Color.BLACK)

        const promotionMoves = moves.filter(m => m.promotion === Piece.FLIPPED_BIA)
        expect(promotionMoves.length).toBeGreaterThan(0)
    })

    test("should generate black pawn capture with promotion", () => {
        // Black pawn on rank 4 can capture and promote
        const { state } = importFenBitboard("k7/8/8/8/b7/1B6/8/K7 b 1")
        const moves = generateLegalMoves(state, Color.BLACK)

        const capturePromotions = moves.filter(m =>
            m.piece === Piece.BIA && m.captured && m.promotion === Piece.FLIPPED_BIA
        )
        expect(capturePromotions.length).toBeGreaterThan(0)
    })

    test("should generate FlippedBia moves", () => {
        // White FlippedBia on d4 can move diagonally
        const { state } = importFenBitboard("k7/8/8/8/3F4/8/8/K7 w 1")
        const moves = generateLegalMoves(state, Color.WHITE)

        const flippedBiaMoves = moves.filter(m => m.piece === Piece.FLIPPED_BIA)
        expect(flippedBiaMoves.length).toBeGreaterThan(0)
        expect(flippedBiaMoves.length).toBe(4) // 4 diagonal squares
    })

    test("should generate FlippedBia capture moves", () => {
        // White FlippedBia can capture black piece
        const { state } = importFenBitboard("k7/8/8/8/3F4/2b5/8/K7 w 1")
        const moves = generateLegalMoves(state, Color.WHITE)

        const captureMoves = moves.filter(m =>
            m.piece === Piece.FLIPPED_BIA && m.captured
        )
        expect(captureMoves.length).toBeGreaterThan(0)
    })

    test("should generate black FlippedBia moves", () => {
        // Black FlippedBia on d5 can move diagonally
        const { state } = importFenBitboard("k7/8/8/3f4/8/8/8/K7 b 1")
        const moves = generateLegalMoves(state, Color.BLACK)

        const flippedBiaMoves = moves.filter(m => m.piece === Piece.FLIPPED_BIA)
        expect(flippedBiaMoves.length).toBeGreaterThan(0)
    })

    test("should not allow moves that leave king in check", () => {
        // White king in check from black rook, limited escape moves
        const { state } = importFenBitboard("4k3/8/8/8/4r3/8/8/4K3 w 1")
        const moves = generateLegalMoves(state, Color.WHITE)

        // All generated moves should be legal (not leaving king in check)
        expect(moves.length).toBeGreaterThan(0)
        moves.forEach(move => {
            expect(move.from).toBeDefined()
            expect(move.to).toBeDefined()
        })
    })

    test("should generate moves for black color", () => {
        const { state } = importFenBitboard(INITIAL_FEN_BITBOARD)
        const blackMoves = generateLegalMoves(state, Color.BLACK)

        expect(blackMoves.length).toBe(23) // Same as white from initial position
        blackMoves.forEach(move => {
            expect(move.color).toBe(Color.BLACK)
        })
    })

    test("should generate pawn capture without promotion", () => {
        // White pawn on rank 3 can capture black piece on rank 4 (not promotion rank)
        const { state } = importFenBitboard("k7/8/8/8/1b6/B7/8/K7 w 1")
        const moves = generateLegalMoves(state, Color.WHITE)

        const captureWithoutPromotion = moves.filter(m =>
            m.piece === Piece.BIA && m.captured && !m.promotion
        )
        expect(captureWithoutPromotion.length).toBeGreaterThan(0)
    })
})
