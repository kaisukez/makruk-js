/**
 * 0x88 implementation - Public API
 *
 * This is the original 0x88 board representation version.
 */

// Game API
export { generateLegalMoves } from "0x88/moves/generation"
export { move } from "0x88/moves/notation"

// Status checking
export {
    isCheck,
    isCheckmate,
    isDraw,
    isGameOver,
    isStalemate,
    isThreefoldRepetition,
    isFinishedCounting,
    isInsufficientMaterial,
} from "0x88/rules/status"

// FEN support
export { EMPTY_FEN, INITIAL_FEN, importFen, createInitialState } from "0x88/fen/importer"
export { exportFen } from "0x88/fen/exporter"

// PGN support
export { exportPgn, exportPgnFromHistory, importPgn, parsePgn } from "0x88/pgn"
export type { PgnExportOptions, PgnGame, PgnMove, PgnParseOptions } from "common/pgn/types"

// AI
export { findBestMove, minimax } from "0x88/ai/search"
export type { MinimaxOutput } from "0x88/ai/search"

// Evaluation
export { evaluate } from "0x88/ai/evaluation"

// Board manipulation
export { put, remove } from "0x88/board/board"
export { printBoard } from "0x88/utils/board-utils"

// Types
export type { MoveObject, State } from "0x88/types"

// Constants
export { Color, Piece, SquareIndex, PIECE_POWER } from "common/const"
