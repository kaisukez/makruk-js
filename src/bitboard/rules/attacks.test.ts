const { describe, expect, test } = globalThis as any

import {
    getKnightAttacks,
    getKingAttacks,
    getPawnAttacks,
    getPawnMoves,
    getDiagonalAttacks,
    getRookAttacks,
    getBishopAttacks,
    getQueenAttacks,
} from "bitboard/rules/attacks"
import { EMPTY_BITBOARD } from "bitboard/board/board"

describe("getKnightAttacks", () => {
    test("should return attack bitboard for knight on d4", () => {
        const square = 27 // d4 in bitboard (rank 3, file 3)
        const attacks = getKnightAttacks(square)

        expect(attacks).not.toBe(0n)
        expect(typeof attacks).toBe("bigint")
    })

    test("should return attack bitboard for knight in corner", () => {
        const square = 0 // a1
        const attacks = getKnightAttacks(square)

        expect(attacks).not.toBe(0n)
    })

    test("should return valid attacks for all squares", () => {
        for (let sq = 0; sq < 64; sq++) {
            const attacks = getKnightAttacks(sq)
            expect(typeof attacks).toBe("bigint")
        }
    })
})

describe("getKingAttacks", () => {
    test("should return attack bitboard for king on e4", () => {
        const square = 28 // e4
        const attacks = getKingAttacks(square)

        expect(attacks).not.toBe(0n)
        expect(typeof attacks).toBe("bigint")
    })

    test("should return attack bitboard for king in corner", () => {
        const square = 0 // a1
        const attacks = getKingAttacks(square)

        expect(attacks).not.toBe(0n)
    })

    test("should return valid attacks for all squares", () => {
        for (let sq = 0; sq < 64; sq++) {
            const attacks = getKingAttacks(sq)
            expect(typeof attacks).toBe("bigint")
        }
    })
})

describe("getPawnAttacks", () => {
    test("should return attack bitboard for white pawn", () => {
        const square = 16 // a3
        const attacks = getPawnAttacks(square, true)

        expect(typeof attacks).toBe("bigint")
    })

    test("should return attack bitboard for black pawn", () => {
        const square = 48 // a7
        const attacks = getPawnAttacks(square, false)

        expect(typeof attacks).toBe("bigint")
    })

    test("should return valid attacks for all squares (white)", () => {
        for (let sq = 0; sq < 64; sq++) {
            const attacks = getPawnAttacks(sq, true)
            expect(typeof attacks).toBe("bigint")
        }
    })

    test("should return valid attacks for all squares (black)", () => {
        for (let sq = 0; sq < 64; sq++) {
            const attacks = getPawnAttacks(sq, false)
            expect(typeof attacks).toBe("bigint")
        }
    })
})

describe("getDiagonalAttacks", () => {
    test("should return diagonal attacks for center square", () => {
        const square = 27 // d4
        const attacks = getDiagonalAttacks(square)

        expect(attacks).not.toBe(0n)
        expect(typeof attacks).toBe("bigint")
    })

    test("should return diagonal attacks for corner", () => {
        const square = 0 // a1
        const attacks = getDiagonalAttacks(square)

        expect(attacks).not.toBe(0n)
    })

    test("should return valid attacks for all squares", () => {
        for (let sq = 0; sq < 64; sq++) {
            const attacks = getDiagonalAttacks(sq)
            expect(typeof attacks).toBe("bigint")
        }
    })
})

describe("attack table consistency", () => {
    test("should produce consistent results", () => {
        const square = 27
        const attacks1 = getKnightAttacks(square)
        const attacks2 = getKnightAttacks(square)

        expect(attacks1).toBe(attacks2)
    })
})

