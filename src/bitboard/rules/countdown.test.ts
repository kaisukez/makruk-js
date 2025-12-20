const { describe, expect, test } = globalThis as any

import { Color, CountType, Piece } from "common/const"
import { createGameFromFen } from "bitboard/fen"
import {
    calculateBoardPowerCountdown,
    calculateCountdown,
    calculatePiecePowerCountdown,
    hasCountdownFlag,
    hasStartCountdownFlag,
    hasStopCountdownFlag,
    stepCountdown,
    isCountdownExpired,
    countPiecesFromMask64,
} from "bitboard/rules/countdown"

describe("countdown", () => {
    describe("countPiecesFromMask64", () => {
        test("should count pieces correctly", () => {
            const { board: state } = createGameFromFen("rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1")
            const pieceCount = countPiecesFromMask64(state)

            expect(pieceCount.all).toBe(32)
            expect(pieceCount.color[Color.WHITE]).toBe(16)
            expect(pieceCount.color[Color.BLACK]).toBe(16)
            expect(pieceCount.piece[Piece.BIA]).toBe(16)
        })

        test("should count minimal position", () => {
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/4K3 w 1")
            const pieceCount = countPiecesFromMask64(state)

            expect(pieceCount.all).toBe(2)
            expect(pieceCount.color[Color.WHITE]).toBe(1)
            expect(pieceCount.color[Color.BLACK]).toBe(1)
        })
    })

    describe("calculatePiecePowerCountdown", () => {
        test("should return null when active player has more than just Khun", () => {
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/4KR2 w 1")
            expect(calculatePiecePowerCountdown(state, Color.WHITE)).toBeNull()
        })

        test("should return null when there are Bia on board", () => {
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/3B4/4K3 w 1")
            expect(calculatePiecePowerCountdown(state, Color.WHITE)).toBeNull()
        })

        test("should calculate countdown for 1 Rua", () => {
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            const result = calculatePiecePowerCountdown(state, Color.WHITE)
            expect(result).toEqual({
                countFrom: 1,
                countTo: 16,
            })
        })

        test("should calculate countdown for 2 Rua", () => {
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/r3K2r w 1")
            const result = calculatePiecePowerCountdown(state, Color.WHITE)
            expect(result).toEqual({
                countFrom: 1,
                countTo: 8,
            })
        })

        test("should calculate countdown for 1 Thon", () => {
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/4K2t w 1")
            const result = calculatePiecePowerCountdown(state, Color.WHITE)
            expect(result).toEqual({
                countFrom: 1,
                countTo: 44,
            })
        })

        test("should calculate countdown for 2 Thon", () => {
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/t3K2t w 1")
            const result = calculatePiecePowerCountdown(state, Color.WHITE)
            expect(result).toEqual({
                countFrom: 1,
                countTo: 22,
            })
        })

        test("should calculate countdown for 1 Ma", () => {
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/4K2m w 1")
            const result = calculatePiecePowerCountdown(state, Color.WHITE)
            expect(result).toEqual({
                countFrom: 1,
                countTo: 64,
            })
        })

        test("should calculate countdown for 2 Ma", () => {
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/m3K2m w 1")
            const result = calculatePiecePowerCountdown(state, Color.WHITE)
            expect(result).toEqual({
                countFrom: 1,
                countTo: 32,
            })
        })

        test("should calculate countdown for other pieces (Met)", () => {
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/4K2e w 1")
            const result = calculatePiecePowerCountdown(state, Color.WHITE)
            expect(result).toEqual({
                countFrom: 1,
                countTo: 64,
            })
        })
    })

    describe("calculateBoardPowerCountdown", () => {
        test("should return null when active player has only Khun", () => {
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/4K3 w 1")
            expect(calculateBoardPowerCountdown(state, Color.WHITE)).toBeNull()
        })

        test("should return null when there are Bia on board", () => {
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/3B4/4KR2 w 1")
            expect(calculateBoardPowerCountdown(state, Color.WHITE)).toBeNull()
        })

        test("should calculate countdown when active player has more than Khun", () => {
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/4KR2 w 1")
            const result = calculateBoardPowerCountdown(state, Color.WHITE)
            expect(result).toEqual({
                countFrom: 3,
                countTo: 64,
            })
        })

        test("should count all pieces on board", () => {
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/rmt1KRM1 w 1")
            const result = calculateBoardPowerCountdown(state, Color.WHITE)
            expect(result).toEqual({
                countFrom: 7,
                countTo: 64,
            })
        })
    })

    describe("calculateCountdown", () => {
        test("should return null when neither countdown condition met", () => {
            const { board: state } = createGameFromFen("rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1")
            expect(calculateCountdown(state, Color.WHITE)).toBeNull()
        })

        test("should prioritize piece power countdown", () => {
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            const result = calculateCountdown(state, Color.WHITE)
            expect(result).toEqual({
                countColor: Color.WHITE,
                countType: CountType.PIECE_POWER_COUNTDOWN,
                count: 1,
                countFrom: 1,
                countTo: 16,
            })
        })

        test("should return board power countdown when piece power not available", () => {
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/4KR2 w 1")
            const result = calculateCountdown(state, Color.WHITE)
            expect(result).toEqual({
                countColor: Color.WHITE,
                countType: CountType.BOARD_POWER_COUNTDOWN,
                count: 3,
                countFrom: 3,
                countTo: 64,
            })
        })

        test("should set correct countColor for black", () => {
            const { board: state } = createGameFromFen("4k2R/8/8/8/8/8/8/4K3 b 1")
            const result = calculateCountdown(state, Color.BLACK)
            expect(result?.countColor).toBe(Color.BLACK)
        })
    })

    describe("hasStartCountdownFlag", () => {
        test("should return false for empty flags", () => {
            expect(hasStartCountdownFlag({})).toBe(false)
        })

        test("should return false for undefined flags", () => {
            expect(hasStartCountdownFlag()).toBe(false)
        })

        test("should return true for startPiecePowerCountdown", () => {
            expect(hasStartCountdownFlag({ startPiecePowerCountdown: true })).toBe(true)
        })

        test("should return false when startPiecePowerCountdown is false", () => {
            expect(hasStartCountdownFlag({ startPiecePowerCountdown: false })).toBe(false)
        })

        test("should return true for startBoardPowerCountdown", () => {
            expect(hasStartCountdownFlag({ startBoardPowerCountdown: true })).toBe(true)
        })

        test("should return false when startBoardPowerCountdown is false", () => {
            expect(hasStartCountdownFlag({ startBoardPowerCountdown: false })).toBe(false)
        })

        test("should return true for startCountdown", () => {
            expect(hasStartCountdownFlag({ startCountdown: true })).toBe(true)
        })

        test("should return false when startCountdown is false", () => {
            expect(hasStartCountdownFlag({ startCountdown: false })).toBe(false)
        })

        test("should return false for stop flags only", () => {
            expect(hasStartCountdownFlag({ stopCountdown: true })).toBe(false)
        })
    })

    describe("hasStopCountdownFlag", () => {
        test("should return false for empty flags", () => {
            expect(hasStopCountdownFlag({})).toBe(false)
        })

        test("should return false for undefined flags", () => {
            expect(hasStopCountdownFlag()).toBe(false)
        })

        test("should return true for stopPiecePowerCountdown", () => {
            expect(hasStopCountdownFlag({ stopPiecePowerCountdown: true })).toBe(true)
        })

        test("should return false when stopPiecePowerCountdown is false", () => {
            expect(hasStopCountdownFlag({ stopPiecePowerCountdown: false })).toBe(false)
        })

        test("should return true for stopBoardPowerCountdown", () => {
            expect(hasStopCountdownFlag({ stopBoardPowerCountdown: true })).toBe(true)
        })

        test("should return false when stopBoardPowerCountdown is false", () => {
            expect(hasStopCountdownFlag({ stopBoardPowerCountdown: false })).toBe(false)
        })

        test("should return true for stopCountdown", () => {
            expect(hasStopCountdownFlag({ stopCountdown: true })).toBe(true)
        })

        test("should return false when stopCountdown is false", () => {
            expect(hasStopCountdownFlag({ stopCountdown: false })).toBe(false)
        })

        test("should return false for start flags only", () => {
            expect(hasStopCountdownFlag({ startCountdown: true })).toBe(false)
        })
    })

    describe("hasCountdownFlag", () => {
        test("should return false for empty flags", () => {
            expect(hasCountdownFlag({})).toBe(false)
        })

        test("should return false for undefined flags", () => {
            expect(hasCountdownFlag()).toBe(false)
        })

        test("should return true for start flags", () => {
            expect(hasCountdownFlag({ startCountdown: true })).toBe(true)
        })

        test("should return true for stop flags", () => {
            expect(hasCountdownFlag({ stopCountdown: true })).toBe(true)
        })

        test("should return true for both", () => {
            expect(hasCountdownFlag({ startCountdown: true, stopCountdown: true })).toBe(true)
        })

        test("should return false when all flags are false", () => {
            expect(hasCountdownFlag({
                startPiecePowerCountdown: false,
                startBoardPowerCountdown: false,
                startCountdown: false,
                stopPiecePowerCountdown: false,
                stopBoardPowerCountdown: false,
                stopCountdown: false
            })).toBe(false)
        })
    })

    describe("stepCountdown", () => {
        test("should throw error when trying to stop non-existent countdown", () => {
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            expect(() => {
                stepCountdown(state, Color.WHITE, null, { stopCountdown: true })
            }).toThrow()
        })

        test("should throw error when trying to start already-counting countdown", () => {
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            const countdown = calculateCountdown(state, Color.WHITE)
            expect(() => {
                stepCountdown(state, Color.WHITE, countdown, { startCountdown: true })
            }).toThrow()
        })

        test("should start piece power countdown with correct flag", () => {
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            const result = stepCountdown(state, Color.WHITE, null, { startPiecePowerCountdown: true })
            expect(result).toEqual({
                countColor: Color.WHITE,
                countType: CountType.PIECE_POWER_COUNTDOWN,
                count: 1,
                countFrom: 1,
                countTo: 16,
            })
        })

        test("should start board power countdown with correct flag", () => {
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/4KR2 w 1")
            const result = stepCountdown(state, Color.WHITE, null, { startBoardPowerCountdown: true })
            expect(result).toEqual({
                countColor: Color.WHITE,
                countType: CountType.BOARD_POWER_COUNTDOWN,
                count: 3,
                countFrom: 3,
                countTo: 64,
            })
        })

        test("should increment count when continuing same countdown type", () => {
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            const countdown = calculateCountdown(state, Color.WHITE)
            const result = stepCountdown(state, Color.WHITE, countdown, {})

            expect(result?.count).toBe(2)
        })

        test("should stop countdown with correct flag", () => {
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            const countdown = calculateCountdown(state, Color.WHITE)
            const result = stepCountdown(state, Color.WHITE, countdown, { stopPiecePowerCountdown: true })

            expect(result).toBeNull()
        })

        test("should transition from board power to piece power countdown", () => {
            // Start with board power countdown position
            const { board: state1 } = createGameFromFen("4k3/8/8/8/8/8/8/4KR2 w 1")
            const countdown1 = calculateCountdown(state1, Color.WHITE)
            expect(countdown1?.countType).toBe(CountType.BOARD_POWER_COUNTDOWN)

            // Simulate capturing the rook, now only Khun vs Khun+pieces
            const { board: state2 } = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            const result = stepCountdown(state2, Color.WHITE, countdown1, {})

            expect(result?.countType).toBe(CountType.PIECE_POWER_COUNTDOWN)
            expect(result?.count).toBe(1)
        })

        test("should return null when no countdown available and no flags", () => {
            // Position with Bia on board - no countdown possible
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/3B4/4K3 w 1")
            const result = stepCountdown(state, Color.WHITE, null, {})

            expect(result).toBeNull()
        })

        test("should throw WRONG_COUNTDOWN_TYPE when trying to start piece power but only board power available", () => {
            // Position where only board power countdown is available (not just Khun)
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/4KR2 w 1")

            expect(() => {
                stepCountdown(state, Color.WHITE, null, { startPiecePowerCountdown: true })
            }).toThrow()
        })

        test("should throw WRONG_COUNTDOWN_TYPE when trying to start board power but only piece power available", () => {
            // Position where only piece power countdown is available (just Khun)
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")

            expect(() => {
                stepCountdown(state, Color.WHITE, null, { startBoardPowerCountdown: true })
            }).toThrow()
        })

        test("should return null when starting countdown without valid flags", () => {
            // Position where countdown is possible but no start flags given
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            const result = stepCountdown(state, Color.WHITE, null, {})

            expect(result).toBeNull()
        })

        test("should throw WRONG_STOP_COUNTDOWN_FLAG when stopping with wrong flag type", () => {
            // Start piece power countdown
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            const countdown = calculateCountdown(state, Color.WHITE)
            expect(countdown?.countType).toBe(CountType.PIECE_POWER_COUNTDOWN)

            // Try to stop with board power flag
            expect(() => {
                stepCountdown(state, Color.WHITE, countdown, { stopBoardPowerCountdown: true })
            }).toThrow()
        })

        test("should return unchanged countdown when color doesn't match", () => {
            // White's countdown
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            const countdown = calculateCountdown(state, Color.WHITE)
            expect(countdown?.countColor).toBe(Color.WHITE)

            // Try to step with black's turn
            const result = stepCountdown(state, Color.BLACK, countdown, {})

            // Should return unchanged countdown
            expect(result).toEqual(countdown)
        })

        test("should work without flags parameter (default empty flags)", () => {
            // Position with countdown available
            const { board: state } = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")

            // Call without flags parameter to test default parameter
            const result = stepCountdown(state, Color.WHITE, null)

            // Should return null since no flags to start countdown
            expect(result).toBeNull()
        })
    })

    describe("isCountdownExpired", () => {
        test("should return false for null countdown", () => {
            expect(isCountdownExpired(null)).toBe(false)
        })

        test("should return false when count < countTo", () => {
            const countdown = {
                countColor: Color.WHITE,
                countType: CountType.PIECE_POWER_COUNTDOWN,
                count: 5,
                countFrom: 1,
                countTo: 16,
            }
            expect(isCountdownExpired(countdown)).toBe(false)
        })

        test("should return true when count >= countTo", () => {
            const countdown = {
                countColor: Color.WHITE,
                countType: CountType.PIECE_POWER_COUNTDOWN,
                count: 16,
                countFrom: 1,
                countTo: 16,
            }
            expect(isCountdownExpired(countdown)).toBe(true)
        })

        test("should return true when count > countTo", () => {
            const countdown = {
                countColor: Color.WHITE,
                countType: CountType.PIECE_POWER_COUNTDOWN,
                count: 20,
                countFrom: 1,
                countTo: 16,
            }
            expect(isCountdownExpired(countdown)).toBe(true)
        })
    })
})
