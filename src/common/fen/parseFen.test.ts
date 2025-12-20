const { describe, expect, test } = globalThis as any

import { Color, CountType } from "common/const"
import { parseFen } from "common/fen"

describe("parseFen", () => {
    describe("valid FEN strings", () => {
        test("should parse initial FEN", () => {
            const result = parseFen("rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1")
            expect(result.boardString).toBe("rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR")
            expect(result.turn).toBe(Color.WHITE)
            expect(result.moveNumber).toBe(1)
            expect(result.countdown).toBeNull()
        })

        test("should parse FEN with black to move", () => {
            const fen = "rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR b 5"
            const result = parseFen(fen)
            expect(result.turn).toBe(Color.BLACK)
            expect(result.moveNumber).toBe(5)
        })

        test("should parse FEN with board power countdown", () => {
            const fen = "4k3/8/8/8/8/8/8/4K3 w 10 w bp 64 10 100"
            const result = parseFen(fen)
            expect(result.boardString).toBe("4k3/8/8/8/8/8/8/4K3")
            expect(result.turn).toBe(Color.WHITE)
            expect(result.moveNumber).toBe(10)
            expect(result.countdown).toEqual({
                countColor: Color.WHITE,
                countType: CountType.BOARD_POWER_COUNTDOWN,
                count: 64,
                countFrom: 10,
                countTo: 100,
            })
        })

        test("should parse FEN with piece power countdown", () => {
            const fen = "4k3/8/8/8/8/8/8/4K3 b 25 b pp 5 25 50"
            const result = parseFen(fen)
            expect(result.countdown).toEqual({
                countColor: Color.BLACK,
                countType: CountType.PIECE_POWER_COUNTDOWN,
                count: 5,
                countFrom: 25,
                countTo: 50,
            })
        })

        test("should parse FEN with large move number", () => {
            const fen = "4k3/8/8/8/8/8/8/4K3 w 999"
            const result = parseFen(fen)
            expect(result.moveNumber).toBe(999)
        })

        test("should parse FEN with all pieces", () => {
            const fen = "rmtektmr/bbbbbbbb/8/8/8/8/BBBBBBBB/RMTKETMR w 1"
            const result = parseFen(fen)
            expect(result.boardString).toBe("rmtektmr/bbbbbbbb/8/8/8/8/BBBBBBBB/RMTKETMR")
        })

        test("should parse FEN with flipped bia", () => {
            const fen = "4k3/8/8/3f4/3F4/8/8/4K3 w 15"
            const result = parseFen(fen)
            expect(result.boardString).toBe("4k3/8/8/3f4/3F4/8/8/4K3")
        })

        test("should parse FEN with mixed pieces and numbers", () => {
            const fen = "r1t1k1t1/8/b1b1b1b1/8/8/B1B1B1B1/8/R1T1K1T1 w 1"
            const result = parseFen(fen)
            expect(result.boardString).toBe("r1t1k1t1/8/b1b1b1b1/8/8/B1B1B1B1/8/R1T1K1T1")
        })
    })

    describe("invalid FEN strings - wrong number of fields", () => {
        test("should throw error for FEN with 1 field", () => {
            expect(() => parseFen("rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_NUMBER_OF_INPUTS",
                    message: "fen must be string with 3 or 8 fields separated by space",
                }))
        })

        test("should throw error for FEN with 2 fields", () => {
            expect(() => parseFen("rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_NUMBER_OF_INPUTS",
                }))
        })

        test("should throw error for FEN with 4 fields", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/8/4K3 w 1 w"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_NUMBER_OF_INPUTS",
                }))
        })

        test("should throw error for FEN with 5 fields", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/8/4K3 w 1 w bp"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_NUMBER_OF_INPUTS",
                }))
        })

        test("should throw error for FEN with 6 fields", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/8/4K3 w 1 w bp 64"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_NUMBER_OF_INPUTS",
                }))
        })

        test("should throw error for FEN with 7 fields", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/8/4K3 w 1 w bp 64 10"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_NUMBER_OF_INPUTS",
                }))
        })
    })

    describe("invalid FEN strings - board string errors", () => {
        test("should throw error for invalid characters in board string", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/8/4X3 w 1"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_BOARD_STRING_CHARACTER",
                    message: "boardString can only contains 'bfmterkBFMTERK12345678/'",
                    fieldNumber: 1,
                }))
        })

        test("should throw error for wrong number of ranks (too few)", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/4K3 w 1"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_BOARD_STRING_NUMBER_OF_RANKS",
                    message: "boardString must contain 8 ranks separated by '/'",
                    fieldNumber: 1,
                }))
        })

        test("should throw error for wrong number of ranks (too many)", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/8/8/4K3 w 1"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_BOARD_STRING_NUMBER_OF_RANKS",
                }))
        })

        test("should throw error for consecutive numbers", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/71/4K3 w 1"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_BOARD_STRING_NUMBER_NEXT_TO_EACH_OTHER",
                    message: "boardString must not have any connected number like this /bb6/71/... (7 and 1)",
                }))
        })

        test("should throw error for wrong total number of squares (too few)", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/8/4K w 1"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_BOARD_STRING_NUMBER_OF_SQUARES",
                    message: "total of squares boardString represented must be 64",
                }))
        })

        test("should throw error for wrong total number of squares (too many)", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/8/4K3k w 1"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_BOARD_STRING_NUMBER_OF_SQUARES",
                }))
        })

        test("should throw error for wrong squares per rank", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/7/4K4 w 1"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_BOARD_STRING_NUMBER_OF_SQUARES_PER_RANK",
                    message: "number of squares per rank must be 8",
                }))
        })

        test("should throw error for missing white khun", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/8/8 w 1"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_BOARD_STRING_NUMBER_OF_KHUNS",
                    message: "number of khun must be 1 for each side",
                }))
        })

        test("should throw error for missing black khun", () => {
            expect(() => parseFen("8/8/8/8/8/8/8/4K3 w 1"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_BOARD_STRING_NUMBER_OF_KHUNS",
                }))
        })

        test("should throw error for multiple white khuns", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/8/3KK3 w 1"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_BOARD_STRING_NUMBER_OF_KHUNS",
                }))
        })

        test("should throw error for multiple black khuns", () => {
            expect(() => parseFen("3kk3/8/8/8/8/8/8/4K3 w 1"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_BOARD_STRING_NUMBER_OF_KHUNS",
                }))
        })
    })

    describe("invalid FEN strings - active color errors", () => {
        test("should throw error for invalid active color", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/8/4K3 x 1"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_ACTIVE_COLOR",
                    message: "activeColor can be either 'w' or 'b' (white or black)",
                    fieldNumber: 2,
                }))
        })

        test("should throw error for uppercase active color", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/8/4K3 W 1"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_ACTIVE_COLOR",
                }))
        })

        test("should throw error for numeric active color", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/8/4K3 1 1"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_ACTIVE_COLOR",
                }))
        })
    })

    describe("invalid FEN strings - move number errors", () => {
        test("should throw error for zero move number", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/8/4K3 w 0"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_MOVE_NUMBER",
                    message: "moveNumber must be number (positive number with no 0 in front)",
                    fieldNumber: 3,
                }))
        })

        test("should throw error for negative move number", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/8/4K3 w -5"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_MOVE_NUMBER",
                }))
        })

        test("should throw error for move number with leading zero", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/8/4K3 w 01"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_MOVE_NUMBER",
                }))
        })

        test("should throw error for non-numeric move number", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/8/4K3 w abc"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_MOVE_NUMBER",
                }))
        })
    })

    describe("invalid FEN strings - countdown errors", () => {
        test("should throw error for partial countdown (only color)", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/8/4K3 w 1 w - - - -"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_COUNTDOWN",
                    message: "countColor, countType and count can be '-' at the same time or can be something else at the same time",
                }))
        })

        test("should throw error for partial countdown (color and type)", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/8/4K3 w 1 w bp - - -"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_COUNTDOWN",
                }))
        })

        test("should throw error for invalid count color", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/8/4K3 w 1 x bp 64 10 100"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_COUNT_COLOR",
                    message: "countColor can be either 'w' or 'b' (white or black)",
                }))
        })

        test("should throw error for invalid count type", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/8/4K3 w 1 w xx 64 10 100"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_COUNT_TYPE",
                    message: "countType can be either 'bp' or 'pp' (board power or piece power)",
                    fieldNumber: 5,
                }))
        })

        test("should throw error for invalid count number (zero)", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/8/4K3 w 1 w bp 0 10 100"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_COUNT_NUMBER",
                    message: "countNumber must be number (positive number with no 0 in front)",
                }))
        })

        test("should throw error for invalid count number (negative)", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/8/4K3 w 1 w bp -5 10 100"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_COUNT_NUMBER",
                }))
        })

        test("should throw error for invalid countFrom (zero)", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/8/4K3 w 1 w bp 64 0 100"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_COUNT_FROM_NUMBER",
                    message: "countFrom must be number (positive number with no 0 in front)",
                    fieldNumber: 7,
                }))
        })

        test("should throw error for invalid countTo (zero)", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/8/4K3 w 1 w bp 64 10 0"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_COUNT_TO_NUMBER",
                    message: "countTo must be number (positive number with no 0 in front)",
                    fieldNumber: 8,
                }))
        })

        test("should throw error for countFrom with leading zero", () => {
            expect(() => parseFen("4k3/8/8/8/8/8/8/4K3 w 1 w bp 64 010 100"))
                .toThrow(expect.objectContaining({
                    code: "WRONG_COUNT_FROM_NUMBER",
                }))
        })
    })
})
