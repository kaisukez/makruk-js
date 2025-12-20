/**
 * Move notation for bitboard representation
 * Standard Algebraic Notation (SAN) support
 */

import { Piece } from "common/const"
import type { Move } from "bitboard/types"
import type { Board } from "bitboard/board/board"
import { generateLegalMoves } from "bitboard/moves/generation"
import { applyMove } from "bitboard/moves/execution"
import { isKhunAttacked } from "bitboard/rules/status"
import { Color } from "common/const"

/**
 * Convert bitboard square (0-63) to algebraic notation (e.g., "e4")
 */
export function squareToAlgebraic(square: number): string {
    const rank = Math.floor(square / 8)
    const file = square % 8
    return String.fromCharCode(97 + file) + (rank + 1)
}

/**
 * Convert algebraic notation to bitboard square (0-63)
 */
export function algebraicToSquare(algebraic: string): number {
    const file = algebraic.charCodeAt(0) - 97
    const rank = parseInt(algebraic[1], 10) - 1
    return rank * 8 + file
}

/**
 * Get file letter from square (0-63)
 */
function getFile(square: number): string {
    const file = square % 8
    return String.fromCharCode(97 + file)
}

/**
 * Get rank number from square (0-63)
 */
function getRank(square: number): number {
    return Math.floor(square / 8) + 1
}

/**
 * Get disambiguator for ambiguous moves
 */
function getDisambiguator(
    possibleMoves: Move[],
    move: Move,
): string {
    const { from, to, piece } = move

    const samePieceAndDestinationMoves = possibleMoves.filter(
        (m) => m.piece === piece && m.to === to && m.from !== from,
    )

    if (samePieceAndDestinationMoves.length === 0) {
        return ""
    }

    let sameRank = 0
    let sameFile = 0
    samePieceAndDestinationMoves.forEach((m) => {
        if (getRank(m.from) === getRank(from)) {
            sameRank++
        }

        if (getFile(m.from) === getFile(from)) {
            sameFile++
        }
    })

    /* if there exists a similar moving piece on the same rank and file as
     * the move in question, use the square as the disambiguator
     */
    if (sameRank > 0 && sameFile > 0) {
        return squareToAlgebraic(from)
    } else if (sameFile > 0) {
        /* if the moving piece rests on the same file, use the rank symbol as the
         * disambiguator
         */
        return getRank(from).toString()
    } else if (sameRank > 0) {
        /* else use the file symbol */
        return getFile(from)
    }

    return ""
}

/**
 * Convert a Move to Standard Algebraic Notation (SAN)
 */
export function moveToSan(
    state: Board,
    turn: Color,
    move: Move,
): string {
    const possibleMoves = generateLegalMoves(state, turn)
    const disambiguator = getDisambiguator(possibleMoves, move)

    let output = ""

    // Piece symbol (except for pawns/bia)
    if (move.piece !== Piece.BIA && move.piece !== Piece.FLIPPED_BIA) {
        output += move.piece.toUpperCase() + disambiguator
    }

    // Capture notation
    if (move.captured) {
        if (move.piece === Piece.BIA || move.piece === Piece.FLIPPED_BIA) {
            output += getFile(move.from)
        }
        output += "x"
    }

    // Destination square
    output += squareToAlgebraic(move.to)

    // Promotion
    if (move.promotion) {
        output += "=" + move.promotion.toUpperCase()
    }

    // Check/checkmate notation
    const newState = applyMove(state, move)
    const newTurn = turn === Color.WHITE ? Color.BLACK : Color.WHITE
    if (isKhunAttacked(newState, newTurn)) {
        // Simple check - not implementing full checkmate detection here
        // (would need to check if there are any legal moves)
        const nextMoves = generateLegalMoves(newState, newTurn)
        if (nextMoves.length === 0) {
            output += "#"
        } else {
            output += "+"
        }
    }

    return output
}

/**
 * Strip SAN decorations like +, #, ?, !, etc.
 */
export function strippedSan(san: string): string {
    return san.replace(
        /[^FEMTRKa-h\u0E01\u0E02\u0E04\u0E07\u0E08\u0E09\u0E0A\u0E0D1-8]/g,
        "",
    )
}

/**
 * Parse SAN string and find matching legal move
 */
export function moveFromSan(
    state: Board,
    turn: Color,
    san: string,
): Move | null {
    const possibleMoves = generateLegalMoves(state, turn)

    // Strip off any move decorations: e.g Nf3+?!
    const cleanMove = strippedSan(san)

    for (const move of possibleMoves) {
        if (cleanMove === strippedSan(moveToSan(state, turn, move))) {
            return move
        }
    }

    return null
}
