import { getBoardStateFromBoardString } from "0x88/board/board"
import { getPiecePositions } from "0x88/board/pieces"
import { State } from "0x88/types"
import { parseFen } from "common/fen"
import { INITIAL_FEN, EMPTY_FEN } from "common/const"

export { parseFen } from "common/fen"
export type { FenInfo } from "common/fen"
export { INITIAL_FEN, EMPTY_FEN } from "common/const"

export function createGameFromFen(fen: string): State {
    const fenInfo = parseFen(fen)
    const boardState = getBoardStateFromBoardString(fenInfo.boardString)
    const piecePositions = getPiecePositions(boardState)
    const state: State = {
        turn: fenInfo.turn,
        moveNumber: fenInfo.moveNumber,
        boardState,
        piecePositions,
        countdown: fenInfo.countdown,
        fenOccurrence: {},
    }
    state.fenOccurrence[fen] = 1
    return state
}

export function createInitialState(): State {
    return createGameFromFen(INITIAL_FEN)
}
