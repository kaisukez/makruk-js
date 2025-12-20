/**
 * Makruk countdown rules for bitboard representation
 */

import { Color, CountType, Piece } from "common/const"
import { Board } from "bitboard/board/board"
import { popCount, getPieceMask64 } from "bitboard/board/board"

export type { Countdown } from "common/fen"
import type { Countdown } from "common/fen"

export const CountdownErrorCode = {
    CANNOT_STOP_UNCOUNTED_STATE: 'CANNOT_STOP_UNCOUNTED_STATE',
    CANNOT_START_ALREADY_COUNTED_STATE: 'CANNOT_START_ALREADY_COUNTED_STATE',
    WRONG_COUNTDOWN_TYPE: 'WRONG_COUNTDOWN_TYPE',
    WRONG_STOP_COUNTDOWN_FLAG: 'WRONG_STOP_COUNTDOWN_FLAG',
} as const

export type CountdownFlag = {
    startPiecePowerCountdown?: boolean
    startBoardPowerCountdown?: boolean
    startCountdown?: boolean
    stopPiecePowerCountdown?: boolean
    stopBoardPowerCountdown?: boolean
    stopCountdown?: boolean
}

export type StepCountdownFlags = CountdownFlag

export type PieceCount = {
    all: number
    color: Record<Color, number>
    piece: Record<Piece, number>
    [Color.WHITE]: Record<Piece, number>
    [Color.BLACK]: Record<Piece, number>
}

/**
 * Count all pieces on the board from bitboards
 */
export function countPiecesFromMask64(state: Board): PieceCount {
    const pieceCount: PieceCount = {
        all: 0,
        color: {
            [Color.WHITE]: 0,
            [Color.BLACK]: 0,
        },
        piece: {
            [Piece.BIA]: 0,
            [Piece.FLIPPED_BIA]: 0,
            [Piece.MA]: 0,
            [Piece.THON]: 0,
            [Piece.MET]: 0,
            [Piece.RUA]: 0,
            [Piece.KHUN]: 0,
        },
        [Color.WHITE]: {
            [Piece.BIA]: 0,
            [Piece.FLIPPED_BIA]: 0,
            [Piece.MA]: 0,
            [Piece.THON]: 0,
            [Piece.MET]: 0,
            [Piece.RUA]: 0,
            [Piece.KHUN]: 0,
        },
        [Color.BLACK]: {
            [Piece.BIA]: 0,
            [Piece.FLIPPED_BIA]: 0,
            [Piece.MA]: 0,
            [Piece.THON]: 0,
            [Piece.MET]: 0,
            [Piece.RUA]: 0,
            [Piece.KHUN]: 0,
        },
    }

    // Count each piece type for each color
    for (const color of [Color.WHITE, Color.BLACK]) {
        for (const piece of Object.values(Piece)) {
            const bb = getPieceMask64(state, color, piece)
            const count = popCount(bb)

            pieceCount[color][piece] = count
            pieceCount.color[color] += count
            pieceCount.piece[piece] += count
            pieceCount.all += count
        }
    }

    return pieceCount
}

function swapColor(color: Color): Color {
    return color === Color.WHITE ? Color.BLACK : Color.WHITE
}

/**
 * Calculate piece power countdown
 * Activates when player only has Khun left and there are no Bia on the board
 */
