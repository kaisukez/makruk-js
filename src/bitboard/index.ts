export type { Game, Board, Move, MinimaxOutput } from "bitboard/types"
export { Color, Piece, PIECE_POWER, CountType } from "common/const"

export { INITIAL_FEN, EMPTY_FEN, createGameFromFen, createInitialState } from "bitboard/fen"
export { exportFen } from "bitboard/fen/exporter"
export { generateLegalMoves, move, moveToSan } from "bitboard/moves"

export {
    isCheck,
    isCheckmate,
    isStalemate,
    isDraw,
    isGameOver,
    isInsufficientMaterial,
    isThreefoldRepetition,
} from "bitboard/rules/status"

export { isCountdownExpired } from "bitboard/rules/countdown"

export {
    findBestMove,
    minimax,
    iterativeDeepening,
    createTranspositionTable,
} from "bitboard/ai/search"
export type { TranspositionTable } from "bitboard/ai/search"

export { evaluateFast as evaluate } from "bitboard/ai/evaluation"

export {
    distributeMoves,
    searchMoves,
    searchMovesWithSharedBounds,
    combineResults,
    getRecommendedWorkers,
    createSharedBounds,
    wrapSharedBounds,
} from "bitboard/ai/parallel-search"
export type { SharedBounds } from "bitboard/ai/parallel-search"

export { put, remove } from "bitboard/board/board"
export { printBoard } from "bitboard/utils/board-utils"

export { importPgn, exportPgnFromHistory, parsePgn, exportPgn } from "bitboard/pgn"
export type { PgnGame, PgnMove, PgnParseOptions, PgnExportOptions } from "bitboard/pgn"