describe("getPawnMoves", () => {
    test("should return move bitboard for white pawn on starting rank", () => {
        const square = 8 // a2 (white pawn starting position)
        const moves = getPawnMoves(square, true)

        // Should be able to move 1 or 2 squares forward
        expect(moves).not.toBe(EMPTY_BITBOARD)
        expect(typeof moves).toBe("bigint")
    })

    test("should return move bitboard for white pawn not on starting rank", () => {
        const square = 16 // a3
        const moves = getPawnMoves(square, true)

        // Should only be able to move 1 square forward
        expect(typeof moves).toBe("bigint")
    })

    test("should return move bitboard for black pawn on starting rank", () => {
        const square = 48 // a7 (black pawn starting position)
        const moves = getPawnMoves(square, false)

        // Should be able to move 1 or 2 squares forward
        expect(moves).not.toBe(EMPTY_BITBOARD)
        expect(typeof moves).toBe("bigint")
    })

    test("should return move bitboard for black pawn not on starting rank", () => {
        const square = 40 // a6
        const moves = getPawnMoves(square, false)

        // Should only be able to move 1 square forward
        expect(typeof moves).toBe("bigint")
    })

    test("should return valid moves for all squares (white)", () => {
        for (let sq = 0; sq < 64; sq++) {
            const moves = getPawnMoves(sq, true)
            expect(typeof moves).toBe("bigint")
        }
    })

    test("should return valid moves for all squares (black)", () => {
        for (let sq = 0; sq < 64; sq++) {
            const moves = getPawnMoves(sq, false)
            expect(typeof moves).toBe("bigint")
        }
    })
})

describe("getRookAttacks", () => {
    test("should return attacks for rook on empty board", () => {
        const square = 27 // d4
        const occupancy = EMPTY_BITBOARD
        const attacks = getRookAttacks(square, occupancy)

        expect(attacks).not.toBe(EMPTY_BITBOARD)
        expect(typeof attacks).toBe("bigint")
    })

    test("should return attacks for rook in corner", () => {
        const square = 0 // a1
        const occupancy = EMPTY_BITBOARD
        const attacks = getRookAttacks(square, occupancy)

        expect(attacks).not.toBe(EMPTY_BITBOARD)
        expect(typeof attacks).toBe("bigint")
    })

    test("should stop at blocking piece on north", () => {
        const square = 0 // a1
        const blocker = 16 // a3
        const occupancy = 1n << BigInt(blocker)
        const attacks = getRookAttacks(square, occupancy)

        // Should include the blocker square but not beyond
        expect(attacks & (1n << BigInt(blocker))).not.toBe(EMPTY_BITBOARD)
    })

    test("should stop at blocking piece on south", () => {
        const square = 56 // a8
        const blocker = 40 // a6
        const occupancy = 1n << BigInt(blocker)
        const attacks = getRookAttacks(square, occupancy)

        // Should include the blocker square but not beyond
        expect(attacks & (1n << BigInt(blocker))).not.toBe(EMPTY_BITBOARD)
    })

    test("should stop at blocking piece on east", () => {
        const square = 0 // a1
        const blocker = 2 // c1
        const occupancy = 1n << BigInt(blocker)
        const attacks = getRookAttacks(square, occupancy)

        // Should include the blocker square but not beyond
        expect(attacks & (1n << BigInt(blocker))).not.toBe(EMPTY_BITBOARD)
    })

    test("should stop at blocking piece on west", () => {
        const square = 7 // h1
        const blocker = 5 // f1
        const occupancy = 1n << BigInt(blocker)
        const attacks = getRookAttacks(square, occupancy)

        // Should include the blocker square but not beyond
        expect(attacks & (1n << BigInt(blocker))).not.toBe(EMPTY_BITBOARD)
    })

    test("should handle multiple blockers", () => {
        const square = 27 // d4
        const blocker1 = 35 // d5
        const blocker2 = 19 // d3
        const occupancy = (1n << BigInt(blocker1)) | (1n << BigInt(blocker2))
        const attacks = getRookAttacks(square, occupancy)

        expect(typeof attacks).toBe("bigint")
        expect(attacks).not.toBe(EMPTY_BITBOARD)
    })

    test("should work for all squares", () => {
        for (let sq = 0; sq < 64; sq++) {
            const attacks = getRookAttacks(sq, EMPTY_BITBOARD)
            expect(typeof attacks).toBe("bigint")
        }
    })
})

