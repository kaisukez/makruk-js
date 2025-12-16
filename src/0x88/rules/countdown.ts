import { Draft } from "immer"

import { CountType, Piece } from "common/const"
import { countPiece } from "0x88/board/pieces"
import { Countdown, State } from "0x88/types"
import { swapColor } from "0x88/utils/board-utils"

export type CountdownFlag = {
    startPiecePowerCountdown?: boolean;
    startBoardPowerCountdown?: boolean;
    startCountdown?: boolean;
    stopPiecePowerCountdown?: boolean;
    stopBoardPowerCountdown?: boolean;
    stopCountdown?: boolean;
};

export type StepCountdownFlags = {
    startPiecePowerCountdown?: boolean;
    startBoardPowerCountdown?: boolean;
    startCountdown?: boolean;
    stopPiecePowerCountdown?: boolean;
    stopBoardPowerCountdown?: boolean;
    stopCountdown?: boolean;
};

export function calculatePiecePowerCountdown(state: State) {
    const pieceCount = countPiece(state.piecePositions)

    // to activate piece power countdown
    // one must only have Khun left and there must be no Bia left on the board
    if (
        pieceCount.color[state.activeColor] !== 1 ||
        pieceCount.piece[Piece.BIA] !== 0
    ) {
        return null
    }

    const opponentColor = swapColor(state.activeColor)
    const opponentPieceCount = pieceCount[opponentColor]
    if ([1, 2].includes(opponentPieceCount[Piece.RUA])) {
        return {
            countFrom: 1,
            countTo: 16 / opponentPieceCount[Piece.RUA],
        }
    }

    if ([1, 2].includes(opponentPieceCount[Piece.THON])) {
        return {
            countFrom: 1,
            countTo: 44 / opponentPieceCount[Piece.THON],
        }
    }

    if ([1, 2].includes(opponentPieceCount[Piece.MA])) {
        return {
            countFrom: 1,
            countTo: 64 / opponentPieceCount[Piece.MA],
        }
    }

    return {
        countFrom: 1,
        countTo: 64,
    }
}

export function calculateBoardPowerCountdown(state: State) {
    const pieceCount = countPiece(state.piecePositions)

    // to activate board power countdown
    // one must have more than 1 piece (including Khun)
    // and there must be no Bia left on the board
    if (
        pieceCount.color[state.activeColor] === 1 ||
        pieceCount.piece[Piece.BIA] !== 0
    ) {
        return null
    }

    return {
        countFrom: pieceCount.all,
        countTo: 64,
    }
}

export function calculateCountdown(state: State): Countdown | null {
    const piecePowerCountdown = calculatePiecePowerCountdown(state)
    const boardPowerCountdown = calculateBoardPowerCountdown(state)

    if (piecePowerCountdown) {
        return {
            // fromMove: state.moveNumber,
            countColor: state.activeColor, // which side want to count
            countType: CountType.PIECE_POWER_COUNTDOWN, // count type
            count: piecePowerCountdown.countFrom, // current count
            ...piecePowerCountdown,
        }
    }

    if (boardPowerCountdown) {
        return {
            // fromMove: state.moveNumber,
            countColor: state.activeColor,
            countType: CountType.BOARD_POWER_COUNTDOWN,
            count: boardPowerCountdown.countFrom,
            ...boardPowerCountdown,
        }
    }

    return null
}

export function hasStartCountdownFlag(flags: CountdownFlag = {}) {
    return (
        flags.startPiecePowerCountdown ||
        flags.startBoardPowerCountdown ||
        flags.startCountdown
    )
}

export function hasStopCountdownFlag(flags: CountdownFlag = {}) {
    return (
        flags.stopPiecePowerCountdown ||
        flags.stopBoardPowerCountdown ||
        flags.stopCountdown
    )
}

export function hasCountdownFlag(flags: CountdownFlag = {}) {
    return hasStartCountdownFlag(flags) || hasStopCountdownFlag(flags)
}

