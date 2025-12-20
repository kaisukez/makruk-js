/**
 * PGN support for bitboard implementation
 *
 * Reuses the parser/exporter from 0x88 (they're implementation-agnostic)
 * and adapts them for bitboard State objects
 */

import { INITIAL_FEN } from "bitboard/fen"
import { createGameFromFen, move } from "bitboard/index"
import type { Game } from "bitboard/index"

// Import parser and exporter from common (they work with PgnGame objects, not State)
import { exportPgn as coreExportPgn } from "common/pgn/exporter"
import { parsePgn as coreParsePgn } from "common/pgn/parser"

// Import or re-export types
export type { PgnMove, PgnGame, PgnParseOptions, PgnExportOptions } from "common/pgn/types"
import type { PgnExportOptions, PgnGame, PgnParseOptions } from "common/pgn/types"

/**
 * Import a PGN string and convert it to an array of game states (bitboard)
 * Each state represents the position after each move in the main line
 */
export function importPgn(pgnString: string, options?: PgnParseOptions): Game[] {
    const pgnGame = coreParsePgn(pgnString, options)

    const startingFen = pgnGame.tags.FEN || INITIAL_FEN
    let currentGame = createGameFromFen(startingFen)

    const games: Game[] = [currentGame]

    for (const pgnMove of pgnGame.moves) {
        try {
            currentGame = move(currentGame, pgnMove.san)
            games.push(currentGame)
        } catch (error) {
            console.warn(`Failed to apply move ${pgnMove.san}:`, error)
            break
        }
    }

    return games
}

/**
 * Export a game history to PGN format
 */
export function exportPgnFromHistory(
    _games: Game[],
    tags: Record<string, string> = {},
    options?: PgnExportOptions
): string {
    const result = tags.Result || "*"

    const game: PgnGame = {
        tags: {
            Event: tags.Event || "?",
            Site: tags.Site || "?",
            Date: tags.Date || new Date().toISOString().split("T")[0].replace(/-/g, "."),
            Round: tags.Round || "?",
            White: tags.White || "?",
            Black: tags.Black || "?",
            Result: result,
            ...tags,
        },
        moves: [],
        result,
    }

    return coreExportPgn(game, options)
}

/**
 * Parse PGN string to structured PgnGame object
 * This is a low-level function - most users should use importPgn() instead
 */
export function parsePgn(pgnString: string, options?: PgnParseOptions): PgnGame {
    return coreParsePgn(pgnString, options)
}

/**
 * Export PgnGame object to PGN string
 * This is a low-level function - most users should use exportPgnFromHistory() instead
 */
export function exportPgn(game: PgnGame, options?: PgnExportOptions): string {
    return coreExportPgn(game, options)
}
