import { Color, SquareIndex } from "common/const"
import { createGameFromFen, INITIAL_FEN } from "0x88/fen/importer"

import { getAlgebraic, getFile, getRank, printBoard, swapColor } from "0x88/utils/board-utils"

describe("board-utils", () => {
    describe("swapColor", () => {
        it("should swap white to black", () => {
            expect(swapColor(Color.WHITE)).toBe(Color.BLACK)
        })

        it("should swap black to white", () => {
            expect(swapColor(Color.BLACK)).toBe(Color.WHITE)
        })

        it("should be reversible", () => {
            const color = Color.WHITE
            expect(swapColor(swapColor(color))).toBe(color)
        })
    })

    describe("getRank", () => {
        it("should get rank for a1", () => {
            expect(getRank(SquareIndex.a1)).toBe(0)
        })

        it("should get rank for a8", () => {
            expect(getRank(SquareIndex.a8)).toBe(7)
        })

        it("should get rank for e4", () => {
            expect(getRank(SquareIndex.e4)).toBe(3)
        })

        it("should get rank for h1", () => {
            expect(getRank(SquareIndex.h1)).toBe(0)
        })

        it("should get rank for h8", () => {
            expect(getRank(SquareIndex.h8)).toBe(7)
        })
    })

    describe("getFile", () => {
        it("should get file for a1", () => {
            expect(getFile(SquareIndex.a1)).toBe(0)
        })

        it("should get file for h1", () => {
            expect(getFile(SquareIndex.h1)).toBe(7)
        })

        it("should get file for e4", () => {
            expect(getFile(SquareIndex.e4)).toBe(4)
        })

        it("should get file for a8", () => {
            expect(getFile(SquareIndex.a8)).toBe(0)
        })

        it("should get file for h8", () => {
            expect(getFile(SquareIndex.h8)).toBe(7)
        })
    })

    describe("getAlgebraic", () => {
        describe("English notation", () => {
            it("should convert a1", () => {
                expect(getAlgebraic(SquareIndex.a1)).toBe("a1")
            })

            it("should convert h8", () => {
                expect(getAlgebraic(SquareIndex.h8)).toBe("h8")
            })

            it("should convert e4", () => {
                expect(getAlgebraic(SquareIndex.e4)).toBe("e4")
            })

            it("should convert d5", () => {
                expect(getAlgebraic(SquareIndex.d5)).toBe("d5")
            })

            it("should use English by default", () => {
                expect(getAlgebraic(SquareIndex.a1, false)).toBe("a1")
            })
        })

        describe("Thai notation", () => {
            it("should convert a1 to Thai", () => {
                expect(getAlgebraic(SquareIndex.a1, true)).toBe("ก1")
            })

            it("should convert h8 to Thai", () => {
                expect(getAlgebraic(SquareIndex.h8, true)).toBe("ญ8")
            })

            it("should convert e4 to Thai", () => {
                expect(getAlgebraic(SquareIndex.e4, true)).toBe("จ4")
            })

            it("should convert all files correctly", () => {
                expect(getAlgebraic(SquareIndex.a1, true)).toBe("ก1")
                expect(getAlgebraic(SquareIndex.b1, true)).toBe("ข1")
                expect(getAlgebraic(SquareIndex.c1, true)).toBe("ค1")
                expect(getAlgebraic(SquareIndex.d1, true)).toBe("ง1")
                expect(getAlgebraic(SquareIndex.e1, true)).toBe("จ1")
                expect(getAlgebraic(SquareIndex.f1, true)).toBe("ฉ1")
                expect(getAlgebraic(SquareIndex.g1, true)).toBe("ช1")
                expect(getAlgebraic(SquareIndex.h1, true)).toBe("ญ1")
            })
        })
    })

    describe("printBoard", () => {
        it("should print initial position", () => {
            const state = createGameFromFen(INITIAL_FEN)
            const output = printBoard(state.boardState)
            expect(output).toContain("+------------------------+")
            expect(output).toContain("a  b  c  d  e  f  g  h")
            expect(output).toContain("r")
            expect(output).toContain("k")
            expect(output).toContain("R")
            expect(output).toContain("K")
        })

        it("should print mostly empty board", () => {
            const state = createGameFromFen("k7/8/8/8/8/8/8/7K w 1")
            const output = printBoard(state.boardState)
            expect(output).toContain("+------------------------+")
            expect(output).toContain(".")
            expect(output).toContain("k")
            expect(output).toContain("K")
        })

        it("should show white pieces in uppercase", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K3 w 1")
            const output = printBoard(state.boardState)
            expect(output).toContain("K")
        })

        it("should show black pieces in lowercase", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K3 w 1")
            const output = printBoard(state.boardState)
            expect(output).toContain("k")
        })

        it("should display all piece types", () => {
            const state = createGameFromFen("rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1")
            const output = printBoard(state.boardState)
            expect(output).toContain("r")
            expect(output).toContain("m")
            expect(output).toContain("t")
            expect(output).toContain("e")
            expect(output).toContain("k")
            expect(output).toContain("b")
            expect(output).toContain("R")
            expect(output).toContain("M")
            expect(output).toContain("T")
            expect(output).toContain("E")
            expect(output).toContain("K")
            expect(output).toContain("B")
        })

        it("should display rank numbers", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K3 w 1")
            const output = printBoard(state.boardState)
            expect(output).toContain("1 |")
            expect(output).toContain("8 |")
        })

        it("should use dots for empty squares", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K3 w 1")
            const output = printBoard(state.boardState)
            expect(output).toContain(".")
        })

        it("should throw for null boardState", () => {
            expect(() => {
                printBoard(null as any)
            }).toThrow()
        })
    })
})
