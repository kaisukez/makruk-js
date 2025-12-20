/**
 * Common FEN parsing and validation
 * Reusable between 0x88 and bitboard implementations
 */

import { Color, CountType } from "common/const"
import type { Countdown } from "common/types"

export type FenInfo = {
    boardString: string
    turn: Color
    moveNumber: number
    countdown: Countdown | null
}

export function parseFen(fen: string): FenInfo {
    const length = fen.split(" ").length
    if (length !== 3 && length !== 8) {
        throw {
            code: "WRONG_NUMBER_OF_INPUTS",
            message: "fen must be string with 3 or 8 fields separated by space",
            field: "fen",
            fieldNumber: -1,
        }
    }

    const regex =
        /^(?<boardString>\S+)\s+(?<activeColor>\S+)\s+(?<moveNumber>\S+)(\s+(?<countColor>\S+)\s+(?<countType>\S+)\s+(?<count>\S+)\s+(?<countFrom>\S+)\s+(?<countTo>\S+))?$/
    const result = fen.trim().match(regex)

    if (!result) {
        throw {
            code: "WRONG_FEN_FORMAT",
            message: "wrong fen format",
            field: "fen",
            fieldNumber: -1,
        }
    }

    const parsed = { ...result.groups }
    const {
        boardString,
        activeColor,
        moveNumber,
        countColor,
        countType,
        count,
        countFrom,
        countTo,
    } = parsed

    /* ------------------------- boardString ------------------------- */
    if (/[^bfmterkBFMTERK1-8/]/.test(boardString)) {
        throw {
            code: "WRONG_BOARD_STRING_CHARACTER",
            message: `boardString can only contains 'bfmterkBFMTERK12345678/'`,
            field: "boardString",
            fieldNumber: 1,
        }
    }

    if (!/^[bfmterkBFMTERK1-8]+(\/[bfmterkBFMTERK1-8]+){7}$/.test(boardString)) {
        throw {
            code: "WRONG_BOARD_STRING_NUMBER_OF_RANKS",
            message: `boardString must contain 8 ranks separated by '/'`,
            field: "boardString",
            fieldNumber: 1,
        }
    }

    if (/[1-8]{2,}/.test(boardString)) {
        throw {
            code: "WRONG_BOARD_STRING_NUMBER_NEXT_TO_EACH_OTHER",
            message:
                "boardString must not have any connected number like this /bb6/71/... (7 and 1)",
            field: "boardString",
            fieldNumber: 1,
        }
    }

    const squareCount = boardString
        .replace(/\//g, "")
        .split("")
        .reduce((count, character) => {
            if (/[1-8]/.test(character)) {
                return count + parseInt(character, 10)
            }
            return count + 1
        }, 0)
    if (squareCount !== 64) {
        throw {
            code: "WRONG_BOARD_STRING_NUMBER_OF_SQUARES",
            message: "total of squares boardString represented must be 64",
            field: "boardString",
            fieldNumber: 1,
        }
    }

    let squaresPerRow = 0
    for (const row of boardString.split("/")) {
        squaresPerRow = 0
        for (const character of row) {
            if (/\d/.test(character)) {
                squaresPerRow += parseInt(character, 10)
            } else {
                squaresPerRow += 1
            }
        }
        if (squaresPerRow !== 8) {
            throw {
                code: "WRONG_BOARD_STRING_NUMBER_OF_SQUARES_PER_RANK",
                message: "number of squares per rank must be 8",
                field: "boardString",
                fieldNumber: 1,
            }
        }
    }

    const [whiteKhunCount, blackKhunCount] = boardString
        .replace(/\//g, "")
        .split("")
        .reduce(
            (count, character) => {
                if (character === "K") {
                    return [count[0] + 1, count[1]]
                }
                if (character === "k") {
                    return [count[0], count[1] + 1]
                }
                return count
            },
            [0, 0],
        )
    if (whiteKhunCount !== 1 || blackKhunCount !== 1) {
        throw {
            code: "WRONG_BOARD_STRING_NUMBER_OF_KHUNS",
            message: "number of khun must be 1 for each side",
            field: "boardString",
            fieldNumber: 1,
        }
    }

    /* ------------------------- activeColor ------------------------- */
    if (activeColor !== Color.WHITE && activeColor !== Color.BLACK) {
        throw {
            code: "WRONG_ACTIVE_COLOR",
            message: `activeColor can be either 'w' or 'b' (white or black)`,
            field: "activeColor",
            fieldNumber: 2,
        }
    }

    /* ------------------------- moveNumber ------------------------- */
    if (!/^[1-9]\d*$/.test(moveNumber)) {
        throw {
            code: "WRONG_MOVE_NUMBER",
            message: "moveNumber must be number (positive number with no 0 in front)",
            field: "moveNumber",
            fieldNumber: 3,
        }
    }

    /* ------------------------- countdown ------------------------- */
    if (
        !(
            (countColor === "-" &&
                countType === "-" &&
                count === "-" &&
                countFrom === "-" &&
                countTo === "-") ||
            (countColor !== "-" &&
                countType !== "-" &&
                count !== "-" &&
                countFrom !== "-" &&
                countTo !== "-")
        )
    ) {
        throw {
            code: "WRONG_COUNTDOWN",
            message: `countColor, countType and count can be '-' at the same time or can be something else at the same time`,
            field: "countdown",
            fieldNumber: -1,
        }
    }

    if (countColor && countColor !== "-" && countColor !== Color.WHITE && countColor !== Color.BLACK) {
        throw {
            code: "WRONG_COUNT_COLOR",
            message: `countColor can be either 'w' or 'b' (white or black)`,
            field: "countColor",
            fieldNumber: 4,
        }
    }

    if (countType && countType !== "-" && countType !== "bp" && countType !== "pp") {
        throw {
            code: "WRONG_COUNT_TYPE",
            message: `countType can be either 'bp' or 'pp' (board power or piece power)`,
            field: "countType",
            fieldNumber: 5,
        }
    }

    if (count && count !== "-" && !/^[1-9]\d*$/.test(count)) {
        throw {
            code: "WRONG_COUNT_NUMBER",
            message:
                "countNumber must be number (positive number with no 0 in front)",
            field: "countNumber",
            fieldNumber: 6,
        }
    }

    if (countFrom && countFrom !== "-" && !/^[1-9]\d*$/.test(countFrom)) {
        throw {
            code: "WRONG_COUNT_FROM_NUMBER",
            message: "countFrom must be number (positive number with no 0 in front)",
            field: "countFrom",
            fieldNumber: 7,
        }
    }

    if (countTo && countTo !== "-" && !/^[1-9]\d*$/.test(countTo)) {
        throw {
            code: "WRONG_COUNT_TO_NUMBER",
            message: "countTo must be number (positive number with no 0 in front)",
            field: "countTo",
            fieldNumber: 8,
        }
    }

    // Create countdown object if all countdown fields are present and not "-"
    let countdown: Countdown | null = null
    if (countColor && countColor !== "-" &&
        countType && countType !== "-" &&
        count && count !== "-" &&
        countFrom && countFrom !== "-" &&
        countTo && countTo !== "-") {
        countdown = {
            countColor: countColor === 'w' ? Color.WHITE : Color.BLACK,
            countType: countType === 'bp' ? CountType.BOARD_POWER_COUNTDOWN : CountType.PIECE_POWER_COUNTDOWN,
            count: parseInt(count, 10),
            countFrom: parseInt(countFrom, 10),
            countTo: parseInt(countTo, 10),
        }
    }

    return {
        boardString: boardString!,
        turn: activeColor === 'w' ? Color.WHITE : Color.BLACK,
        moveNumber: parseInt(moveNumber!, 10),
        countdown,
    }
}
