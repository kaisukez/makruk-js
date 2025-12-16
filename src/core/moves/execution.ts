import { BITS, Color, SquareIndex } from "config"
import {
    PiecePositionDelta,
    revertPiecePositionDictionary,
    updatePiecePositionDictionary,
} from "core/board"
import { exportFen } from "core/fen"
import { applyStepCountdown, CountdownFlag } from "core/rules/countdown"
import { Countdown, MoveObject, SquareData, State } from "core/types"
import { cloneCountdown, cloneSquareData, produceState } from "utils/immer-helpers"
import { swapColor } from "utils/board-utils"

/**
 *
 * @param {Object} boardState
 * @param {Number} from 0x88 square
 * @param {Number} to 0x88 square
 *
 */
export function changePiecePosition(
    boardState: State["boardState"],
    from: SquareIndex,
    to: SquareIndex,
) {
    if ((from === undefined || from === null) || from === to) {
        return
    }

    boardState[to] = boardState[from]
    boardState[from] = null
}


/**
 * Increase move counter (if black have made a move) and swap color
 *
 * @param {Object} state
 *
 */
export function step(state: State) {
    if (state.activeColor === Color.BLACK) {
        state.moveNumber++
    }

    state.activeColor = swapColor(state.activeColor)
}

export type BoardDelta = {
    from: SquareIndex;
    to: SquareIndex;
    fromPiece: SquareData | null;
    toPiece: SquareData | null;
};

export type MoveUndo = {
    board?: BoardDelta;
    piecePositions?: PiecePositionDelta;
    moveNumber: number;
    activeColor: Color;
    countdown: Countdown | null;
    fenAfter?: string;
    fenUpdated: boolean;
};

export type ApplyMoveOptions = {
    optional?: CountdownFlag;
    trackUndo?: boolean;
    updateFen?: boolean;
};

export function applyMove(
    state: State,
    moveObject: MoveObject,
    options: ApplyMoveOptions = {},
): { newState: State; undo?: MoveUndo } {
    const {
        optional = {},
        trackUndo = false,
        updateFen = true,
    } = options

    // Create undo snapshot before mutating (if needed)
    const undo: MoveUndo | undefined = trackUndo
        ? {
              board: {
                  from: moveObject.from,
                  to: moveObject.to,
                  fromPiece: cloneSquareData(state.boardState[moveObject.from]),
                  toPiece: cloneSquareData(state.boardState[moveObject.to]),
              },
              moveNumber: state.moveNumber,
              activeColor: state.activeColor,
              countdown: cloneCountdown(state.countdown),
              fenUpdated: updateFen,
          }
        : undefined

    // Variable to store piece position delta (outside produceState)
    let pieceDelta: PiecePositionDelta | undefined

    // Create new state with all updates applied
    const newState = produceState(state, draft => {
        // Move piece on board
        draft.boardState[moveObject.to] = draft.boardState[moveObject.from]
        draft.boardState[moveObject.from] = null

        // Handle promotion
        if (moveObject.flags & BITS.PROMOTION && moveObject.promotion) {
            draft.boardState[moveObject.to]![1] = moveObject.promotion
        }

        // Update countdown
        applyStepCountdown(draft, optional)

        // Update move counter and active color
        if (draft.activeColor === Color.BLACK) {
            draft.moveNumber++
        }
        draft.activeColor = swapColor(draft.activeColor)

        // Update piece positions (this mutates draft AND returns delta)
        pieceDelta = updatePiecePositionDictionary(draft.piecePositions, moveObject)

        // Update FEN occurrence
        if (updateFen) {
            const fen = exportFen(draft as State)
            draft.fenOccurrence[fen] = (draft.fenOccurrence[fen] || 0) + 1
            if (trackUndo && undo) {
                undo.fenAfter = fen
            }
        }
    })

    // Track piece delta for undo if needed
    if (trackUndo && undo && pieceDelta) {
        undo.piecePositions = pieceDelta
    }

    return { newState, undo }
}

export function undoMove(state: State, undo?: MoveUndo): State {
    if (!undo) {
        return state
    }

    return produceState(state, (draft) => {
        if (undo.fenUpdated && undo.fenAfter) {
            const count = draft.fenOccurrence[undo.fenAfter]
            if (count <= 1) {
                delete draft.fenOccurrence[undo.fenAfter]
            } else {
                draft.fenOccurrence[undo.fenAfter] = count - 1
            }
        }

        draft.activeColor = undo.activeColor
        draft.moveNumber = undo.moveNumber
        draft.countdown = cloneCountdown(undo.countdown)

        if (undo.piecePositions) {
            revertPiecePositionDictionary(draft.piecePositions, undo.piecePositions)
        }

        if (undo.board) {
            draft.boardState[undo.board.from] = cloneSquareData(undo.board.fromPiece)
            draft.boardState[undo.board.to] = cloneSquareData(undo.board.toPiece)
        }
    })
}
