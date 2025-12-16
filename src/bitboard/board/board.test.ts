const { describe, expect, test } = globalThis as any

import { Color, Piece, SquareIndex } from "common/const"
import {
    createEmptyBitboardState,
    setPiece,
    getPieceAt,
    removePiece,
    EMPTY_BITBOARD,
    squareIndexToBitboardSquare,
    bitboardSquareToSquareIndex,
    setBit,
    clearBit,
    getBit,
    popCount,
    getLSB,
    popLSB,
    getMSB,
    shiftNorth,
    shiftSouth,
    shiftEast,
    shiftWest,
    shiftNorthEast,
    shiftNorthWest,
    shiftSouthEast,
    shiftSouthWest,
    updateOccupancy,
    getPieceBitboard,
    printBitboard,
} from "bitboard/board/board"

describe("createEmptyBitboardState", () => {
    test("should create an empty bitboard state", () => {
        const state = createEmptyBitboardState()

        expect(state.whiteBia).toBe(EMPTY_BITBOARD)
        expect(state.blackBia).toBe(EMPTY_BITBOARD)
        expect(state.whiteRua).toBe(EMPTY_BITBOARD)
        expect(state.blackRua).toBe(EMPTY_BITBOARD)
        expect(state.whiteMa).toBe(EMPTY_BITBOARD)
        expect(state.blackMa).toBe(EMPTY_BITBOARD)
        expect(state.whiteThon).toBe(EMPTY_BITBOARD)
        expect(state.blackThon).toBe(EMPTY_BITBOARD)
        expect(state.whiteMet).toBe(EMPTY_BITBOARD)
        expect(state.blackMet).toBe(EMPTY_BITBOARD)
        expect(state.whiteKhun).toBe(EMPTY_BITBOARD)
        expect(state.blackKhun).toBe(EMPTY_BITBOARD)
    })
})

describe("setPiece", () => {
    test("should set a white rook on square 0", () => {
        const state = createEmptyBitboardState()
        setPiece(state, Color.WHITE, Piece.RUA, 0)

        expect(state.whiteRua).toBe(1n)
        expect(getPieceAt(state, 0)).toEqual([Color.WHITE, Piece.RUA])
    })

    test("should set a black khun on square 4", () => {
        const state = createEmptyBitboardState()
        setPiece(state, Color.BLACK, Piece.KHUN, 4)

        expect(state.blackKhun).toBe(16n) // 2^4
        expect(getPieceAt(state, 4)).toEqual([Color.BLACK, Piece.KHUN])
    })

    test("should set multiple pieces on different squares", () => {
        const state = createEmptyBitboardState()
        setPiece(state, Color.WHITE, Piece.BIA, 16) // a3
        setPiece(state, Color.WHITE, Piece.BIA, 17) // b3
        setPiece(state, Color.BLACK, Piece.BIA, 48) // a7

        expect(state.whiteBia).toBe((1n << 16n) | (1n << 17n))
        expect(state.blackBia).toBe(1n << 48n)
    })
})

describe("getPieceAt", () => {
    test("should return null for empty square", () => {
        const state = createEmptyBitboardState()
        expect(getPieceAt(state, 0)).toBe(null)
    })

    test("should return piece at given square", () => {
        const state = createEmptyBitboardState()
        setPiece(state, Color.WHITE, Piece.MA, 10)

        expect(getPieceAt(state, 10)).toEqual([Color.WHITE, Piece.MA])
    })

    test("should return correct piece for multiple pieces", () => {
        const state = createEmptyBitboardState()
        setPiece(state, Color.WHITE, Piece.RUA, 0)
        setPiece(state, Color.BLACK, Piece.KHUN, 60)

        expect(getPieceAt(state, 0)).toEqual([Color.WHITE, Piece.RUA])
        expect(getPieceAt(state, 60)).toEqual([Color.BLACK, Piece.KHUN])
        expect(getPieceAt(state, 30)).toBe(null)
    })
})

