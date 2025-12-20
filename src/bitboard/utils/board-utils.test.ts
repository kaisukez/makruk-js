import { Color } from "common/const"
import { createGameFromFen, INITIAL_FEN } from "bitboard/fen"

import { printBoard, swapColor } from "bitboard/utils/board-utils"

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

    describe("printBoard", () => {
        it("should print initial position", () => {
            const { board: state } = createGameFromFen(INITIAL_FEN)
            const output = printBoard(state)
            expect(output).toContain("+------------------------+")
            expect(output).toContain("a  b  c  d  e  f  g  h")
            expect(output).toContain("r")
            expect(output).toContain("k")
            expect(output).toContain("R")
            expect(output).toContain("K")
        })

        it("should print mostly empty board", () => {
            const { board: state } = createGameFromFen("k7/8/8/8/8/8/8/7K w 1")
            const output = printBoard(state)
            expect(output).toContain("+------------------------+")
            expect(output).toContain(".")
            expect(output).toContain("k")
            expect(output).toContain("K")
        })

        it("should show white pieces in uppercase", () => {
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/4K3 w 1")
            const output = printBoard(state)
            expect(output).toContain("K")
        })

        it("should show black pieces in lowercase", () => {
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/4K3 w 1")
            const output = printBoard(state)
            expect(output).toContain("k")
        })

        it("should display all piece types", () => {
            const { board: state } = createGameFromFen("rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1")
            const output = printBoard(state)
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
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/4K3 w 1")
            const output = printBoard(state)
            expect(output).toContain("1 |")
            expect(output).toContain("8 |")
        })

        it("should use dots for empty squares", () => {
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/4K3 w 1")
            const output = printBoard(state)
            expect(output).toContain(".")
        })
    })
})