export function stepCountdown(state: State, flags: StepCountdownFlags = {}) {
    const {
        startPiecePowerCountdown,
        startBoardPowerCountdown,
        startCountdown,

        stopPiecePowerCountdown,
        stopBoardPowerCountdown,
        stopCountdown,
    } = flags

    // if there's no countdown flag then return the same state
    // if (!anyCountdownFlag(flags)) {
    //     return state
    // }

    // if we didn't count yet but you give coundown flag then throw error
    if (!state.countdown && hasStopCountdownFlag(flags)) {
        throw { code: "CANNOT_STOP_UNCOUNTED_STATE" }
    }

    // if we already count but you give coundown flag again then throw error
    if (state.countdown && hasStartCountdownFlag(flags)) {
        throw { code: "CANNOT_START_ALREADY_COUNTED_STATE" }
    }

    const countdown = calculateCountdown(state)

    // if there's no countdown then return the same state (TODO: check if this statement is valid)
    if (!countdown) {
        return state
    }

    // if we didn't count yet and we give countdown flag
    // then start counting if countdown flag is valid
    if (!state.countdown) {
        if (
            (startPiecePowerCountdown &&
                countdown.countType === CountType.PIECE_POWER_COUNTDOWN) ||
            (startBoardPowerCountdown &&
                countdown.countType === CountType.BOARD_POWER_COUNTDOWN) ||
            startCountdown
        ) {
            state.countdown = countdown
        } else if (hasStartCountdownFlag(flags)) {
            // console.log(flags, state.countdown)
            throw { code: "WRONG_COUNTDOWN_TYPE" }
        }
    }

    // if we alrealdy count
    else {
        // if we give stop countdown flag
        if (hasStopCountdownFlag(flags)) {
            if (
                (stopPiecePowerCountdown &&
                    state.countdown.countType === CountType.PIECE_POWER_COUNTDOWN) ||
                (stopBoardPowerCountdown &&
                    state.countdown.countType === CountType.BOARD_POWER_COUNTDOWN) ||
                stopCountdown
            ) {
                // state.countdownHistory.push(state.countdown)
                state.countdown = null
            } else {
                throw { code: "WRONG_STOP_COUNTDOWN_FLAG" }
            }
        }

        // continue counting the same type
        else if (
            state.countdown.countType === countdown.countType &&
            state.activeColor === state.countdown.countColor
        ) {
            state.countdown.count++
        }

            // continue counting different type only if we change from
        // board power countdown to piece power countdown
        else if (
            state.countdown.countType === CountType.BOARD_POWER_COUNTDOWN &&
            countdown.countType === CountType.PIECE_POWER_COUNTDOWN
        ) {
            state.countdown = countdown
        }
    }
}

/**
 * Helper function to apply countdown updates inside an Immer draft
 * This is used within produceState() calls
 */
export function applyStepCountdown(draft: Draft<State>, flags: StepCountdownFlags = {}) {
    const {
        startPiecePowerCountdown,
        startBoardPowerCountdown,
        startCountdown,
        stopPiecePowerCountdown,
        stopBoardPowerCountdown,
        stopCountdown,
    } = flags

    if (!draft.countdown && hasStopCountdownFlag(flags)) {
        throw { code: "CANNOT_STOP_UNCOUNTED_STATE" }
    }

    if (draft.countdown && hasStartCountdownFlag(flags)) {
        throw { code: "CANNOT_START_ALREADY_COUNTED_STATE" }
    }

    const countdown = calculateCountdown(draft as State)

    if (!countdown) {
        return
    }

    if (!draft.countdown) {
        if (
            (startPiecePowerCountdown &&
                countdown.countType === CountType.PIECE_POWER_COUNTDOWN) ||
            (startBoardPowerCountdown &&
                countdown.countType === CountType.BOARD_POWER_COUNTDOWN) ||
            startCountdown
        ) {
            draft.countdown = countdown
        } else if (hasStartCountdownFlag(flags)) {
            throw { code: "WRONG_COUNTDOWN_TYPE" }
        }
    } else {
        if (hasStopCountdownFlag(flags)) {
            if (
                (stopPiecePowerCountdown &&
                    draft.countdown.countType === CountType.PIECE_POWER_COUNTDOWN) ||
                (stopBoardPowerCountdown &&
                    draft.countdown.countType === CountType.BOARD_POWER_COUNTDOWN) ||
                stopCountdown
            ) {
                draft.countdown = null
            } else {
                throw { code: "WRONG_STOP_COUNTDOWN_FLAG" }
            }
        } else if (
            draft.countdown.countType === countdown.countType &&
            draft.activeColor === draft.countdown.countColor
        ) {
            draft.countdown.count++
        } else if (
            draft.countdown.countType === CountType.BOARD_POWER_COUNTDOWN &&
            countdown.countType === CountType.PIECE_POWER_COUNTDOWN
        ) {
            draft.countdown = countdown
        }
    }
}
