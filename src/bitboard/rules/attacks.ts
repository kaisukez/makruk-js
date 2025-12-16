/**
 * Attack tables and move generation for pieces using bitboards
 *
 * This file contains pre-computed attack tables for:
 * - Knight (Ma) attacks
 * - King (Khun) attacks
 * - Pawn (Bia) attacks and moves
 * - Sliding piece (Rua/Rook) attacks using classical approach
 *
 * Note: For Makruk-specific pieces like Thon and Met (which move one square diagonally),
 * we can use the same pattern as King attacks but filtered to diagonal squares only.
 */

import type { Bitboard } from "bitboard/board/board"
import {
    EMPTY_BITBOARD,
    FILE_A,
    FILE_H,
    RANK_1,
    RANK_8,
    shiftNorth,
    shiftSouth,
    shiftEast,
    shiftWest,
    shiftNorthEast,
    shiftNorthWest,
    shiftSouthEast,
    shiftSouthWest,
} from "bitboard/board/board"

// Pre-computed attack tables (initialized at module load)
const knightAttacks: Bitboard[] = new Array(64)
const kingAttacks: Bitboard[] = new Array(64)
const whitePawnAttacks: Bitboard[] = new Array(64)
const blackPawnAttacks: Bitboard[] = new Array(64)
const whitePawnMoves: Bitboard[] = new Array(64)
const blackPawnMoves: Bitboard[] = new Array(64)

// Diagonal-only attacks for Thon/Met (Makruk Bishop/Queen)
const diagonalAttacks: Bitboard[] = new Array(64)

/**
 * Initialize all pre-computed attack tables
 */
function initializeAttackTables(): void {
    for (let square = 0; square < 64; square++) {
        const bb = 1n << BigInt(square)
        const rank = Math.floor(square / 8)
        const file = square % 8

        // Knight attacks (8 possible L-shaped moves)
        let knight = EMPTY_BITBOARD
        if (file >= 1 && rank <= 5) knight |= bb << 15n // up-up-left
        if (file <= 6 && rank <= 5) knight |= bb << 17n // up-up-right
        if (file <= 5 && rank <= 6) knight |= bb << 10n // up-right-right
        if (file <= 5 && rank >= 1) knight |= bb >> 6n  // down-right-right
        if (file <= 6 && rank >= 2) knight |= bb >> 15n // down-down-right
        if (file >= 1 && rank >= 2) knight |= bb >> 17n // down-down-left
        if (file >= 2 && rank >= 1) knight |= bb >> 10n // down-left-left
        if (file >= 2 && rank <= 6) knight |= bb << 6n  // up-left-left
        knightAttacks[square] = knight

        // King attacks (8 directions, one square each)
        let king = EMPTY_BITBOARD
        king |= shiftNorth(bb)
        king |= shiftSouth(bb)
        king |= shiftEast(bb)
        king |= shiftWest(bb)
        king |= shiftNorthEast(bb)
        king |= shiftNorthWest(bb)
        king |= shiftSouthEast(bb)
        king |= shiftSouthWest(bb)
        kingAttacks[square] = king

        // Diagonal attacks only (for Thon/Met in Makruk)
        let diagonal = EMPTY_BITBOARD
        diagonal |= shiftNorthEast(bb)
        diagonal |= shiftNorthWest(bb)
        diagonal |= shiftSouthEast(bb)
        diagonal |= shiftSouthWest(bb)
        diagonalAttacks[square] = diagonal

        // White pawn attacks (northeast and northwest)
        let whitePawnAtk = EMPTY_BITBOARD
        whitePawnAtk |= shiftNorthEast(bb)
        whitePawnAtk |= shiftNorthWest(bb)
        whitePawnAttacks[square] = whitePawnAtk

        // Black pawn attacks (southeast and southwest)
        let blackPawnAtk = EMPTY_BITBOARD
        blackPawnAtk |= shiftSouthEast(bb)
        blackPawnAtk |= shiftSouthWest(bb)
        blackPawnAttacks[square] = blackPawnAtk

        // White pawn moves (one square forward, or two from rank 2)
        let whitePawnMove = shiftNorth(bb)
        if (rank === 1) { // rank 2 in chess notation
            whitePawnMove |= shiftNorth(shiftNorth(bb))
        }
        whitePawnMoves[square] = whitePawnMove

        // Black pawn moves (one square forward, or two from rank 7)
        let blackPawnMove = shiftSouth(bb)
        if (rank === 6) { // rank 7 in chess notation
            blackPawnMove |= shiftSouth(shiftSouth(bb))
        }
        blackPawnMoves[square] = blackPawnMove
    }
}