describe("removePiece", () => {
    test("should remove a piece from the board", () => {
        const state = createEmptyBitboardState()
        setPiece(state, Color.WHITE, Piece.RUA, 5)

        expect(getPieceAt(state, 5)).toEqual([Color.WHITE, Piece.RUA])

        removePiece(state, Color.WHITE, Piece.RUA, 5)

        expect(getPieceAt(state, 5)).toBe(null)
        expect(state.whiteRua).toBe(EMPTY_BITBOARD)
    })

    test("should remove correct piece when multiple pieces present", () => {
        const state = createEmptyBitboardState()
        setPiece(state, Color.WHITE, Piece.BIA, 16)
        setPiece(state, Color.WHITE, Piece.BIA, 17)
        setPiece(state, Color.WHITE, Piece.BIA, 18)

        removePiece(state, Color.WHITE, Piece.BIA, 17)

        expect(getPieceAt(state, 16)).toEqual([Color.WHITE, Piece.BIA])
        expect(getPieceAt(state, 17)).toBe(null)
        expect(getPieceAt(state, 18)).toEqual([Color.WHITE, Piece.BIA])
    })

    test("should remove all white piece types", () => {
        const state = createEmptyBitboardState()
        setPiece(state, Color.WHITE, Piece.BIA, 8)
        setPiece(state, Color.WHITE, Piece.FLIPPED_BIA, 9)
        setPiece(state, Color.WHITE, Piece.MA, 10)
        setPiece(state, Color.WHITE, Piece.THON, 11)
        setPiece(state, Color.WHITE, Piece.MET, 12)
        setPiece(state, Color.WHITE, Piece.RUA, 13)
        setPiece(state, Color.WHITE, Piece.KHUN, 14)

        removePiece(state, Color.WHITE, Piece.BIA, 8)
        removePiece(state, Color.WHITE, Piece.FLIPPED_BIA, 9)
        removePiece(state, Color.WHITE, Piece.MA, 10)
        removePiece(state, Color.WHITE, Piece.THON, 11)
        removePiece(state, Color.WHITE, Piece.MET, 12)
        removePiece(state, Color.WHITE, Piece.RUA, 13)
        removePiece(state, Color.WHITE, Piece.KHUN, 14)

        expect(getPieceAt(state, 8)).toBe(null)
        expect(getPieceAt(state, 9)).toBe(null)
        expect(getPieceAt(state, 10)).toBe(null)
        expect(getPieceAt(state, 11)).toBe(null)
        expect(getPieceAt(state, 12)).toBe(null)
        expect(getPieceAt(state, 13)).toBe(null)
        expect(getPieceAt(state, 14)).toBe(null)
    })

    test("should remove all black piece types", () => {
        const state = createEmptyBitboardState()
        setPiece(state, Color.BLACK, Piece.BIA, 48)
        setPiece(state, Color.BLACK, Piece.FLIPPED_BIA, 49)
        setPiece(state, Color.BLACK, Piece.MA, 50)
        setPiece(state, Color.BLACK, Piece.THON, 51)
        setPiece(state, Color.BLACK, Piece.MET, 52)
        setPiece(state, Color.BLACK, Piece.RUA, 53)
        setPiece(state, Color.BLACK, Piece.KHUN, 54)

        removePiece(state, Color.BLACK, Piece.BIA, 48)
        removePiece(state, Color.BLACK, Piece.FLIPPED_BIA, 49)
        removePiece(state, Color.BLACK, Piece.MA, 50)
        removePiece(state, Color.BLACK, Piece.THON, 51)
        removePiece(state, Color.BLACK, Piece.MET, 52)
        removePiece(state, Color.BLACK, Piece.RUA, 53)
        removePiece(state, Color.BLACK, Piece.KHUN, 54)

        expect(getPieceAt(state, 48)).toBe(null)
        expect(getPieceAt(state, 49)).toBe(null)
        expect(getPieceAt(state, 50)).toBe(null)
        expect(getPieceAt(state, 51)).toBe(null)
        expect(getPieceAt(state, 52)).toBe(null)
        expect(getPieceAt(state, 53)).toBe(null)
        expect(getPieceAt(state, 54)).toBe(null)
    })
})

