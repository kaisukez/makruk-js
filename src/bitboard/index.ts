/**
 * Bitboard implementation - Public API
 *
 * This exports the same interface as the 0x88 implementation for compatibility
 */

import type { BitboardState, Bitboard } from "bitboard/board/board"
import type { BitboardMove } from "bitboard/moves"
import { Color, Piece, SquareIndex, PIECE_POWER } from "common/const"
import {
    importFenBitboard,
    exportFenBitboard,
    INITIAL_FEN_BITBOARD,
    EMPTY_FEN_BITBOARD,
} from "bitboard/fen"
import {
    generateLegalMoves as generateLegalMovesBB,
    applyBitboardMove,
} from "bitboard/moves"
import {
    findBestMove as findBestMoveBB,
    type MinimaxOutput as MinimaxOutputBB,
} from "bitboard/ai/search"
import { evaluateFast } from "bitboard/ai/evaluation"
import { moveFromSan, moveToSan } from "bitboard/moves/notation"

// ============================================================================
// Types (matching 0x88 interface)
// ============================================================================

/**
 * State type - wrapper around BitboardState for API compatibility
 */
export interface State {
    _bitboard: BitboardState
    _turn: Color
    moveNumber: number
    fen: string
}

/**
 * MoveObject type - wrapper around BitboardMove for API compatibility
 */
export interface MoveObject {
    from: SquareIndex
    to: SquareIndex
    piece: Piece
    color: Color
    captured?: Piece
    promotion?: Piece
    san: string
    flags: {
        normal: boolean
        capture: boolean
        promotion: boolean
    }
}

export interface MinimaxOutput {
    bestScore: number
    bestMove: MoveObject | null
}

// ============================================================================
// Internal conversions
// ============================================================================

function bitboardSquareToSquareIndex(square: number): SquareIndex {
    const rank = Math.floor(square / 8)
    const file = square % 8
    return (rank * 16 + file) as SquareIndex
}

function squareIndexToBitboardSquare(sq: SquareIndex): number {
    const rank = Math.floor(sq / 16)
    const file = sq % 16
    return rank * 8 + file
}

function bitboardToState(bitboard: BitboardState, turn: Color, moveNumber: number): State {
    const fen = exportFenBitboard(bitboard, turn, moveNumber)
    return {
        _bitboard: bitboard,
        _turn: turn,
        moveNumber,
        fen,
    }
}

function bitboardMoveToMoveObject(move: BitboardMove, state?: BitboardState, turn?: Color): MoveObject {
    return {
        from: bitboardSquareToSquareIndex(move.from),
        to: bitboardSquareToSquareIndex(move.to),
        piece: move.piece,
        color: move.color,
        captured: move.captured,
        promotion: move.promotion,
        san: state && turn !== undefined ? moveToSan(state, turn, move) : '',
        flags: {
            normal: !move.captured && !move.promotion,
            capture: !!move.captured,
            promotion: !!move.promotion,
        },
    }
}

function moveObjectToBitboardMove(move: MoveObject): BitboardMove {
    return {
        from: squareIndexToBitboardSquare(move.from),
        to: squareIndexToBitboardSquare(move.to),
        piece: move.piece,
        color: move.color,
        captured: move.captured,
        promotion: move.promotion,
    }
}

// ============================================================================
// Public API (matching 0x88 interface)
// ============================================================================

/**
 * Import FEN string to create game state
 */
export function importFen(fen: string): State {
    const { state: bitboard, turn, moveNumber } = importFenBitboard(fen)
    return bitboardToState(bitboard, turn, moveNumber)
}

/**
 * Export game state to FEN string
 */
export function exportFen(state: State): string {
    return state.fen
}

/**
 * Generate all legal moves for the current position
 */
export function generateLegalMoves(state: State): MoveObject[] {
    const moves = generateLegalMovesBB(state._bitboard, state._turn)
    return moves.map(m => bitboardMoveToMoveObject(m, state._bitboard, state._turn))
}

/**
 * Make a move (from SAN string or MoveObject)
 */
export function move(state: State, moveInput: string | MoveObject): State {
    let bbMove: BitboardMove

    if (typeof moveInput === 'string') {
        // Parse SAN using proper parser
        const parsedMove = moveFromSan(state._bitboard, state._turn, moveInput)
        if (!parsedMove) {
            throw new Error(`Invalid move: ${moveInput}`)
        }
        bbMove = parsedMove
    } else {
        bbMove = moveObjectToBitboardMove(moveInput)
    }

    const newBitboard = applyBitboardMove(state._bitboard, bbMove)
    const newTurn = state._turn === Color.WHITE ? Color.BLACK : Color.WHITE
    const newMoveNumber = state.moveNumber + (newTurn === Color.WHITE ? 1 : 0)

    return bitboardToState(newBitboard, newTurn, newMoveNumber)
}

function getSquareName(sq: SquareIndex): string {
    const rank = Math.floor(sq / 16)
    const file = sq % 16
    return String.fromCharCode(97 + file) + (rank + 1)
}

/**
 * Check if game is over
 */
export function isGameOver(state: State): boolean {
    const moves = generateLegalMovesBB(state._bitboard, state._turn)
    return moves.length === 0
}

/**
 * Check if current player is in check
 */
export function isCheck(state: State): boolean {
    // TODO: implement check detection
    return false
}

/**
 * Check if current player is in checkmate
 */
export function isCheckmate(state: State): boolean {
    return isGameOver(state) && isCheck(state)
}

/**
 * Check if position is a draw
 */
export function isDraw(state: State): boolean {
    return isGameOver(state) && !isCheck(state)
}

/**
 * Check if position is stalemate
 */
export function isStalemate(state: State): boolean {
    return isDraw(state)
}

/**
 * Check if position has occurred 3 times (threefold repetition)
 */
export function isThreefoldRepetition(state: State): boolean {
    // TODO: implement
    return false
}

/**
 * Find best move using AI search
 */
export function findBestMove(state: State, depth: number): MinimaxOutput {
    const result = findBestMoveBB(state._bitboard, state._turn, depth)
    return {
        bestScore: result.bestScore,
        bestMove: result.bestMove ? bitboardMoveToMoveObject(result.bestMove, state._bitboard, state._turn) : null,
    }
}

/**
 * Evaluate current position
 */
export function evaluate(state: State): number {
    return evaluateFast(state._bitboard)
}

/**
 * Place a piece on the board
 */
export function put(state: State, color: Color, piece: Piece, square: SquareIndex): State {
    // TODO: implement
    return state
}

/**
 * Remove a piece from the board
 */
export function remove(state: State, square: SquareIndex): State {
    // TODO: implement
    return state
}

/**
 * Print board as ASCII
 */
export function printBoard(state: State): string {
    // TODO: implement
    return ''
}

// ============================================================================
// Constants
// ============================================================================

export const INITIAL_FEN = INITIAL_FEN_BITBOARD
export const EMPTY_FEN = EMPTY_FEN_BITBOARD

// Re-export constants
export { Color, Piece, SquareIndex, PIECE_POWER }

// Re-export types
export type { State as BitboardState, MoveObject as BitboardMove }

// ============================================================================
// PGN Support
// ============================================================================

export { importPgn, exportPgnFromHistory, parsePgn, exportPgn } from "bitboard/pgn"
export type { PgnGame, PgnMove, PgnParseOptions, PgnExportOptions } from "bitboard/pgn"
