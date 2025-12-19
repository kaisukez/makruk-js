/**
 * FEN export for bitboard representation
 */

import type { Mask64, BoardState } from "bitboard/board/board"
import { Color } from "common/const"

/**
 * Export BoardState to FEN string (optimized version)
 */
export function exportFen(
    state: BoardState,
    turn: Color,
    moveNumber: number
): string {
    // Create a piece map for fast lookup
    const pieceMap = new Array<string | null>(64).fill(null)

    // Helper to populate piece map from bitboard
    function populatePieceMap(bb: Mask64, symbol: string): void {
        let temp = bb
        while (temp !== 0n) {
            // Find LSB
            let square = 0
            let test = temp
            while ((test & 1n) === 0n) {
                test >>= 1n
                square++
            }
            pieceMap[square] = symbol
            temp &= temp - 1n // Clear LSB
        }
    }

    // Populate piece map for all pieces (Makruk notation)
    populatePieceMap(state.whiteBia, 'B')
    populatePieceMap(state.whiteFlippedBia, 'F')
    populatePieceMap(state.whiteMa, 'M')
    populatePieceMap(state.whiteThon, 'T')
    populatePieceMap(state.whiteMet, 'E')
    populatePieceMap(state.whiteRua, 'R')
    populatePieceMap(state.whiteKhun, 'K')

    populatePieceMap(state.blackBia, 'b')
    populatePieceMap(state.blackFlippedBia, 'f')
    populatePieceMap(state.blackMa, 'm')
    populatePieceMap(state.blackThon, 't')
    populatePieceMap(state.blackMet, 'e')
    populatePieceMap(state.blackRua, 'r')
    populatePieceMap(state.blackKhun, 'k')

    // Build board string rank by rank (from rank 8 to rank 1)
    let boardString = ''
    for (let rank = 7; rank >= 0; rank--) {
        let emptyCount = 0

        for (let file = 0; file < 8; file++) {
            const square = rank * 8 + file
            const piece = pieceMap[square]

            if (piece === null) {
                emptyCount++
            } else {
                // Output empty squares count if any
                if (emptyCount > 0) {
                    boardString += emptyCount.toString()
                    emptyCount = 0
                }

                // Output piece
                boardString += piece
            }
        }

        // Output remaining empty squares
        if (emptyCount > 0) {
            boardString += emptyCount.toString()
        }

        // Add rank separator (except for last rank)
        if (rank > 0) {
            boardString += '/'
        }
    }

    const turnChar = turn === Color.WHITE ? 'w' : 'b'
    return `${boardString} ${turnChar} ${moveNumber}`
}
