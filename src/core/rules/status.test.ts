import { Color, CountType } from "config"
import { importFen, INITIAL_FEN } from "core/fen/importer"
import { produceState } from "utils/immer-helpers"

import {
    isCheck,
    isCheckmate,
    isDraw,
    isFinishedCounting,
    isGameOver,
    isInsufficientMaterial,
    isStalemate,
    isThreefoldRepetition,
} from "core/rules/status"

describe("status", () => {
    describe("isCheck", () => {
        it("should return false on initial position", () => {
            const state = importFen(INITIAL_FEN)
            expect(isCheck(state)).toBe(false)
        })

        it("should return false when not in check", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4K3 w 1")
            expect(isCheck(state)).toBe(false)
        })

        it("should return true when white is in check", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4Kr2 w 1")
            expect(isCheck(state)).toBe(true)
        })

        it("should return true when black is in check", () => {
            const state = importFen("4kR2/8/8/8/8/8/8/4K3 b 1")
            expect(isCheck(state)).toBe(true)
        })

        it("should detect check from Ma", () => {
            const state = importFen("4k3/8/8/8/8/3m4/8/4K3 w 1")
            expect(isCheck(state)).toBe(true)
        })

        it("should not detect check when blocked", () => {
            const state = importFen("4kr2/4B3/8/8/8/8/8/4K3 b 1")
            expect(isCheck(state)).toBe(false)
        })
    })

    describe("isCheckmate", () => {
        it("should return false on initial position", () => {
            const state = importFen(INITIAL_FEN)
            expect(isCheckmate(state)).toBe(false)
        })

        it("should return false when not in check", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4K3 w 1")
            expect(isCheckmate(state)).toBe(false)
        })

        it("should return false when in check but can escape", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4Kr2 w 1")
            expect(isCheckmate(state)).toBe(false)
        })

        it("should return true for back rank mate", () => {
            const state = importFen("6Rk/6R1/8/8/8/8/8/7K b 1")
            expect(isCheckmate(state)).toBe(true)
        })
    })

    describe("isStalemate", () => {
        it("should return false on initial position", () => {
            const state = importFen(INITIAL_FEN)
            expect(isStalemate(state)).toBe(false)
        })

        it("should return false when in check", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4Kr2 w 1")
            expect(isStalemate(state)).toBe(false)
        })

        it("should return true when not in check but no legal moves", () => {
            const state = importFen("7k/5R2/8/8/8/8/8/6RK b 1")
            expect(isStalemate(state)).toBe(true)
        })
    })

    describe("isThreefoldRepetition", () => {
        it("should return false on initial position", () => {
            const state = importFen(INITIAL_FEN)
            expect(isThreefoldRepetition(state)).toBe(false)
        })

        it("should return true when position occurred 3 times", () => {
            let state = importFen("4k3/8/8/8/8/8/8/4K3 w 1")
            const fen = "4k3/8/8/8/8/8/8/4K3 w 1"
            state = produceState(state, (draft) => {
                draft.fenOccurrence[fen] = 3
            })
            expect(isThreefoldRepetition(state)).toBe(true)
        })

        it("should return false when position occurred only 2 times", () => {
            let state = importFen("4k3/8/8/8/8/8/8/4K3 w 1")
            const fen = "4k3/8/8/8/8/8/8/4K3 w 1"
            state = produceState(state, (draft) => {
                draft.fenOccurrence[fen] = 2
            })
            expect(isThreefoldRepetition(state)).toBe(false)
        })
    })

    describe("isFinishedCounting", () => {
        it("should return false when not counting", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4K3 w 1")
            expect(isFinishedCounting(state)).toBe(false)
        })

        it("should return false when countdown not reached", () => {
            let state = importFen("4k3/8/8/8/8/8/8/4K3 w 1")
            state = produceState(state, (draft) => {
                draft.countdown = {
                    countColor: Color.WHITE,
                    countType: CountType.PIECE_POWER_COUNTDOWN,
                    count: 5,
                    countFrom: 1,
                    countTo: 64,
                }
            })
            expect(isFinishedCounting(state)).toBe(false)
        })

        it("should return true when countdown reached", () => {
            let state = importFen("4k3/8/8/8/8/8/8/4K3 w 1")
            state = produceState(state, (draft) => {
                draft.countdown = {
                    countColor: Color.WHITE,
                    countType: CountType.PIECE_POWER_COUNTDOWN,
                    count: 64,
                    countFrom: 1,
                    countTo: 64,
                }
            })
            expect(isFinishedCounting(state)).toBe(true)
        })

        it("should return false when countdown reached but wrong color turn", () => {
            let state = importFen("4k3/8/8/8/8/8/8/4K3 w 1")
            state = produceState(state, (draft) => {
                draft.countdown = {
                    countColor: Color.BLACK,
                    countType: CountType.PIECE_POWER_COUNTDOWN,
                    count: 64,
                    countFrom: 1,
                    countTo: 64,
                }
            })
            expect(isFinishedCounting(state)).toBe(false)
        })
    })

    describe("isInsufficientMaterial", () => {
        it("should return false on initial position", () => {
            const state = importFen(INITIAL_FEN)
            expect(isInsufficientMaterial(state)).toBe(false)
        })

        it("should return true for K vs K", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4K3 w 1")
            expect(isInsufficientMaterial(state)).toBe(true)
        })

        it("should return true for K vs K+E", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4K2E w 1")
            expect(isInsufficientMaterial(state)).toBe(true)
        })

        it("should return true for K vs K+M", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4K2M w 1")
            expect(isInsufficientMaterial(state)).toBe(true)
        })

        it("should return true for K vs K+B", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4K2B w 1")
            expect(isInsufficientMaterial(state)).toBe(true)
        })

        it("should return false for K vs K+R", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4K2R w 1")
            expect(isInsufficientMaterial(state)).toBe(false)
        })

        it("should return false for K vs K+T", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4K2T w 1")
            expect(isInsufficientMaterial(state)).toBe(false)
        })
    })

    describe("isDraw", () => {
        it("should return false on initial position", () => {
            const state = importFen(INITIAL_FEN)
            expect(isDraw(state)).toBe(false)
        })

        it("should return true for stalemate", () => {
            const state = importFen("7k/5R2/8/8/8/8/8/6RK b 1")
            expect(isDraw(state)).toBe(true)
        })

        it("should return true for insufficient material", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4K3 w 1")
            expect(isDraw(state)).toBe(true)
        })

        it("should return true for threefold repetition", () => {
            let state = importFen("4k3/8/8/8/8/8/8/4K3 w 1")
            const fen = "4k3/8/8/8/8/8/8/4K3 w 1"
            state = produceState(state, (draft) => {
                draft.fenOccurrence[fen] = 3
            })
            expect(isDraw(state)).toBe(true)
        })

        it("should return true for finished counting", () => {
            let state = importFen("4k3/8/8/8/8/8/8/4K3 w 1")
            state = produceState(state, (draft) => {
                draft.countdown = {
                    countColor: Color.WHITE,
                    countType: CountType.PIECE_POWER_COUNTDOWN,
                    count: 64,
                    countFrom: 1,
                    countTo: 64,
                }
            })
            expect(isDraw(state)).toBe(true)
        })
    })

    describe("isGameOver", () => {
        it("should return false on initial position", () => {
            const state = importFen(INITIAL_FEN)
            expect(isGameOver(state)).toBe(false)
        })

        it("should return true for checkmate", () => {
            const state = importFen("6Rk/6R1/8/8/8/8/8/7K b 1")
            expect(isGameOver(state)).toBe(true)
        })

        it("should return true for stalemate", () => {
            const state = importFen("7k/5R2/8/8/8/8/8/6RK b 1")
            expect(isGameOver(state)).toBe(true)
        })

        it("should return true for insufficient material", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4K3 w 1")
            expect(isGameOver(state)).toBe(true)
        })

        it("should return false when game is ongoing", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4K2R w 1")
            expect(isGameOver(state)).toBe(false)
        })
    })
})
