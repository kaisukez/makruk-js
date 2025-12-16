import { Color, CountType } from "config"
import { importFen } from "core/fen/importer"

import {
    calculateBoardPowerCountdown,
    calculateCountdown,
    calculatePiecePowerCountdown,
    hasCountdownFlag,
    hasStartCountdownFlag,
    hasStopCountdownFlag,
} from "core/rules/countdown"

describe("countdown", () => {
    describe("calculatePiecePowerCountdown", () => {
        it("should return null when active player has more than just Khun", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4KR2 w 1")
            expect(calculatePiecePowerCountdown(state)).toBeNull()
        })

        it("should return null when there are Bia on board", () => {
            const state = importFen("4k3/8/8/8/8/8/3B4/4K3 w 1")
            expect(calculatePiecePowerCountdown(state)).toBeNull()
        })

        it("should calculate countdown for 1 Rua", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4K2r w 1")
            const result = calculatePiecePowerCountdown(state)
            expect(result).toEqual({
                countFrom: 1,
                countTo: 16,
            })
        })

        it("should calculate countdown for 2 Rua", () => {
            const state = importFen("4k3/8/8/8/8/8/8/r3K2r w 1")
            const result = calculatePiecePowerCountdown(state)
            expect(result).toEqual({
                countFrom: 1,
                countTo: 8,
            })
        })

        it("should calculate countdown for 1 Thon", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4K2t w 1")
            const result = calculatePiecePowerCountdown(state)
            expect(result).toEqual({
                countFrom: 1,
                countTo: 44,
            })
        })

        it("should calculate countdown for 2 Thon", () => {
            const state = importFen("4k3/8/8/8/8/8/8/t3K2t w 1")
            const result = calculatePiecePowerCountdown(state)
            expect(result).toEqual({
                countFrom: 1,
                countTo: 22,
            })
        })

        it("should calculate countdown for 1 Ma", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4K2m w 1")
            const result = calculatePiecePowerCountdown(state)
            expect(result).toEqual({
                countFrom: 1,
                countTo: 64,
            })
        })

        it("should calculate countdown for 2 Ma", () => {
            const state = importFen("4k3/8/8/8/8/8/8/m3K2m w 1")
            const result = calculatePiecePowerCountdown(state)
            expect(result).toEqual({
                countFrom: 1,
                countTo: 32,
            })
        })

        it("should calculate countdown for other pieces", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4K2e w 1")
            const result = calculatePiecePowerCountdown(state)
            expect(result).toEqual({
                countFrom: 1,
                countTo: 64,
            })
        })
    })

    describe("calculateBoardPowerCountdown", () => {
        it("should return null when active player has only Khun", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4K3 w 1")
            expect(calculateBoardPowerCountdown(state)).toBeNull()
        })

        it("should return null when there are Bia on board", () => {
            const state = importFen("4k3/8/8/8/8/8/3B4/4KR2 w 1")
            expect(calculateBoardPowerCountdown(state)).toBeNull()
        })

        it("should calculate countdown when active player has more than Khun", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4KR2 w 1")
            const result = calculateBoardPowerCountdown(state)
            expect(result).toEqual({
                countFrom: 3,
                countTo: 64,
            })
        })

        it("should count all pieces on board", () => {
            const state = importFen("4k3/8/8/8/8/8/8/rmt1KRM1 w 1")
            const result = calculateBoardPowerCountdown(state)
            expect(result).toEqual({
                countFrom: 7,
                countTo: 64,
            })
        })
    })

    describe("calculateCountdown", () => {
        it("should return null when neither countdown condition met", () => {
            const state = importFen("rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1")
            expect(calculateCountdown(state)).toBeNull()
        })

        it("should prioritize piece power countdown", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4K2r w 1")
            const result = calculateCountdown(state)
            expect(result).toEqual({
                countColor: Color.WHITE,
                countType: CountType.PIECE_POWER_COUNTDOWN,
                count: 1,
                countFrom: 1,
                countTo: 16,
            })
        })

        it("should return board power countdown when piece power not available", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4KR2 w 1")
            const result = calculateCountdown(state)
            expect(result).toEqual({
                countColor: Color.WHITE,
                countType: CountType.BOARD_POWER_COUNTDOWN,
                count: 3,
                countFrom: 3,
                countTo: 64,
            })
        })

        it("should set correct countColor for black", () => {
            const state = importFen("4k2R/8/8/8/8/8/8/4K3 b 1")
            const result = calculateCountdown(state)
            expect(result?.countColor).toBe(Color.BLACK)
        })
    })

    describe("hasStartCountdownFlag", () => {
        it("should return falsy for empty flags", () => {
            expect(hasStartCountdownFlag({})).toBeFalsy()
        })

        it("should return truthy for startPiecePowerCountdown", () => {
            expect(hasStartCountdownFlag({ startPiecePowerCountdown: true })).toBeTruthy()
        })

        it("should return truthy for startBoardPowerCountdown", () => {
            expect(hasStartCountdownFlag({ startBoardPowerCountdown: true })).toBeTruthy()
        })

        it("should return truthy for startCountdown", () => {
            expect(hasStartCountdownFlag({ startCountdown: true })).toBeTruthy()
        })

        it("should return falsy for stop flags only", () => {
            expect(hasStartCountdownFlag({ stopCountdown: true })).toBeFalsy()
        })
    })

    describe("hasStopCountdownFlag", () => {
        it("should return falsy for empty flags", () => {
            expect(hasStopCountdownFlag({})).toBeFalsy()
        })

        it("should return truthy for stopPiecePowerCountdown", () => {
            expect(hasStopCountdownFlag({ stopPiecePowerCountdown: true })).toBeTruthy()
        })

        it("should return truthy for stopBoardPowerCountdown", () => {
            expect(hasStopCountdownFlag({ stopBoardPowerCountdown: true })).toBeTruthy()
        })

        it("should return truthy for stopCountdown", () => {
            expect(hasStopCountdownFlag({ stopCountdown: true })).toBeTruthy()
        })

        it("should return falsy for start flags only", () => {
            expect(hasStopCountdownFlag({ startCountdown: true })).toBeFalsy()
        })
    })

    describe("hasCountdownFlag", () => {
        it("should return falsy for empty flags", () => {
            expect(hasCountdownFlag({})).toBeFalsy()
        })

        it("should return truthy for start flags", () => {
            expect(hasCountdownFlag({ startCountdown: true })).toBeTruthy()
        })

        it("should return truthy for stop flags", () => {
            expect(hasCountdownFlag({ stopCountdown: true })).toBeTruthy()
        })

        it("should return truthy for both", () => {
            expect(hasCountdownFlag({ startCountdown: true, stopCountdown: true })).toBeTruthy()
        })
    })
})
