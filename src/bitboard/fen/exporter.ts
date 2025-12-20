/**
 * FEN export for bitboard representation
 */

import type { Mask64 } from "bitboard/board/board"
import type { Game } from "bitboard/types"
import { Color } from "common/const"

export function exportFen(game: Game): string {
    const { board, turn, moveNumber } = game
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

    populatePieceMap(board.whiteBia, 'B')
    populatePieceMap(board.whiteFlippedBia, 'F')
    populatePieceMap(board.whiteMa, 'M')
    populatePieceMap(board.whiteThon, 'T')
    populatePieceMap(board.whiteMet, 'E')
    populatePieceMap(board.whiteRua, 'R')
    populatePieceMap(board.whiteKhun, 'K')

    populatePieceMap(board.blackBia, 'b')
    populatePieceMap(board.blackFlippedBia, 'f')
    populatePieceMap(board.blackMa, 'm')
    populatePieceMap(board.blackThon, 't')
    populatePieceMap(board.blackMet, 'e')
    populatePieceMap(board.blackRua, 'r')
    populatePieceMap(board.blackKhun, 'k')

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