describe("squareIndexToBitboardSquare", () => {
    test("should convert 0x88 square to bitboard square", () => {
        expect(squareIndexToBitboardSquare(0x00 as SquareIndex)).toBe(0) // a1
        expect(squareIndexToBitboardSquare(0x07 as SquareIndex)).toBe(7) // h1
        expect(squareIndexToBitboardSquare(0x70 as SquareIndex)).toBe(56) // a8
        expect(squareIndexToBitboardSquare(0x77 as SquareIndex)).toBe(63) // h8
    })
})

describe("bitboardSquareToSquareIndex", () => {
    test("should convert bitboard square to 0x88 square", () => {
        expect(bitboardSquareToSquareIndex(0)).toBe(0x00) // a1
        expect(bitboardSquareToSquareIndex(7)).toBe(0x07) // h1
        expect(bitboardSquareToSquareIndex(56)).toBe(0x70) // a8
        expect(bitboardSquareToSquareIndex(63)).toBe(0x77) // h8
    })
})

describe("setBit", () => {
    test("should set a bit at given square", () => {
        let bb = EMPTY_BITBOARD
        bb = setBit(bb, 0)
        expect(bb).toBe(1n)

        bb = setBit(bb, 4)
        expect(bb).toBe(17n) // 1 + 16
    })
})

describe("clearBit", () => {
    test("should clear a bit at given square", () => {
        let bb = 17n // bits 0 and 4 set
        bb = clearBit(bb, 0)
        expect(bb).toBe(16n)

        bb = clearBit(bb, 4)
        expect(bb).toBe(EMPTY_BITBOARD)
    })
})

describe("getBit", () => {
    test("should get bit value at given square", () => {
        const bb = 17n // bits 0 and 4 set
        expect(getBit(bb, 0)).toBe(1)
        expect(getBit(bb, 1)).toBe(0)
        expect(getBit(bb, 4)).toBe(1)
        expect(getBit(bb, 5)).toBe(0)
    })
})

describe("popCount", () => {
    test("should count set bits in bitboard", () => {
        expect(popCount(EMPTY_BITBOARD)).toBe(0)
        expect(popCount(1n)).toBe(1)
        expect(popCount(3n)).toBe(2) // 11 in binary
        expect(popCount(0xFFn)).toBe(8) // full rank
        expect(popCount(0xFFFFFFFFFFFFFFFFn)).toBe(64) // full board
    })
})

describe("getLSB", () => {
    test("should get least significant bit index", () => {
        expect(getLSB(EMPTY_BITBOARD)).toBe(-1)
        expect(getLSB(1n)).toBe(0)
        expect(getLSB(2n)).toBe(1)
        expect(getLSB(16n)).toBe(4)
        expect(getLSB(0xFF00n)).toBe(8) // first set bit in rank 2
    })

    test("should handle edge case of square > 63", () => {
        // This shouldn't happen in practice, but test error handling
        expect(() => getLSB(1n << 100n)).toThrow()
    })
})

describe("popLSB", () => {
    test("should pop least significant bit", () => {
        const result1 = popLSB(1n)
        expect(result1.square).toBe(0)
        expect(result1.bb).toBe(EMPTY_BITBOARD)

        const result2 = popLSB(17n) // bits 0 and 4
        expect(result2.square).toBe(0)
        expect(result2.bb).toBe(16n)
    })
})

describe("getMSB", () => {
    test("should get most significant bit index", () => {
        expect(getMSB(EMPTY_BITBOARD)).toBe(-1)
        expect(getMSB(1n)).toBe(0)
        expect(getMSB(2n)).toBe(1)
        expect(getMSB(16n)).toBe(4)
        expect(getMSB(0xFF00n)).toBe(15) // last set bit in rank 2
        expect(getMSB(1n << 63n)).toBe(63)
    })
})