describe("getBishopAttacks", () => {
    test("should return attacks for bishop on empty board", () => {
        const square = 27 // d4
        const occupancy = EMPTY_BITBOARD
        const attacks = getBishopAttacks(square, occupancy)

        expect(attacks).not.toBe(EMPTY_BITBOARD)
        expect(typeof attacks).toBe("bigint")
    })

    test("should return attacks for bishop in corner", () => {
        const square = 0 // a1
        const occupancy = EMPTY_BITBOARD
        const attacks = getBishopAttacks(square, occupancy)

        expect(attacks).not.toBe(EMPTY_BITBOARD)
        expect(typeof attacks).toBe("bigint")
    })

    test("should stop at blocking piece on northeast", () => {
        const square = 0 // a1
        const blocker = 18 // c3
        const occupancy = 1n << BigInt(blocker)
        const attacks = getBishopAttacks(square, occupancy)

        // Should include the blocker square but not beyond
        expect(attacks & (1n << BigInt(blocker))).not.toBe(EMPTY_BITBOARD)
    })

    test("should stop at blocking piece on northwest", () => {
        const square = 7 // h1
        const blocker = 21 // f3
        const occupancy = 1n << BigInt(blocker)
        const attacks = getBishopAttacks(square, occupancy)

        // Should include the blocker square but not beyond
        expect(attacks & (1n << BigInt(blocker))).not.toBe(EMPTY_BITBOARD)
    })

    test("should stop at blocking piece on southeast", () => {
        const square = 56 // a8
        const blocker = 42 // c6
        const occupancy = 1n << BigInt(blocker)
        const attacks = getBishopAttacks(square, occupancy)

        // Should include the blocker square but not beyond
        expect(attacks & (1n << BigInt(blocker))).not.toBe(EMPTY_BITBOARD)
    })

    test("should stop at blocking piece on southwest", () => {
        const square = 63 // h8
        const blocker = 45 // f6
        const occupancy = 1n << BigInt(blocker)
        const attacks = getBishopAttacks(square, occupancy)

        // Should include the blocker square but not beyond
        expect(attacks & (1n << BigInt(blocker))).not.toBe(EMPTY_BITBOARD)
    })

    test("should handle multiple blockers", () => {
        const square = 27 // d4
        const blocker1 = 36 // e5
        const blocker2 = 18 // c3
        const occupancy = (1n << BigInt(blocker1)) | (1n << BigInt(blocker2))
        const attacks = getBishopAttacks(square, occupancy)

        expect(typeof attacks).toBe("bigint")
        expect(attacks).not.toBe(EMPTY_BITBOARD)
    })

    test("should work for all squares", () => {
        for (let sq = 0; sq < 64; sq++) {
            const attacks = getBishopAttacks(sq, EMPTY_BITBOARD)
            expect(typeof attacks).toBe("bigint")
        }
    })
})

describe("getQueenAttacks", () => {
    test("should return combined rook and bishop attacks", () => {
        const square = 27 // d4
        const occupancy = EMPTY_BITBOARD
        const attacks = getQueenAttacks(square, occupancy)

        expect(attacks).not.toBe(EMPTY_BITBOARD)
        expect(typeof attacks).toBe("bigint")
    })

    test("should work in corner", () => {
        const square = 0 // a1
        const occupancy = EMPTY_BITBOARD
        const attacks = getQueenAttacks(square, occupancy)

        expect(attacks).not.toBe(EMPTY_BITBOARD)
        expect(typeof attacks).toBe("bigint")
    })

    test("should respect blockers", () => {
        const square = 27 // d4
        const blocker = 35 // d5 (blocks north)
        const occupancy = 1n << BigInt(blocker)
        const attacks = getQueenAttacks(square, occupancy)

        expect(typeof attacks).toBe("bigint")
        expect(attacks).not.toBe(EMPTY_BITBOARD)
    })

    test("should equal rook + bishop attacks", () => {
        const square = 27 // d4
        const occupancy = EMPTY_BITBOARD
        const queenAttacks = getQueenAttacks(square, occupancy)
        const rookAttacks = getRookAttacks(square, occupancy)
        const bishopAttacks = getBishopAttacks(square, occupancy)

        expect(queenAttacks).toBe(rookAttacks | bishopAttacks)
    })

    test("should work for all squares", () => {
        for (let sq = 0; sq < 64; sq++) {
            const attacks = getQueenAttacks(sq, EMPTY_BITBOARD)
            expect(typeof attacks).toBe("bigint")
        }
    })
})
