const { describe, expect, test } = globalThis as any

import { Color, Piece } from "common/const"
import { createGameFromFen, INITIAL_FEN } from "bitboard/fen"
import { generateLegalMoves, isSquareAttacked } from "bitboard/moves/generation"

describe("isSquareAttacked", () => {
    describe("Bia (pawn) attacks", () => {
        test("white Bia attacks diagonally forward", () => {
            // White pawn on e2 attacks d3 and f3
            const { board } = createGameFromFen("8/8/8/8/8/8/4B3/k6K w 1")
            expect(isSquareAttacked(board, 19, Color.WHITE)).toBe(true) // d3
            expect(isSquareAttacked(board, 21, Color.WHITE)).toBe(true) // f3
        })

        test("white Bia does not attack forward or backward", () => {
            const { board } = createGameFromFen("8/8/8/8/8/8/4B3/k6K w 1")
            expect(isSquareAttacked(board, 20, Color.WHITE)).toBe(false) // e3 (forward)
            expect(isSquareAttacked(board, 4, Color.WHITE)).toBe(false) // e1 (backward)
        })

        test("black Bia attacks diagonally forward (towards rank 1)", () => {
            // Black pawn on e7 attacks d6 and f6
            const { board } = createGameFromFen("k6K/4b3/8/8/8/8/8/8 b 1")
            expect(isSquareAttacked(board, 43, Color.BLACK)).toBe(true) // d6
            expect(isSquareAttacked(board, 45, Color.BLACK)).toBe(true) // f6
        })

        test("black Bia does not attack forward or backward", () => {
            const { board } = createGameFromFen("k6K/4b3/8/8/8/8/8/8 b 1")
            expect(isSquareAttacked(board, 44, Color.BLACK)).toBe(false) // e6 (forward)
            expect(isSquareAttacked(board, 60, Color.BLACK)).toBe(false) // e8 (backward)
        })
    })

    describe("FlippedBia attacks", () => {
        test("white FlippedBia attacks all four diagonals", () => {
            // White FlippedBia on d4
            const { board } = createGameFromFen("k6K/8/8/8/3F4/8/8/8 w 1")
            expect(isSquareAttacked(board, 34, Color.WHITE)).toBe(true) // c5
            expect(isSquareAttacked(board, 36, Color.WHITE)).toBe(true) // e5
            expect(isSquareAttacked(board, 18, Color.WHITE)).toBe(true) // c3
            expect(isSquareAttacked(board, 20, Color.WHITE)).toBe(true) // e3
        })

        test("FlippedBia does not attack orthogonally", () => {
            const { board } = createGameFromFen("k6K/8/8/8/3F4/8/8/8 w 1")
            expect(isSquareAttacked(board, 35, Color.WHITE)).toBe(false) // d5
            expect(isSquareAttacked(board, 19, Color.WHITE)).toBe(false) // d3
            expect(isSquareAttacked(board, 26, Color.WHITE)).toBe(false) // c4
            expect(isSquareAttacked(board, 28, Color.WHITE)).toBe(false) // e4
        })

        test("black FlippedBia attacks all four diagonals", () => {
            const { board } = createGameFromFen("k6K/8/8/3f4/8/8/8/8 b 1")
            expect(isSquareAttacked(board, 42, Color.BLACK)).toBe(true) // c6
            expect(isSquareAttacked(board, 44, Color.BLACK)).toBe(true) // e6
            expect(isSquareAttacked(board, 26, Color.BLACK)).toBe(true) // c4
            expect(isSquareAttacked(board, 28, Color.BLACK)).toBe(true) // e4
        })
    })

    describe("Ma (knight) attacks", () => {
        test("white Ma attacks in L-shape pattern", () => {
            // White knight on d4
            const { board } = createGameFromFen("k6K/8/8/8/3M4/8/8/8 w 1")
            expect(isSquareAttacked(board, 42, Color.WHITE)).toBe(true) // c6
            expect(isSquareAttacked(board, 44, Color.WHITE)).toBe(true) // e6
            expect(isSquareAttacked(board, 37, Color.WHITE)).toBe(true) // f5
            expect(isSquareAttacked(board, 21, Color.WHITE)).toBe(true) // f3
            expect(isSquareAttacked(board, 10, Color.WHITE)).toBe(true) // c2
            expect(isSquareAttacked(board, 12, Color.WHITE)).toBe(true) // e2
            expect(isSquareAttacked(board, 17, Color.WHITE)).toBe(true) // b3
            expect(isSquareAttacked(board, 33, Color.WHITE)).toBe(true) // b5
        })

        test("Ma does not attack adjacent squares", () => {
            const { board } = createGameFromFen("k6K/8/8/8/3M4/8/8/8 w 1")
            expect(isSquareAttacked(board, 35, Color.WHITE)).toBe(false) // d5
            expect(isSquareAttacked(board, 19, Color.WHITE)).toBe(false) // d3
            expect(isSquareAttacked(board, 26, Color.WHITE)).toBe(false) // c4
            expect(isSquareAttacked(board, 28, Color.WHITE)).toBe(false) // e4
        })

        test("knight on corner has limited attacks", () => {
            // White knight on a1
            const { board } = createGameFromFen("k6K/8/8/8/8/8/8/M7 w 1")
            expect(isSquareAttacked(board, 10, Color.WHITE)).toBe(true) // c2
            expect(isSquareAttacked(board, 17, Color.WHITE)).toBe(true) // b3
        })
    })

    describe("Thon attacks (diagonal + forward)", () => {
        test("white Thon attacks all four diagonals", () => {
            // White Thon on d4
            const { board } = createGameFromFen("k6K/8/8/8/3T4/8/8/8 w 1")
            expect(isSquareAttacked(board, 34, Color.WHITE)).toBe(true) // c5
            expect(isSquareAttacked(board, 36, Color.WHITE)).toBe(true) // e5
            expect(isSquareAttacked(board, 18, Color.WHITE)).toBe(true) // c3
            expect(isSquareAttacked(board, 20, Color.WHITE)).toBe(true) // e3
        })

        test("white Thon attacks one square forward", () => {
            const { board } = createGameFromFen("k6K/8/8/8/3T4/8/8/8 w 1")
            expect(isSquareAttacked(board, 35, Color.WHITE)).toBe(true) // d5 (forward)
        })

        test("white Thon does not attack backward or sideways", () => {
            const { board } = createGameFromFen("k6K/8/8/8/3T4/8/8/8 w 1")
            expect(isSquareAttacked(board, 19, Color.WHITE)).toBe(false) // d3 (backward)
            expect(isSquareAttacked(board, 26, Color.WHITE)).toBe(false) // c4 (left)
            expect(isSquareAttacked(board, 28, Color.WHITE)).toBe(false) // e4 (right)
        })

        test("black Thon attacks all four diagonals", () => {
            const { board } = createGameFromFen("k6K/8/8/3t4/8/8/8/8 b 1")
            expect(isSquareAttacked(board, 42, Color.BLACK)).toBe(true) // c6
            expect(isSquareAttacked(board, 44, Color.BLACK)).toBe(true) // e6
            expect(isSquareAttacked(board, 26, Color.BLACK)).toBe(true) // c4
            expect(isSquareAttacked(board, 28, Color.BLACK)).toBe(true) // e4
        })

        test("black Thon attacks one square forward (towards rank 1)", () => {
            const { board } = createGameFromFen("k6K/8/8/3t4/8/8/8/8 b 1")
            expect(isSquareAttacked(board, 27, Color.BLACK)).toBe(true) // d4 (forward for black)
        })

        test("black Thon does not attack backward or sideways", () => {
            const { board } = createGameFromFen("k6K/8/8/3t4/8/8/8/8 b 1")
            expect(isSquareAttacked(board, 43, Color.BLACK)).toBe(false) // d6 (backward for black)
            expect(isSquareAttacked(board, 34, Color.BLACK)).toBe(false) // c5 (left)
            expect(isSquareAttacked(board, 36, Color.BLACK)).toBe(false) // e5 (right)
        })

        test("Thon forward attack on edge of board", () => {
            // White Thon on d8 (square 59) - forward would be off board
            // d8 attacks c7 (square 50) and e7 (square 52) diagonally
            const { board } = createGameFromFen("3T4/8/8/8/8/8/8/k6K w 1")
            expect(isSquareAttacked(board, 50, Color.WHITE)).toBe(true) // c7 diagonal
            expect(isSquareAttacked(board, 52, Color.WHITE)).toBe(true) // e7 diagonal
        })
    })

    describe("Met attacks (diagonal only)", () => {
        test("white Met attacks all four diagonals", () => {
            const { board } = createGameFromFen("k6K/8/8/8/3E4/8/8/8 w 1")
            expect(isSquareAttacked(board, 34, Color.WHITE)).toBe(true) // c5
            expect(isSquareAttacked(board, 36, Color.WHITE)).toBe(true) // e5
            expect(isSquareAttacked(board, 18, Color.WHITE)).toBe(true) // c3
            expect(isSquareAttacked(board, 20, Color.WHITE)).toBe(true) // e3
        })

        test("Met does not attack orthogonally (unlike Thon)", () => {
            const { board } = createGameFromFen("k6K/8/8/8/3E4/8/8/8 w 1")
            expect(isSquareAttacked(board, 35, Color.WHITE)).toBe(false) // d5 (forward)
            expect(isSquareAttacked(board, 19, Color.WHITE)).toBe(false) // d3 (backward)
            expect(isSquareAttacked(board, 26, Color.WHITE)).toBe(false) // c4 (left)
            expect(isSquareAttacked(board, 28, Color.WHITE)).toBe(false) // e4 (right)
        })
    })

    describe("Rua (rook) attacks", () => {
        test("white Rua attacks along ranks and files", () => {
            const { board } = createGameFromFen("k6K/8/8/8/3R4/8/8/8 w 1")
            // Along file (d-file)
            expect(isSquareAttacked(board, 3, Color.WHITE)).toBe(true) // d1
            expect(isSquareAttacked(board, 11, Color.WHITE)).toBe(true) // d2
            expect(isSquareAttacked(board, 35, Color.WHITE)).toBe(true) // d5
            expect(isSquareAttacked(board, 59, Color.WHITE)).toBe(true) // d8
            // Along rank (4th rank)
            expect(isSquareAttacked(board, 24, Color.WHITE)).toBe(true) // a4
            expect(isSquareAttacked(board, 31, Color.WHITE)).toBe(true) // h4
        })

        test("Rua does not attack diagonally", () => {
            const { board } = createGameFromFen("k6K/8/8/8/3R4/8/8/8 w 1")
            expect(isSquareAttacked(board, 34, Color.WHITE)).toBe(false) // c5
            expect(isSquareAttacked(board, 36, Color.WHITE)).toBe(false) // e5
            expect(isSquareAttacked(board, 18, Color.WHITE)).toBe(false) // c3
            expect(isSquareAttacked(board, 20, Color.WHITE)).toBe(false) // e3
        })

        test("Rua is blocked by pieces", () => {
            // White Rua on d1, white pawn on d4 blocks attacks beyond
            const { board } = createGameFromFen("k6K/8/8/8/3B4/8/8/3R4 w 1")
            expect(isSquareAttacked(board, 11, Color.WHITE)).toBe(true) // d2
            expect(isSquareAttacked(board, 19, Color.WHITE)).toBe(true) // d3
            expect(isSquareAttacked(board, 27, Color.WHITE)).toBe(true) // d4 (pawn square)
            expect(isSquareAttacked(board, 35, Color.WHITE)).toBe(false) // d5 (blocked)
        })
    })

    describe("Khun (king) attacks", () => {
        test("white Khun attacks all 8 adjacent squares", () => {
            const { board } = createGameFromFen("k7/8/8/8/3K4/8/8/8 w 1")
            expect(isSquareAttacked(board, 34, Color.WHITE)).toBe(true) // c5
            expect(isSquareAttacked(board, 35, Color.WHITE)).toBe(true) // d5
            expect(isSquareAttacked(board, 36, Color.WHITE)).toBe(true) // e5
            expect(isSquareAttacked(board, 26, Color.WHITE)).toBe(true) // c4
            expect(isSquareAttacked(board, 28, Color.WHITE)).toBe(true) // e4
            expect(isSquareAttacked(board, 18, Color.WHITE)).toBe(true) // c3
            expect(isSquareAttacked(board, 19, Color.WHITE)).toBe(true) // d3
            expect(isSquareAttacked(board, 20, Color.WHITE)).toBe(true) // e3
        })

        test("Khun does not attack two squares away", () => {
            const { board } = createGameFromFen("k7/8/8/8/3K4/8/8/8 w 1")
            expect(isSquareAttacked(board, 43, Color.WHITE)).toBe(false) // d6
            expect(isSquareAttacked(board, 11, Color.WHITE)).toBe(false) // d2
        })

        test("Khun on corner attacks only 3 squares", () => {
            const { board } = createGameFromFen("K7/8/8/8/8/8/8/k7 w 1")
            expect(isSquareAttacked(board, 49, Color.WHITE)).toBe(true) // b7
            expect(isSquareAttacked(board, 48, Color.WHITE)).toBe(true) // a7
            expect(isSquareAttacked(board, 57, Color.WHITE)).toBe(true) // b8
        })
    })
})

