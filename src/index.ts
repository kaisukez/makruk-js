// Main entry point - curated public API

// Game API
export { generateLegalMoves } from "core/moves/generation"
export { move } from "core/moves/notation"

// Status checking
export { isCheck, isCheckmate, isDraw, isGameOver, isStalemate, isThreefoldRepetition } from "core/rules/status"

// FEN support
export { EMPTY_FEN, INITIAL_FEN, importFen } from "core/fen/importer"
export { exportFen } from "core/fen/exporter"

// PGN support
export { exportPgn, exportPgnFromHistory, importPgn, parsePgn } from "core/pgn"
export type { PgnExportOptions, PgnGame, PgnMove, PgnParseOptions } from "core/pgn/types"

// AI
export { findBestMove } from "core/ai/search"

// Board manipulation
export { put, remove } from "core/board/board"
export { printBoard as ascii } from "utils/board-utils"

// Types
export type { MoveObject, State } from "core/types"
export type { MinimaxOutput } from "core/ai/search"

// Constants
export { Color, Piece, SquareIndex } from "config"