export function calculatePiecePowerCountdown(
    state: Board,
    turn: Color
): { countFrom: number; countTo: number } | null {
    const pieceCount = countPiecesFromMask64(state)

    // to activate piece power countdown
    // one must only have Khun left and there must be no Bia left on the board
    if (
        pieceCount.color[turn] !== 1 ||
        pieceCount.piece[Piece.BIA] !== 0
    ) {
        return null
    }

    const opponentColor = swapColor(turn)
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

/**
 * Calculate board power countdown
 * Activates when player has more than 1 piece and there are no Bia on the board
 */
export function calculateBoardPowerCountdown(
    state: Board,
    turn: Color
): { countFrom: number; countTo: number } | null {
    const pieceCount = countPiecesFromMask64(state)

    // to activate board power countdown
    // one must have more than 1 piece (including Khun)
    // and there must be no Bia left on the board
    if (
        pieceCount.color[turn] === 1 ||
        pieceCount.piece[Piece.BIA] !== 0
    ) {
        return null
    }

    return {
        countFrom: pieceCount.all,
        countTo: 64,
    }
}

/**
 * Calculate countdown for the current position
 */
export function calculateCountdown(
    state: Board,
    turn: Color
): Countdown | null {
    const piecePowerCountdown = calculatePiecePowerCountdown(state, turn)
    const boardPowerCountdown = calculateBoardPowerCountdown(state, turn)

    if (piecePowerCountdown) {
        return {
            countColor: turn,
            countType: CountType.PIECE_POWER_COUNTDOWN,
            count: piecePowerCountdown.countFrom,
            ...piecePowerCountdown,
        }
    }

    if (boardPowerCountdown) {
        return {
            countColor: turn,
            countType: CountType.BOARD_POWER_COUNTDOWN,
            count: boardPowerCountdown.countFrom,
            ...boardPowerCountdown,
        }
    }

    return null
}

export function hasStartCountdownFlag(flags: CountdownFlag = {}): boolean {
    return (
        flags.startPiecePowerCountdown === true ||
        flags.startBoardPowerCountdown === true ||
        flags.startCountdown === true
    )
}

export function hasStopCountdownFlag(flags: CountdownFlag = {}): boolean {
    return (
        flags.stopPiecePowerCountdown === true ||
        flags.stopBoardPowerCountdown === true ||
        flags.stopCountdown === true
    )
}

export function hasCountdownFlag(flags: CountdownFlag = {}): boolean {
    return hasStartCountdownFlag(flags) || hasStopCountdownFlag(flags)
}

/**
 * Step countdown - updates countdown state based on flags and position
 * This function mutates the countdown parameter
 */
export function stepCountdown(
    state: Board,
    turn: Color,
    countdown: Countdown | null,
    flags: StepCountdownFlags = {}
): Countdown | null {
    const {
        startPiecePowerCountdown,
        startBoardPowerCountdown,
        startCountdown,
        stopPiecePowerCountdown,
        stopBoardPowerCountdown,
        stopCountdown,
    } = flags

    // if we didn't count yet but you give countdown flag then throw error
    if (!countdown && hasStopCountdownFlag(flags)) {
        throw { code: CountdownErrorCode.CANNOT_STOP_UNCOUNTED_STATE }
    }

    // if we already count but you give countdown flag again then throw error
    if (countdown && hasStartCountdownFlag(flags)) {
        throw { code: CountdownErrorCode.CANNOT_START_ALREADY_COUNTED_STATE }
    }

    const newCountdown = calculateCountdown(state, turn)

    // if there's no countdown then return null
    if (!newCountdown) {
        return null
    }

    // if we didn't count yet and we give countdown flag
    // then start counting if countdown flag is valid
    if (!countdown) {
        if (
            (startPiecePowerCountdown &&
                newCountdown.countType === CountType.PIECE_POWER_COUNTDOWN) ||
            (startBoardPowerCountdown &&
                newCountdown.countType === CountType.BOARD_POWER_COUNTDOWN) ||
            startCountdown
        ) {
            return newCountdown
        } else if (hasStartCountdownFlag(flags)) {
            throw { code: CountdownErrorCode.WRONG_COUNTDOWN_TYPE }
        }
        return null
    }

    // if we already count
    else {
        // if we give stop countdown flag
        if (hasStopCountdownFlag(flags)) {
            if (
                (stopPiecePowerCountdown &&
                    countdown.countType === CountType.PIECE_POWER_COUNTDOWN) ||
                (stopBoardPowerCountdown &&
                    countdown.countType === CountType.BOARD_POWER_COUNTDOWN) ||
                stopCountdown
            ) {
                return null
            } else {
                throw { code: CountdownErrorCode.WRONG_STOP_COUNTDOWN_FLAG }
            }
        }

        // continue counting the same type
        else if (
            countdown.countType === newCountdown.countType &&
            turn === countdown.countColor
        ) {
            return {
                ...countdown,
                count: countdown.count + 1,
            }
        }

        // continue counting different type only if we change from
        // board power countdown to piece power countdown
        else if (
            countdown.countType === CountType.BOARD_POWER_COUNTDOWN &&
            newCountdown.countType === CountType.PIECE_POWER_COUNTDOWN
        ) {
            return newCountdown
        }

        return countdown
    }
}

/**
 * Check if countdown has expired (reached countTo)
 */
export function isCountdownExpired(countdown: Countdown | null): boolean {
    if (!countdown) return false
    return countdown.count >= countdown.countTo
}
