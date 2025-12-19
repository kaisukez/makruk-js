/**
 * Mask64 implementation - Public API
 */

import type { BoardState as InternalState } from "bitboard/board/board"
import type { Move as InternalMove } from "bitboard/moves"
import { Color, Piece, SquareIndex, PIECE_POWER } from "common/const"
import * as fen from "bitboard/fen"
import * as moves from "bitboard/moves"
import * as ai from "bitboard/ai/search"
import * as evaluation from "bitboard/ai/evaluation"
import * as notation from "bitboard/moves/notation"
import * as status from "bitboard/rules/status"
import * as countdown from "bitboard/rules/countdown"
import * as board from "bitboard/board/board"
import * as utils from "bitboard/utils/board-utils"
import {
    State,
    MoveObject,
    MinimaxOutput,
    squareToIndex,
    squareIndexToMask64Square,
} from "bitboard/types"

export type { State, MoveObject, MinimaxOutput }

function createState(
    internal: InternalState,
    turn: Color,
    moveNumber: number,
    countdownState: countdown.Countdown | null = null,
    fenOccurrence: Record<string, number> = {}
): State {
    return {
        board: internal,
        turn: turn,
        moveNumber,
        fen: fen.exportFen(internal, turn, moveNumber),
        countdown: countdownState,
        fenOccurrence,
    }
}

function toMoveObject(move: InternalMove, state?: InternalState, turn?: Color): MoveObject {
    return {
        from: squareToIndex(move.from),
        to: squareToIndex(move.to),
        piece: move.piece,
        color: move.color,
        captured: move.captured,
        promotion: move.promotion,
        san: state && turn !== undefined ? notation.moveToSan(state, turn, move) : '',
        flags: {
            normal: !move.captured && !move.promotion,
            capture: !!move.captured,
            promotion: !!move.promotion,
        },
    }
}

function toInternalMove(move: MoveObject): InternalMove {
    return {
        from: squareIndexToMask64Square(move.from),
        to: squareIndexToMask64Square(move.to),
        piece: move.piece,
        color: move.color,
        captured: move.captured,
        promotion: move.promotion,
    }
}

export function importFen(fenString: string): State {
    const { state: internal, turn, moveNumber } = fen.importFen(fenString)
    return createState(internal, turn, moveNumber)
}

export function createInitialState(): State {
    return importFen(fen.INITIAL_FEN)
}

export function exportFen(state: State): string {
    return state.fen
}

export function generateLegalMoves(state: State): MoveObject[] {
    const moveList = moves.generateLegalMoves(state.board, state.turn)
    return moveList.map(m => toMoveObject(m, state.board, state.turn))
}

export function move(state: State, moveInput: string | MoveObject): State {
    let internalMove: InternalMove

    if (typeof moveInput === 'string') {
        const parsedMove = notation.moveFromSan(state.board, state.turn, moveInput)
        if (!parsedMove) {
            throw new Error(`Invalid move: ${moveInput}`)
        }
        internalMove = parsedMove
    } else {
        internalMove = toInternalMove(moveInput)
    }

    const newInternal = moves.applyMove(state.board, internalMove)
    const newTurn = state.turn === Color.WHITE ? Color.BLACK : Color.WHITE
    const newMoveNumber = state.moveNumber + (newTurn === Color.WHITE ? 1 : 0)

    const newFen = fen.exportFen(newInternal, newTurn, newMoveNumber)
    const fenForOccurrence = newFen.split(' ').slice(0, 2).join(' ')

    const newFenOccurrence = { ...state.fenOccurrence }
    newFenOccurrence[fenForOccurrence] = (newFenOccurrence[fenForOccurrence] || 0) + 1

    return createState(newInternal, newTurn, newMoveNumber, state.countdown, newFenOccurrence)
}

export function isCheck(state: State): boolean {
    return status.isCheck(state.board, state.turn)
}

export function isCheckmate(state: State): boolean {
    return status.isCheckmate(state.board, state.turn)
}

export function isStalemate(state: State): boolean {
    return status.isStalemate(state.board, state.turn)
}

export function isThreefoldRepetition(state: State): boolean {
    return Object.values(state.fenOccurrence).some((count) => count >= 3)
}

export function isFinishedCounting(state: State): boolean {
    return countdown.isCountdownExpired(state.countdown)
}

export function isInsufficientMaterial(state: State): boolean {
    return status.isInsufficientMaterial(state.board)
}

export function isDraw(state: State): boolean {
    return isStalemate(state) ||
        isFinishedCounting(state) ||
        isInsufficientMaterial(state) ||
        isThreefoldRepetition(state)
}

export function isGameOver(state: State): boolean {
    return isDraw(state) || isCheckmate(state)
}

export function findBestMove(state: State, depth: number): MinimaxOutput {
    const result = ai.findBestMove(state.board, state.turn, depth)
    return {
        bestScore: result.bestScore,
        bestMove: result.bestMove ? toMoveObject(result.bestMove, state.board, state.turn) : null,
    }
}

export function evaluate(state: State): number {
    return evaluation.evaluateFast(state.board)
}

export function put(state: State, color: Color, piece: Piece, square: SquareIndex): State {
    const sq = squareIndexToMask64Square(square)
    const newInternal = board.put(state.board, color, piece, sq)
    return createState(newInternal, state.turn, state.moveNumber, state.countdown, state.fenOccurrence)
}

export function remove(state: State, square: SquareIndex): State {
    const sq = squareIndexToMask64Square(square)
    const newInternal = board.remove(state.board, sq)
    return createState(newInternal, state.turn, state.moveNumber, state.countdown, state.fenOccurrence)
}

export function printBoard(state: State): string {
    return utils.printBoard(state.board)
}

export const INITIAL_FEN = fen.INITIAL_FEN
export const EMPTY_FEN = fen.EMPTY_FEN

export { Color, Piece, SquareIndex, PIECE_POWER }

export type { State as BoardState, MoveObject as Move }

export { importPgn, exportPgnFromHistory, parsePgn, exportPgn } from "bitboard/pgn"
export type { PgnGame, PgnMove, PgnParseOptions, PgnExportOptions } from "bitboard/pgn"

export function minimax(state: State, depth: number, alpha: number, beta: number): MinimaxOutput {
    const result = ai.minimax(state.board, state.turn, depth, alpha, beta)
    return {
        bestScore: result.bestScore,
        bestMove: result.bestMove ? toMoveObject(result.bestMove, state.board, state.turn) : null,
    }
}