// Initialize tables when module loads
initializeAttackTables()

/**
 * Get knight attack bitboard for a square
 */
export function getKnightAttacks(square: number): Bitboard {
    return knightAttacks[square]
}

/**
 * Get king attack bitboard for a square
 */
export function getKingAttacks(square: number): Bitboard {
    return kingAttacks[square]
}

/**
 * Get diagonal attack bitboard for a square (for Makruk Thon/Met)
 */
export function getDiagonalAttacks(square: number): Bitboard {
    return diagonalAttacks[square]
}

/**
 * Get pawn attack bitboard for a square
 */
export function getPawnAttacks(square: number, isWhite: boolean): Bitboard {
    return isWhite ? whitePawnAttacks[square] : blackPawnAttacks[square]
}

/**
 * Get pawn move bitboard for a square (non-captures)
 */
export function getPawnMoves(square: number, isWhite: boolean): Bitboard {
    return isWhite ? whitePawnMoves[square] : blackPawnMoves[square]
}

/**
 * Generate rook attacks from a square with given occupancy
 * Uses classical approach (not magic bitboards)
 */
export function getRookAttacks(square: number, occupancy: Bitboard): Bitboard {
    let attacks = EMPTY_BITBOARD
    const rank = Math.floor(square / 8)
    const file = square % 8

    // North
    for (let r = rank + 1; r <= 7; r++) {
        const sq = r * 8 + file
        const bit = 1n << BigInt(sq)
        attacks |= bit
        if (occupancy & bit) break
    }

    // South
    for (let r = rank - 1; r >= 0; r--) {
        const sq = r * 8 + file
        const bit = 1n << BigInt(sq)
        attacks |= bit
        if (occupancy & bit) break
    }

    // East
    for (let f = file + 1; f <= 7; f++) {
        const sq = rank * 8 + f
        const bit = 1n << BigInt(sq)
        attacks |= bit
        if (occupancy & bit) break
    }

    // West
    for (let f = file - 1; f >= 0; f--) {
        const sq = rank * 8 + f
        const bit = 1n << BigInt(sq)
        attacks |= bit
        if (occupancy & bit) break
    }

    return attacks
}

/**
 * Generate bishop attacks from a square with given occupancy
 * Uses classical approach (not magic bitboards)
 */
export function getBishopAttacks(square: number, occupancy: Bitboard): Bitboard {
    let attacks = EMPTY_BITBOARD
    const rank = Math.floor(square / 8)
    const file = square % 8

    // Northeast
    for (let r = rank + 1, f = file + 1; r <= 7 && f <= 7; r++, f++) {
        const sq = r * 8 + f
        const bit = 1n << BigInt(sq)
        attacks |= bit
        if (occupancy & bit) break
    }

    // Northwest
    for (let r = rank + 1, f = file - 1; r <= 7 && f >= 0; r++, f--) {
        const sq = r * 8 + f
        const bit = 1n << BigInt(sq)
        attacks |= bit
        if (occupancy & bit) break
    }

    // Southeast
    for (let r = rank - 1, f = file + 1; r >= 0 && f <= 7; r--, f++) {
        const sq = r * 8 + f
        const bit = 1n << BigInt(sq)
        attacks |= bit
        if (occupancy & bit) break
    }

    // Southwest
    for (let r = rank - 1, f = file - 1; r >= 0 && f >= 0; r--, f--) {
        const sq = r * 8 + f
        const bit = 1n << BigInt(sq)
        attacks |= bit
        if (occupancy & bit) break
    }

    return attacks
}

/**
 * Generate queen attacks (combination of rook and bishop)
 * Note: In standard chess. In Makruk, "Met" only moves one square diagonally.
 */
export function getQueenAttacks(square: number, occupancy: Bitboard): Bitboard {
    return getRookAttacks(square, occupancy) | getBishopAttacks(square, occupancy)
}