describe("shift functions", () => {
    test("shiftNorth should shift bitboard north", () => {
        const bb = 1n // a1
        const shifted = shiftNorth(bb)
        expect(shifted).toBe(256n) // a2 (1 << 8)
    })

    test("shiftSouth should shift bitboard south", () => {
        const bb = 256n // a2
        const shifted = shiftSouth(bb)
        expect(shifted).toBe(1n) // a1
    })

    test("shiftEast should shift bitboard east", () => {
        const bb = 1n // a1
        const shifted = shiftEast(bb)
        expect(shifted).toBe(2n) // b1
    })

    test("shiftWest should shift bitboard west", () => {
        const bb = 2n // b1
        const shifted = shiftWest(bb)
        expect(shifted).toBe(1n) // a1
    })

    test("shiftNorthEast should shift bitboard northeast", () => {
        const bb = 1n // a1
        const shifted = shiftNorthEast(bb)
        expect(shifted).toBe(512n) // b2 (1 << 9)
    })

    test("shiftNorthWest should shift bitboard northwest", () => {
        const bb = 2n // b1
        const shifted = shiftNorthWest(bb)
        expect(shifted).toBe(256n) // a2 (1 << 8)
    })

    test("shiftSouthEast should shift bitboard southeast", () => {
        const bb = 256n // a2
        const shifted = shiftSouthEast(bb)
        expect(shifted).toBe(2n) // b1
    })

    test("shiftSouthWest should shift bitboard southwest", () => {
        const bb = 512n // b2
        const shifted = shiftSouthWest(bb)
        expect(shifted).toBe(1n) // a1
    })
})

describe("updateOccupancy", () => {
    test("should update occupancy bitboards", () => {
        const state = createEmptyBitboardState()
        setPiece(state, Color.WHITE, Piece.RUA, 0)
        setPiece(state, Color.WHITE, Piece.KHUN, 4)
        setPiece(state, Color.BLACK, Piece.RUA, 56)
        setPiece(state, Color.BLACK, Piece.KHUN, 60)

        // Occupancy should be updated automatically by setPiece
        expect(state.whiteOccupancy).toBe((1n << 0n) | (1n << 4n))
        expect(state.blackOccupancy).toBe((1n << 56n) | (1n << 60n))
        expect(state.allOccupancy).toBe((1n << 0n) | (1n << 4n) | (1n << 56n) | (1n << 60n))
    })
})

describe("getPieceBitboard", () => {
    test("should get bitboard for white pieces", () => {
        const state = createEmptyBitboardState()
        setPiece(state, Color.WHITE, Piece.BIA, 8)
        setPiece(state, Color.WHITE, Piece.FLIPPED_BIA, 9)
        setPiece(state, Color.WHITE, Piece.MA, 10)
        setPiece(state, Color.WHITE, Piece.THON, 11)
        setPiece(state, Color.WHITE, Piece.MET, 12)
        setPiece(state, Color.WHITE, Piece.RUA, 13)
        setPiece(state, Color.WHITE, Piece.KHUN, 14)

        expect(getPieceBitboard(state, Color.WHITE, Piece.BIA)).toBe(1n << 8n)
        expect(getPieceBitboard(state, Color.WHITE, Piece.FLIPPED_BIA)).toBe(1n << 9n)
        expect(getPieceBitboard(state, Color.WHITE, Piece.MA)).toBe(1n << 10n)
        expect(getPieceBitboard(state, Color.WHITE, Piece.THON)).toBe(1n << 11n)
        expect(getPieceBitboard(state, Color.WHITE, Piece.MET)).toBe(1n << 12n)
        expect(getPieceBitboard(state, Color.WHITE, Piece.RUA)).toBe(1n << 13n)
        expect(getPieceBitboard(state, Color.WHITE, Piece.KHUN)).toBe(1n << 14n)
    })

    test("should get bitboard for black pieces", () => {
        const state = createEmptyBitboardState()
        setPiece(state, Color.BLACK, Piece.BIA, 48)
        setPiece(state, Color.BLACK, Piece.FLIPPED_BIA, 49)
        setPiece(state, Color.BLACK, Piece.MA, 50)
        setPiece(state, Color.BLACK, Piece.THON, 51)
        setPiece(state, Color.BLACK, Piece.MET, 52)
        setPiece(state, Color.BLACK, Piece.RUA, 53)
        setPiece(state, Color.BLACK, Piece.KHUN, 54)

        expect(getPieceBitboard(state, Color.BLACK, Piece.BIA)).toBe(1n << 48n)
        expect(getPieceBitboard(state, Color.BLACK, Piece.FLIPPED_BIA)).toBe(1n << 49n)
        expect(getPieceBitboard(state, Color.BLACK, Piece.MA)).toBe(1n << 50n)
        expect(getPieceBitboard(state, Color.BLACK, Piece.THON)).toBe(1n << 51n)
        expect(getPieceBitboard(state, Color.BLACK, Piece.MET)).toBe(1n << 52n)
        expect(getPieceBitboard(state, Color.BLACK, Piece.RUA)).toBe(1n << 53n)
        expect(getPieceBitboard(state, Color.BLACK, Piece.KHUN)).toBe(1n << 54n)
    })

    test("should return empty bitboard for invalid piece type", () => {
        const state = createEmptyBitboardState()
        // Test default case by using an invalid piece value
        expect(getPieceBitboard(state, Color.WHITE, 99 as unknown as Piece)).toBe(EMPTY_BITBOARD)
        expect(getPieceBitboard(state, Color.BLACK, 99 as unknown as Piece)).toBe(EMPTY_BITBOARD)
    })
})

