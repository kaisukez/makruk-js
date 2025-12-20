import { Color, CountType } from "common/const"
import { createGameFromFen } from "0x88/fen/importer"

import { produceState } from "0x88/utils/immer-helpers"
import {
    calculateBoardPowerCountdown,
    calculateCountdown,
    calculatePiecePowerCountdown,
    hasCountdownFlag,
    hasStartCountdownFlag,
    hasStopCountdownFlag,
    stepCountdown,
    applyStepCountdown,
} from "0x88/rules/countdown"

describe("countdown", () => {
    describe("calculatePiecePowerCountdown", () => {
        it("should return null when active player has more than just Khun", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4KR2 w 1")
            expect(calculatePiecePowerCountdown(state)).toBeNull()
        })

        it("should return null when there are Bia on board", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/3B4/4K3 w 1")
            expect(calculatePiecePowerCountdown(state)).toBeNull()
        })

        it("should calculate countdown for 1 Rua", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            const result = calculatePiecePowerCountdown(state)
            expect(result).toEqual({
                countFrom: 1,
                countTo: 16,
            })
        })

        it("should calculate countdown for 2 Rua", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/r3K2r w 1")
            const result = calculatePiecePowerCountdown(state)
            expect(result).toEqual({
                countFrom: 1,
                countTo: 8,
            })
        })

        it("should calculate countdown for 1 Thon", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K2t w 1")
            const result = calculatePiecePowerCountdown(state)
            expect(result).toEqual({
                countFrom: 1,
                countTo: 44,
            })
        })

        it("should calculate countdown for 2 Thon", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/t3K2t w 1")
            const result = calculatePiecePowerCountdown(state)
            expect(result).toEqual({
                countFrom: 1,
                countTo: 22,
            })
        })

        it("should calculate countdown for 1 Ma", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K2m w 1")
            const result = calculatePiecePowerCountdown(state)
            expect(result).toEqual({
                countFrom: 1,
                countTo: 64,
            })
        })

        it("should calculate countdown for 2 Ma", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/m3K2m w 1")
            const result = calculatePiecePowerCountdown(state)
            expect(result).toEqual({
                countFrom: 1,
                countTo: 32,
            })
        })

        it("should calculate countdown for other pieces", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K2e w 1")
            const result = calculatePiecePowerCountdown(state)
            expect(result).toEqual({
                countFrom: 1,
                countTo: 64,
            })
        })
    })

    describe("calculateBoardPowerCountdown", () => {
        it("should return null when active player has only Khun", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K3 w 1")
            expect(calculateBoardPowerCountdown(state)).toBeNull()
        })

        it("should return null when there are Bia on board", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/3B4/4KR2 w 1")
            expect(calculateBoardPowerCountdown(state)).toBeNull()
        })

        it("should calculate countdown when active player has more than Khun", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4KR2 w 1")
            const result = calculateBoardPowerCountdown(state)
            expect(result).toEqual({
                countFrom: 3,
                countTo: 64,
            })
        })

        it("should count all pieces on board", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/rmt1KRM1 w 1")
            const result = calculateBoardPowerCountdown(state)
            expect(result).toEqual({
                countFrom: 7,
                countTo: 64,
            })
        })
    })

    describe("calculateCountdown", () => {
        it("should return null when neither countdown condition met", () => {
            const state = createGameFromFen("rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1")
            expect(calculateCountdown(state)).toBeNull()
        })

        it("should prioritize piece power countdown", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
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
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4KR2 w 1")
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
            const state = createGameFromFen("4k2R/8/8/8/8/8/8/4K3 b 1")
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

    describe("stepCountdown (mutation tests)", () => {
        it("should throw when trying to stop countdown that hasn't started", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            expect(() => {
                stepCountdown(state, { stopCountdown: true })
            }).toThrow()
        })

        it("should throw when trying to start already-started countdown", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            stepCountdown(state, { startCountdown: true })
            expect(() => {
                stepCountdown(state, { startCountdown: true })
            }).toThrow()
        })

        it("should return state unchanged when no countdown available", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/3B4/4K3 w 1")
            const before = state.countdown
            stepCountdown(state, {})
            expect(state.countdown).toBe(before)
        })

        it("should start piece power countdown with correct flag", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            stepCountdown(state, { startPiecePowerCountdown: true })

            expect(state.countdown).not.toBeNull()
            expect(state.countdown?.countType).toBe(CountType.PIECE_POWER_COUNTDOWN)
            expect(state.countdown?.countFrom).toBe(1)
            expect(state.countdown?.countTo).toBe(16)
        })

        it("should start board power countdown with correct flag", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4KR2 w 1")
            stepCountdown(state, { startBoardPowerCountdown: true })

            expect(state.countdown).not.toBeNull()
            expect(state.countdown?.countType).toBe(CountType.BOARD_POWER_COUNTDOWN)
        })

        it("should start countdown with generic flag", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            stepCountdown(state, { startCountdown: true })

            expect(state.countdown).not.toBeNull()
        })

        it("should throw WRONG_COUNTDOWN_TYPE when starting with wrong flag type", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4KR2 w 1")
            expect(() => {
                stepCountdown(state, { startPiecePowerCountdown: true })
            }).toThrow()
        })

        it("should not start countdown without flags", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            const before = state.countdown
            stepCountdown(state, {})
            expect(state.countdown).toBe(before)
        })

        it("should increment count when continuing same countdown type", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            stepCountdown(state, { startCountdown: true })
            const initialCount = state.countdown?.count

            stepCountdown(state, {})
            expect(state.countdown?.count).toBe((initialCount ?? 0) + 1)
        })

        it("should stop countdown with stopPiecePowerCountdown flag", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            stepCountdown(state, { startPiecePowerCountdown: true })
            expect(state.countdown).not.toBeNull()

            stepCountdown(state, { stopPiecePowerCountdown: true })
            expect(state.countdown).toBeNull()
        })

        it("should stop countdown with stopBoardPowerCountdown flag", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4KR2 w 1")
            stepCountdown(state, { startBoardPowerCountdown: true })
            expect(state.countdown).not.toBeNull()

            stepCountdown(state, { stopBoardPowerCountdown: true })
            expect(state.countdown).toBeNull()
        })

        it("should stop countdown with generic stopCountdown flag", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            stepCountdown(state, { startCountdown: true })
            expect(state.countdown).not.toBeNull()

            stepCountdown(state, { stopCountdown: true })
            expect(state.countdown).toBeNull()
        })

        it("should throw WRONG_STOP_COUNTDOWN_FLAG when stopping with wrong flag type", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            stepCountdown(state, { startPiecePowerCountdown: true })

            expect(() => {
                stepCountdown(state, { stopBoardPowerCountdown: true })
            }).toThrow()
        })

        it("should transition from board power to piece power countdown", () => {
            // Start with board power position
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4KR2 w 1")
            stepCountdown(state, { startCountdown: true })
            expect(state.countdown?.countType).toBe(CountType.BOARD_POWER_COUNTDOWN)

            // Simulate changing to piece power position (remove rook, white left with only king)
            const state2 = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            state2.countdown = state.countdown
            stepCountdown(state2, {})

            expect(state2.countdown?.countType).toBe(CountType.PIECE_POWER_COUNTDOWN)
        })

        it("should not transition from piece power to board power", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            stepCountdown(state, { startPiecePowerCountdown: true })
            const countdownBefore = { ...state.countdown }

            // Try to transition to board power (shouldn't happen)
            const state2 = createGameFromFen("4k3/8/8/8/8/8/8/4KR2 w 1")
            state2.countdown = state.countdown
            stepCountdown(state2, {})

            // Count should just increment, not change type
            expect(state2.countdown?.countType).toBe(CountType.PIECE_POWER_COUNTDOWN)
        })

        it("should not count when color doesn't match", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            stepCountdown(state, { startCountdown: true })
            const initialCount = state.countdown?.count

            // Change active color
            state.turn = Color.BLACK
            stepCountdown(state, {})

            // Count should not increment
            expect(state.countdown?.count).toBe(initialCount)
        })
    })

    describe("applyStepCountdown (Immer tests)", () => {
        it("should throw when trying to stop countdown that hasn't started", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            expect(() => {
                produceState(state, draft => {
                    applyStepCountdown(draft, { stopCountdown: true })
                })
            }).toThrow()
        })

        it("should throw when trying to start already-started countdown", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            const newState = produceState(state, draft => {
                applyStepCountdown(draft, { startCountdown: true })
            })

            expect(() => {
                produceState(newState, draft => {
                    applyStepCountdown(draft, { startCountdown: true })
                })
            }).toThrow()
        })

        it("should start piece power countdown with correct flag", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            const newState = produceState(state, draft => {
                applyStepCountdown(draft, { startPiecePowerCountdown: true })
            })

            expect(newState.countdown).not.toBeNull()
            expect(newState.countdown?.countType).toBe(CountType.PIECE_POWER_COUNTDOWN)
            expect(newState.countdown?.countFrom).toBe(1)
            expect(newState.countdown?.countTo).toBe(16)
        })

        it("should start board power countdown with correct flag", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4KR2 w 1")
            const newState = produceState(state, draft => {
                applyStepCountdown(draft, { startBoardPowerCountdown: true })
            })

            expect(newState.countdown).not.toBeNull()
            expect(newState.countdown?.countType).toBe(CountType.BOARD_POWER_COUNTDOWN)
        })

        it("should throw WRONG_COUNTDOWN_TYPE when starting with wrong flag type", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4KR2 w 1")
            expect(() => {
                produceState(state, draft => {
                    applyStepCountdown(draft, { startPiecePowerCountdown: true })
                })
            }).toThrow()
        })

        it("should not start countdown without flags", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            const newState = produceState(state, draft => {
                applyStepCountdown(draft, {})
            })
            expect(newState.countdown).toBeNull()
        })

        it("should increment count when continuing same countdown type", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            let newState = produceState(state, draft => {
                applyStepCountdown(draft, { startCountdown: true })
            })
            const initialCount = newState.countdown?.count

            newState = produceState(newState, draft => {
                applyStepCountdown(draft, {})
            })
            expect(newState.countdown?.count).toBe((initialCount ?? 0) + 1)
        })

        it("should stop countdown with stopPiecePowerCountdown flag", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            let newState = produceState(state, draft => {
                applyStepCountdown(draft, { startPiecePowerCountdown: true })
            })
            expect(newState.countdown).not.toBeNull()

            newState = produceState(newState, draft => {
                applyStepCountdown(draft, { stopPiecePowerCountdown: true })
            })
            expect(newState.countdown).toBeNull()
        })

        it("should stop countdown with stopBoardPowerCountdown flag", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4KR2 w 1")
            let newState = produceState(state, draft => {
                applyStepCountdown(draft, { startBoardPowerCountdown: true })
            })
            expect(newState.countdown).not.toBeNull()

            newState = produceState(newState, draft => {
                applyStepCountdown(draft, { stopBoardPowerCountdown: true })
            })
            expect(newState.countdown).toBeNull()
        })

        it("should stop countdown with generic stopCountdown flag", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            let newState = produceState(state, draft => {
                applyStepCountdown(draft, { startCountdown: true })
            })
            expect(newState.countdown).not.toBeNull()

            newState = produceState(newState, draft => {
                applyStepCountdown(draft, { stopCountdown: true })
            })
            expect(newState.countdown).toBeNull()
        })

        it("should throw WRONG_STOP_COUNTDOWN_FLAG when stopping with wrong flag type", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            const newState = produceState(state, draft => {
                applyStepCountdown(draft, { startPiecePowerCountdown: true })
            })

            expect(() => {
                produceState(newState, draft => {
                    applyStepCountdown(draft, { stopBoardPowerCountdown: true })
                })
            }).toThrow()
        })

        it("should transition from board power to piece power countdown", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4KR2 w 1")
            let newState = produceState(state, draft => {
                applyStepCountdown(draft, { startCountdown: true })
            })
            expect(newState.countdown?.countType).toBe(CountType.BOARD_POWER_COUNTDOWN)

            // Simulate changing to piece power position
            const state2 = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            state2.countdown = newState.countdown

            newState = produceState(state2, draft => {
                applyStepCountdown(draft, {})
            })

            expect(newState.countdown?.countType).toBe(CountType.PIECE_POWER_COUNTDOWN)
        })

        it("should not count when color doesn't match", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/8/4K2r w 1")
            let newState = produceState(state, draft => {
                applyStepCountdown(draft, { startCountdown: true })
            })
            const initialCount = newState.countdown?.count

            // Change active color (using produceState)
            newState = produceState(newState, draft => {
                draft.turn = Color.BLACK
            })
            newState = produceState(newState, draft => {
                applyStepCountdown(draft, {})
            })

            // Count should not increment
            expect(newState.countdown?.count).toBe(initialCount)
        })

        it("should return unchanged when no countdown available", () => {
            const state = createGameFromFen("4k3/8/8/8/8/8/3B4/4K3 w 1")
            const newState = produceState(state, draft => {
                applyStepCountdown(draft, {})
            })
            expect(newState.countdown).toBeNull()
        })
    })
})