describe("generateLegalMoves", () => {
    describe("initial position", () => {
        test("should generate 23 moves from initial position", () => {
            const { board: state, turn } = createGameFromFen(INITIAL_FEN)
            const moves = generateLegalMoves(state, turn)
            expect(moves.length).toBe(23)
        })

        test("should generate correct pawn moves (8 pawns)", () => {
            const { board: state, turn } = createGameFromFen(INITIAL_FEN)
            const moves = generateLegalMoves(state, turn)
            const pawnMoves = moves.filter(m => m.piece === Piece.BIA)
            expect(pawnMoves.length).toBe(8)
        })

        test("should generate correct rook moves (2 rooks, 1 move each)", () => {
            const { board: state, turn } = createGameFromFen(INITIAL_FEN)
            const moves = generateLegalMoves(state, turn)
            const rookMoves = moves.filter(m => m.piece === Piece.RUA)
            expect(rookMoves.length).toBe(2)
        })

        test("should generate correct knight moves (2 knights, 1 move each)", () => {
            const { board: state, turn } = createGameFromFen(INITIAL_FEN)
            const moves = generateLegalMoves(state, turn)
            const knightMoves = moves.filter(m => m.piece === Piece.MA)
            expect(knightMoves.length).toBe(2)
        })

        test("should generate correct thon moves (2 thons, 3 moves each)", () => {
            const { board: state, turn } = createGameFromFen(INITIAL_FEN)
            const moves = generateLegalMoves(state, turn)
            const thonMoves = moves.filter(m => m.piece === Piece.THON)
            expect(thonMoves.length).toBe(6)
        })

        test("should include correct color in all moves", () => {
            const { board: state, turn } = createGameFromFen(INITIAL_FEN)
            const moves = generateLegalMoves(state, turn)
            moves.forEach(move => {
                expect(move.color).toBe(Color.WHITE)
            })
        })

        test("black has same number of moves as white", () => {
            const { board: state } = createGameFromFen(INITIAL_FEN)
            const blackMoves = generateLegalMoves(state, Color.BLACK)
            expect(blackMoves.length).toBe(23)
            blackMoves.forEach(move => {
                expect(move.color).toBe(Color.BLACK)
            })
        })
    })

    describe("pawn promotion", () => {
        test("white pawn promotes on rank 6", () => {
            const { board: state } = createGameFromFen("k7/8/8/B7/8/8/8/K7 w 1")
            const moves = generateLegalMoves(state, Color.WHITE)
            const promotionMoves = moves.filter(m => m.promotion === Piece.FLIPPED_BIA)
            expect(promotionMoves.length).toBeGreaterThan(0)
            expect(promotionMoves[0].piece).toBe(Piece.BIA)
        })

        test("white pawn capture with promotion", () => {
            const { board: state } = createGameFromFen("k7/8/1b6/B7/8/8/8/K7 w 1")
            const moves = generateLegalMoves(state, Color.WHITE)
            const capturePromotions = moves.filter(m =>
                m.piece === Piece.BIA && m.captured && m.promotion === Piece.FLIPPED_BIA
            )
            expect(capturePromotions.length).toBeGreaterThan(0)
        })

        test("black pawn promotes on rank 3", () => {
            const { board: state } = createGameFromFen("k7/8/8/8/b7/8/8/K7 b 1")
            const moves = generateLegalMoves(state, Color.BLACK)
            const promotionMoves = moves.filter(m => m.promotion === Piece.FLIPPED_BIA)
            expect(promotionMoves.length).toBeGreaterThan(0)
        })

        test("black pawn capture with promotion", () => {
            const { board: state } = createGameFromFen("k7/8/8/8/b7/1B6/8/K7 b 1")
            const moves = generateLegalMoves(state, Color.BLACK)
            const capturePromotions = moves.filter(m =>
                m.piece === Piece.BIA && m.captured && m.promotion === Piece.FLIPPED_BIA
            )
            expect(capturePromotions.length).toBeGreaterThan(0)
        })

        test("pawn capture without promotion (not on promotion rank)", () => {
            const { board: state } = createGameFromFen("k7/8/8/8/1b6/B7/8/K7 w 1")
            const moves = generateLegalMoves(state, Color.WHITE)
            const captureWithoutPromotion = moves.filter(m =>
                m.piece === Piece.BIA && m.captured && !m.promotion
            )
            expect(captureWithoutPromotion.length).toBeGreaterThan(0)
        })
    })

    describe("FlippedBia moves", () => {
        test("FlippedBia moves diagonally (4 squares)", () => {
            const { board: state } = createGameFromFen("k7/8/8/8/3F4/8/8/K7 w 1")
            const moves = generateLegalMoves(state, Color.WHITE)
            const flippedBiaMoves = moves.filter(m => m.piece === Piece.FLIPPED_BIA)
            expect(flippedBiaMoves.length).toBe(4)
        })

        test("FlippedBia can capture", () => {
            const { board: state } = createGameFromFen("k7/8/8/8/3F4/2b5/8/K7 w 1")
            const moves = generateLegalMoves(state, Color.WHITE)
            const captureMoves = moves.filter(m =>
                m.piece === Piece.FLIPPED_BIA && m.captured
            )
            expect(captureMoves.length).toBeGreaterThan(0)
        })
    })

    describe("king cannot move into check", () => {
        test("king cannot move into Bia attack", () => {
            // Black pawn on e5 (square 36) attacks d4 (square 27) and f4 (square 29)
            // White king on c4 (square 26) should not be able to move to d4
            const { board: state } = createGameFromFen("k7/8/8/4b3/2K5/8/8/8 w 1")
            const moves = generateLegalMoves(state, Color.WHITE)
            const kingToD4 = moves.find(m => m.piece === Piece.KHUN && m.to === 27)
            expect(kingToD4).toBeUndefined()
        })

        test("king cannot move into Ma attack", () => {
            // Black knight on e5 (square 36) attacks: c4(26), c6(42), d3(19), d7(51), f3(21), f7(53), g4(30), g6(46)
            // White king on b5 (square 33) should not be able to move to c4 (square 26)
            const { board: state } = createGameFromFen("k7/8/8/1K2m3/8/8/8/8 w 1")
            const moves = generateLegalMoves(state, Color.WHITE)
            const kingToC4 = moves.find(m => m.piece === Piece.KHUN && m.to === 26)
            expect(kingToC4).toBeUndefined()
        })

        test("king cannot move into Thon diagonal attack", () => {
            // Black Thon on e5 (square 36) attacks diagonals d6(43), f6(45), d4(27), f4(29) and forward e4(28)
            // White king on c4 (square 26) should not be able to move to d4 (square 27)
            const { board: state } = createGameFromFen("k7/8/8/4t3/2K5/8/8/8 w 1")
            const moves = generateLegalMoves(state, Color.WHITE)
            const kingToD4 = moves.find(m => m.piece === Piece.KHUN && m.to === 27)
            expect(kingToD4).toBeUndefined()
        })

        test("king cannot move into Thon forward attack (white Thon)", () => {
            const { board: state } = createGameFromFen("8/8/8/8/3k4/4T3/8/K7 b 1")
            const moves = generateLegalMoves(state, Color.BLACK)
            const kingMoveToE4 = moves.find(m => m.piece === Piece.KHUN && m.to === 28)
            expect(kingMoveToE4).toBeUndefined()
        })

        test("king cannot move into Thon forward attack (black Thon)", () => {
            const { board: state } = createGameFromFen("7k/8/4t3/3K4/8/8/8/8 w 1")
            const moves = generateLegalMoves(state, Color.WHITE)
            const kingMoveToE5 = moves.find(m => m.piece === Piece.KHUN && m.to === 36)
            expect(kingMoveToE5).toBeUndefined()
        })

        test("king cannot move into Met attack", () => {
            // Black Met on e5 (square 36) attacks diagonals only: d6(43), f6(45), d4(27), f4(29)
            // White king on c4 (square 26) should not be able to move to d4 (square 27)
            const { board: state } = createGameFromFen("k7/8/8/4e3/2K5/8/8/8 w 1")
            const moves = generateLegalMoves(state, Color.WHITE)
            const kingToD4 = moves.find(m => m.piece === Piece.KHUN && m.to === 27)
            expect(kingToD4).toBeUndefined()
        })

        test("king cannot move into Rua attack", () => {
            const { board: state } = createGameFromFen("k7/8/8/4r3/3K4/8/8/8 w 1")
            const moves = generateLegalMoves(state, Color.WHITE)
            const kingToE4 = moves.find(m => m.piece === Piece.KHUN && m.to === 28)
            const kingToD5 = moves.find(m => m.piece === Piece.KHUN && m.to === 35)
            expect(kingToE4).toBeUndefined()
            expect(kingToD5).toBeUndefined()
        })

        test("king cannot move next to enemy king", () => {
            // White king on c4 (square 26), black king on e5 (square 36)
            // Black king attacks: d4, d5, d6, e4, e6, f4, f5, f6
            // White king should not be able to move to d4 or d5 (both attacked by black king)
            const { board: state } = createGameFromFen("8/8/8/4k3/2K5/8/8/8 w 1")
            const moves = generateLegalMoves(state, Color.WHITE)
            const kingToD4 = moves.find(m => m.piece === Piece.KHUN && m.to === 27)
            const kingToD5 = moves.find(m => m.piece === Piece.KHUN && m.to === 35)
            expect(kingToD4).toBeUndefined()
            expect(kingToD5).toBeUndefined()
        })
    })

    describe("check detection", () => {
        test("detect check from Rua", () => {
            const { board: state } = createGameFromFen("4k3/8/8/8/4r3/8/8/4K3 w 1")
            const moves = generateLegalMoves(state, Color.WHITE)
            expect(moves.length).toBeGreaterThan(0)
            // King must escape, cannot stay in check
        })

        test("detect check from Thon forward attack", () => {
            const { board: state } = createGameFromFen("8/8/8/8/4k3/4T3/8/K7 b 1")
            const moves = generateLegalMoves(state, Color.BLACK)
            const kingMoves = moves.filter(m => m.piece === Piece.KHUN)
            const kingStaysOnE4 = kingMoves.find(m => m.to === 28)
            expect(kingStaysOnE4).toBeUndefined()
            expect(kingMoves.length).toBeGreaterThan(0)
        })

        test("king can capture piece giving check", () => {
            const { board: state } = createGameFromFen("8/8/8/8/4k3/4T3/8/K7 b 1")
            const moves = generateLegalMoves(state, Color.BLACK)
            const kingCapturesThon = moves.find(m =>
                m.piece === Piece.KHUN && m.to === 20 && m.captured === Piece.THON
            )
            expect(kingCapturesThon).toBeDefined()
        })
    })

    describe("pinned pieces", () => {
        test("piece pinned to king cannot move away from pin line", () => {
            // White rook on d4 pins black Met on d5 to black king on d8
            const { board: state } = createGameFromFen("3k4/8/8/3e4/3R4/8/8/K7 b 1")
            const moves = generateLegalMoves(state, Color.BLACK)
            // Met on d5 cannot move diagonally because it would expose king
            const metMoves = moves.filter(m => m.piece === Piece.MET)
            expect(metMoves.length).toBe(0)
        })
    })

    describe("move properties", () => {
        test("all moves have valid from and to squares", () => {
            const { board: state, turn } = createGameFromFen(INITIAL_FEN)
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

        test("only king moves for minimal board", () => {
            const { board: state, turn } = createGameFromFen("4k3/8/8/8/8/8/8/4K3 w 1")
            const moves = generateLegalMoves(state, turn)
            expect(moves.length).toBe(5)
        })
    })
})