describe("printBitboard", () => {
    test("should print bitboard as string", () => {
        const bb = (1n << 0n) | (1n << 7n) | (1n << 56n) | (1n << 63n) // corners
        const result = printBitboard(bb)

        expect(typeof result).toBe("string")
        expect(result).toContain("1 ")
        expect(result).toContain(". ")
        expect(result).toContain("a b c d e f g h")
    })

    test("should print empty bitboard", () => {
        const result = printBitboard(EMPTY_BITBOARD)
        expect(typeof result).toBe("string")
        expect(result).toContain(". ")
        expect(result).not.toContain("1 1") // should not have adjacent 1s in empty board
    })
})

describe("setPiece with all piece types", () => {
    test("should set all white piece types", () => {
        const state = createEmptyBitboardState()
        setPiece(state, Color.WHITE, Piece.BIA, 8)
        setPiece(state, Color.WHITE, Piece.FLIPPED_BIA, 9)
        setPiece(state, Color.WHITE, Piece.MA, 10)
        setPiece(state, Color.WHITE, Piece.THON, 11)
        setPiece(state, Color.WHITE, Piece.MET, 12)
        setPiece(state, Color.WHITE, Piece.RUA, 13)
        setPiece(state, Color.WHITE, Piece.KHUN, 14)

        expect(getPieceAt(state, 8)).toEqual([Color.WHITE, Piece.BIA])
        expect(getPieceAt(state, 9)).toEqual([Color.WHITE, Piece.FLIPPED_BIA])
        expect(getPieceAt(state, 10)).toEqual([Color.WHITE, Piece.MA])
        expect(getPieceAt(state, 11)).toEqual([Color.WHITE, Piece.THON])
        expect(getPieceAt(state, 12)).toEqual([Color.WHITE, Piece.MET])
        expect(getPieceAt(state, 13)).toEqual([Color.WHITE, Piece.RUA])
        expect(getPieceAt(state, 14)).toEqual([Color.WHITE, Piece.KHUN])
    })

    test("should set all black piece types", () => {
        const state = createEmptyBitboardState()
        setPiece(state, Color.BLACK, Piece.BIA, 48)
        setPiece(state, Color.BLACK, Piece.FLIPPED_BIA, 49)
        setPiece(state, Color.BLACK, Piece.MA, 50)
        setPiece(state, Color.BLACK, Piece.THON, 51)
        setPiece(state, Color.BLACK, Piece.MET, 52)
        setPiece(state, Color.BLACK, Piece.RUA, 53)
        setPiece(state, Color.BLACK, Piece.KHUN, 54)

        expect(getPieceAt(state, 48)).toEqual([Color.BLACK, Piece.BIA])
        expect(getPieceAt(state, 49)).toEqual([Color.BLACK, Piece.FLIPPED_BIA])
        expect(getPieceAt(state, 50)).toEqual([Color.BLACK, Piece.MA])
        expect(getPieceAt(state, 51)).toEqual([Color.BLACK, Piece.THON])
        expect(getPieceAt(state, 52)).toEqual([Color.BLACK, Piece.MET])
        expect(getPieceAt(state, 53)).toEqual([Color.BLACK, Piece.RUA])
        expect(getPieceAt(state, 54)).toEqual([Color.BLACK, Piece.KHUN])
    })
})
