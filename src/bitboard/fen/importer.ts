/**
 * FEN import for bitboard representation
 */

import type { BitboardState } from "bitboard/board/board"
import { createEmptyBitboardState, setPiece } from "bitboard/board/board"
import { Color, Piece } from "common/const"

/**
 * Piece symbol to Piece enum mapping (Makruk notation)
 */
const PIECE_SYMBOLS: Record<string, [Color, Piece]> = {
    'B': [Color.WHITE, Piece.BIA],
    'F': [Color.WHITE, Piece.FLIPPED_BIA],
    'M': [Color.WHITE, Piece.MA],
    'T': [Color.WHITE, Piece.THON],
    'E': [Color.WHITE, Piece.MET],
    'R': [Color.WHITE, Piece.RUA],
    'K': [Color.WHITE, Piece.KHUN],
    'b': [Color.BLACK, Piece.BIA],
    'f': [Color.BLACK, Piece.FLIPPED_BIA],
    'm': [Color.BLACK, Piece.MA],
    't': [Color.BLACK, Piece.THON],
    'e': [Color.BLACK, Piece.MET],
    'r': [Color.BLACK, Piece.RUA],
    'k': [Color.BLACK, Piece.KHUN],
}

/**
 * Import FEN string to BitboardState
 */
export function importFenBitboard(fen: string): {
    state: BitboardState
    turn: Color
    moveNumber: number
} {
    const parts = fen.split(' ')
    const boardString = parts[0]
    const turn = parts[1] === 'w' ? Color.WHITE : Color.BLACK
    const moveNumber = parseInt(parts[2] || '1', 10)

    const state = createEmptyBitboardState()

    // Parse board string
    const ranks = boardString.split('/')
    let square = 56 // Start at a8 (rank 8, file a)

    for (const rank of ranks) {
        let file = 0

        for (const char of rank) {
            if (char >= '1' && char <= '8') {
                // Empty squares
                const emptyCount = parseInt(char, 10)
                file += emptyCount
            } else {
                // Piece
                const pieceInfo = PIECE_SYMBOLS[char]
                if (pieceInfo) {
                    const [color, piece] = pieceInfo
                    const bitboardSquare = square + file
                    setPiece(state, color, piece, bitboardSquare)
                }
                file++
            }
        }

        square -= 8 // Move to next rank down
    }

    return { state, turn, moveNumber }
}

/**
 * Initial position FEN for Makruk
 */
export const INITIAL_FEN_BITBOARD = 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTEKTMR w 1'

/**
 * Empty board FEN
 */
export const EMPTY_FEN_BITBOARD = '8/8/8/8/8/8/8/8 w 1'
