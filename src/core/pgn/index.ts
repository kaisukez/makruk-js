import { INITIAL_FEN, importFen } from "core/fen"
import { move as makeMove } from "core/moves/notation"

import type { State } from "core/types"

import { exportPgn as coreExportPgn } from "core/pgn/exporter"
import { parsePgn as coreParsePgn } from "core/pgn/parser"
import type { PgnExportOptions, PgnGame, PgnParseOptions } from "core/pgn/types"

/**
 * Import a PGN string and convert it to an array of game states
 * Each state represents the position after each move in the main line
 */
export function importPgn(pgnString: string, options?: PgnParseOptions): State[] {
    const game = coreParsePgn(pgnString, options)

    const startingFen = game.tags.FEN || INITIAL_FEN
    let currentState = importFen(startingFen)

    const states: State[] = [currentState]

    for (const pgnMove of game.moves) {
        try {
            currentState = makeMove(currentState, pgnMove.san)
            states.push(currentState)
        } catch (error) {
            console.warn(`Failed to apply move ${pgnMove.san}:`, error)
            break
        }
    }

    return states
}

/**
 * Export a game history to PGN format
 */
export function exportPgnFromHistory(
    _states: State[],
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

export * from "core/pgn/exporter"
export * from "core/pgn/parser"
export * from "core/pgn/types"
