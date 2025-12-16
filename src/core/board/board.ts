import { Color, Piece, SquareIndex } from "config"
import { State } from "core/types"
import { produceState } from "utils/immer-helpers"

import type { SquareData } from "core/types"

export function getBoardStateFromBoardString(boardString: string) {
    const boardState = Array(128).fill(null)
    let i = 0
    for (const symbol of boardString.split("/").reverse().join("/")) {
        if (/[bfmterk]/.test(symbol)) {
            // boardState[i] = {
            //     color: BLACK,
            //     piece: symbol.toLowerCase()
            // }
            boardState[i] = [Color.BLACK, symbol.toLowerCase()]
            i++
        } else if (/[BFMTERK]/.test(symbol)) {
            // boardState[i] = {
            //     color: WHITE,
            //     piece: symbol.toLowerCase()
            // }
            boardState[i] = [Color.WHITE, symbol.toLowerCase()]
            i++
        } else if (/\d/.test(symbol)) {
            i += parseInt(symbol, 10)
        } else if (symbol === "/") {
            i += 8
        }
    }

    return boardState
}

export function forEachPieceFromBoardState(
    boardState: State["boardState"],
    func: (squareData: SquareData, squareIndex: SquareIndex) => void,
) {
    for (let i = SquareIndex.a1; i <= SquareIndex.h8; i++) {
        if (i & 0x88) {
            i += 7
            continue
        }

        const squareData = boardState[i]
        if (!squareData) {
            continue
        }

        func(squareData, i)
    }
}

export function put(
    state: State,
    color: Color,
    piece: Piece,
    squareIndex: SquareIndex,
): State {
    return produceState(state, draft => {
        // Remove existing piece if any
        const existingPiece = draft.boardState[squareIndex]
        if (existingPiece) {
            const [existingColor, existingPieceType] = existingPiece
            const positions = draft.piecePositions[existingColor][existingPieceType]
            const idx = positions.indexOf(squareIndex)
            if (idx !== -1) {
                positions.splice(idx, 1)
            }
        }

        // Place new piece
        draft.boardState[squareIndex] = [color, piece]
        if (!draft.piecePositions[color][piece].includes(squareIndex)) {
            draft.piecePositions[color][piece].push(squareIndex)
        }
    })
}

export function remove(state: State, squareIndex: SquareIndex): State {
    return produceState(state, draft => {
        const existingPiece = draft.boardState[squareIndex]
        if (existingPiece) {
            const [color, piece] = existingPiece
            const positions = draft.piecePositions[color][piece]
            const idx = positions.indexOf(squareIndex)
            if (idx !== -1) {
                positions.splice(idx, 1)
            }
        }
        draft.boardState[squareIndex] = null
    })
}
