/**
 * Bitboard representation for Makruk
 *
 * Each bitboard is a 64-bit integer (using BigInt) representing the 8x8 board.
 * Bit 0 = a1, Bit 1 = b1, ..., Bit 7 = h1, Bit 8 = a2, ..., Bit 63 = h8
 *
 * We use 12 bitboards total:
 * - 6 for white pieces (Bia, FlippedBia, Ma, Thon, Met, Rua, Khun)
 * - 6 for black pieces (Bia, FlippedBia, Ma, Thon, Met, Rua, Khun)
 */

import { Color, Piece, SquareIndex } from "common/const"

// Bitboard type (64-bit unsigned integer)
export type Bitboard = bigint

// Bitboard representation of the board state
export interface BitboardState {
    // Individual piece bitboards
    whiteBia: Bitboard
    whiteFlippedBia: Bitboard
    whiteMa: Bitboard
    whiteThon: Bitboard
    whiteMet: Bitboard
    whiteRua: Bitboard
    whiteKhun: Bitboard

    blackBia: Bitboard
    blackFlippedBia: Bitboard
    blackMa: Bitboard
    blackThon: Bitboard
    blackMet: Bitboard
    blackRua: Bitboard
    blackKhun: Bitboard

    // Occupancy bitboards (computed on demand)
    whiteOccupancy: Bitboard
    blackOccupancy: Bitboard
    allOccupancy: Bitboard
}

// Constants
export const EMPTY_BITBOARD: Bitboard = 0n
export const FULL_BITBOARD: Bitboard = 0xFFFFFFFFFFFFFFFFn

// Rank masks
export const RANK_1: Bitboard = 0xFFn
export const RANK_2: Bitboard = 0xFF00n
export const RANK_3: Bitboard = 0xFF0000n
export const RANK_4: Bitboard = 0xFF000000n
export const RANK_5: Bitboard = 0xFF00000000n
export const RANK_6: Bitboard = 0xFF0000000000n
export const RANK_7: Bitboard = 0xFF000000000000n
export const RANK_8: Bitboard = 0xFF00000000000000n

// File masks
export const FILE_A: Bitboard = 0x0101010101010101n
export const FILE_B: Bitboard = 0x0202020202020202n
export const FILE_C: Bitboard = 0x0404040404040404n
export const FILE_D: Bitboard = 0x0808080808080808n
export const FILE_E: Bitboard = 0x1010101010101010n
export const FILE_F: Bitboard = 0x2020202020202020n
export const FILE_G: Bitboard = 0x4040404040404040n
export const FILE_H: Bitboard = 0x8080808080808080n

/**
 * Convert 0x88 square index to bitboard square (0-63)
 */
export function squareIndexToBitboardSquare(squareIndex: SquareIndex): number {
    const rank = Math.floor(squareIndex / 16)
    const file = squareIndex % 16
    return rank * 8 + file
}

/**
 * Convert bitboard square (0-63) to 0x88 square index
 */
export function bitboardSquareToSquareIndex(square: number): SquareIndex {
    const rank = Math.floor(square / 8)
    const file = square % 8
    return (rank * 16 + file) as SquareIndex
}

/**
 * Set a bit at the given square
 */
export function setBit(bitboard: Bitboard, square: number): Bitboard {
    return bitboard | (1n << BigInt(square))
}

/**
 * Clear a bit at the given square
 */
export function clearBit(bitboard: Bitboard, square: number): Bitboard {
    const ALL_BITS = 0xFFFFFFFFFFFFFFFFn
    const mask = 1n << BigInt(square)
    return bitboard & (ALL_BITS ^ mask)
}

/**
 * Get bit at the given square (returns 1 or 0)
 */
export function getBit(bitboard: Bitboard, square: number): number {
    return (bitboard & (1n << BigInt(square))) !== 0n ? 1 : 0
}

/**
 * Count the number of set bits (population count)
 */
export function popCount(bitboard: Bitboard): number {
    let count = 0
    let bb = bitboard

    while (bb !== 0n) {
        count++
        bb &= bb - 1n // Clear the least significant bit
    }

    return count
}

/**
 * Get the index of the least significant bit (LSB)
 * Returns -1 if bitboard is empty
 */
export function getLSB(bitboard: Bitboard): number {
    if (bitboard === 0n) return -1

    let square = 0
    let bb = bitboard

    // Find the position of the LSB
    while ((bb & 1n) === 0n) {
        bb >>= 1n
        square++
        if (square > 63) {
            throw new Error(`getLSB: square ${square} exceeds 63, bitboard=${bitboard.toString(16)}`)
        }
    }

    return square
}

/**
 * Pop the least significant bit and return its index
 * Returns both the new bitboard and the popped square
 */
export function popLSB(bitboard: Bitboard): { bb: Bitboard; square: number } {
    const square = getLSB(bitboard)
    const bb = bitboard & (bitboard - 1n) // Clear LSB
    return { bb, square }
}

/**
 * Get the index of the most significant bit (MSB)
 * Returns -1 if bitboard is empty
 */
export function getMSB(bitboard: Bitboard): number {
    if (bitboard === 0n) return -1

    let square = 0
    let bb = bitboard

    while (bb > 1n) {
        bb >>= 1n
        square++
    }

    return square
}

/**
 * Shift bitboard north (up one rank)
 */
export function shiftNorth(bitboard: Bitboard): Bitboard {
    return bitboard << 8n
}

/**
 * Shift bitboard south (down one rank)
 */
export function shiftSouth(bitboard: Bitboard): Bitboard {
    return bitboard >> 8n
}

/**
 * Shift bitboard east (right one file)
 */
export function shiftEast(bitboard: Bitboard): Bitboard {
    return (bitboard & (FULL_BITBOARD ^ FILE_H)) << 1n
}

/**
 * Shift bitboard west (left one file)
 */
export function shiftWest(bitboard: Bitboard): Bitboard {
    return (bitboard & (FULL_BITBOARD ^ FILE_A)) >> 1n
}

/**
 * Shift bitboard north-east
 */
export function shiftNorthEast(bitboard: Bitboard): Bitboard {
    return (bitboard & (FULL_BITBOARD ^ FILE_H)) << 9n
}

/**
 * Shift bitboard north-west
 */
export function shiftNorthWest(bitboard: Bitboard): Bitboard {
    return (bitboard & (FULL_BITBOARD ^ FILE_A)) << 7n
}

/**
 * Shift bitboard south-east
 */
export function shiftSouthEast(bitboard: Bitboard): Bitboard {
    return (bitboard & (FULL_BITBOARD ^ FILE_H)) >> 7n
}

/**
 * Shift bitboard south-west
 */
export function shiftSouthWest(bitboard: Bitboard): Bitboard {
    return (bitboard & (FULL_BITBOARD ^ FILE_A)) >> 9n
}

/**
 * Create an empty bitboard state
 */
export function createEmptyBitboardState(): BitboardState {
    return {
        whiteBia: EMPTY_BITBOARD,
        whiteFlippedBia: EMPTY_BITBOARD,
        whiteMa: EMPTY_BITBOARD,
        whiteThon: EMPTY_BITBOARD,
        whiteMet: EMPTY_BITBOARD,
        whiteRua: EMPTY_BITBOARD,
        whiteKhun: EMPTY_BITBOARD,

        blackBia: EMPTY_BITBOARD,
        blackFlippedBia: EMPTY_BITBOARD,
        blackMa: EMPTY_BITBOARD,
        blackThon: EMPTY_BITBOARD,
        blackMet: EMPTY_BITBOARD,
        blackRua: EMPTY_BITBOARD,
        blackKhun: EMPTY_BITBOARD,

        whiteOccupancy: EMPTY_BITBOARD,
        blackOccupancy: EMPTY_BITBOARD,
        allOccupancy: EMPTY_BITBOARD,
    }
}

/**
 * Update occupancy bitboards
 */
export function updateOccupancy(state: BitboardState): void {
    state.whiteOccupancy =
        state.whiteBia |
        state.whiteFlippedBia |
        state.whiteMa |
        state.whiteThon |
        state.whiteMet |
        state.whiteRua |
        state.whiteKhun

    state.blackOccupancy =
        state.blackBia |
        state.blackFlippedBia |
        state.blackMa |
        state.blackThon |
        state.blackMet |
        state.blackRua |
        state.blackKhun

    state.allOccupancy = state.whiteOccupancy | state.blackOccupancy
}

/**
 * Get the bitboard for a specific piece
 */
export function getPieceBitboard(state: BitboardState, color: Color, piece: Piece): Bitboard {
    if (color === Color.WHITE) {
        switch (piece) {
            case Piece.BIA: return state.whiteBia
            case Piece.FLIPPED_BIA: return state.whiteFlippedBia
            case Piece.MA: return state.whiteMa
            case Piece.THON: return state.whiteThon
            case Piece.MET: return state.whiteMet
            case Piece.RUA: return state.whiteRua
            case Piece.KHUN: return state.whiteKhun
            default: return EMPTY_BITBOARD
        }
    } else {
        switch (piece) {
            case Piece.BIA: return state.blackBia
            case Piece.FLIPPED_BIA: return state.blackFlippedBia
            case Piece.MA: return state.blackMa
            case Piece.THON: return state.blackThon
            case Piece.MET: return state.blackMet
            case Piece.RUA: return state.blackRua
            case Piece.KHUN: return state.blackKhun
            default: return EMPTY_BITBOARD
        }
    }
}

/**
 * Set a piece on the bitboard
 */
export function setPiece(state: BitboardState, color: Color, piece: Piece, square: number): void {
    const bit = 1n << BigInt(square)

    if (color === Color.WHITE) {
        switch (piece) {
            case Piece.BIA: state.whiteBia |= bit; break
            case Piece.FLIPPED_BIA: state.whiteFlippedBia |= bit; break
            case Piece.MA: state.whiteMa |= bit; break
            case Piece.THON: state.whiteThon |= bit; break
            case Piece.MET: state.whiteMet |= bit; break
            case Piece.RUA: state.whiteRua |= bit; break
            case Piece.KHUN: state.whiteKhun |= bit; break
        }
    } else {
        switch (piece) {
            case Piece.BIA: state.blackBia |= bit; break
            case Piece.FLIPPED_BIA: state.blackFlippedBia |= bit; break
            case Piece.MA: state.blackMa |= bit; break
            case Piece.THON: state.blackThon |= bit; break
            case Piece.MET: state.blackMet |= bit; break
            case Piece.RUA: state.blackRua |= bit; break
            case Piece.KHUN: state.blackKhun |= bit; break
        }
    }

    updateOccupancy(state)
}

/**
 * Remove a piece from the bitboard
 */
export function removePiece(state: BitboardState, color: Color, piece: Piece, square: number): void {
    const ALL_BITS = 0xFFFFFFFFFFFFFFFFn
    const mask = 1n << BigInt(square)
    const bit = ALL_BITS ^ mask

    if (color === Color.WHITE) {
        switch (piece) {
            case Piece.BIA: state.whiteBia &= bit; break
            case Piece.FLIPPED_BIA: state.whiteFlippedBia &= bit; break
            case Piece.MA: state.whiteMa &= bit; break
            case Piece.THON: state.whiteThon &= bit; break
            case Piece.MET: state.whiteMet &= bit; break
            case Piece.RUA: state.whiteRua &= bit; break
            case Piece.KHUN: state.whiteKhun &= bit; break
        }
    } else {
        switch (piece) {
            case Piece.BIA: state.blackBia &= bit; break
            case Piece.FLIPPED_BIA: state.blackFlippedBia &= bit; break
            case Piece.MA: state.blackMa &= bit; break
            case Piece.THON: state.blackThon &= bit; break
            case Piece.MET: state.blackMet &= bit; break
            case Piece.RUA: state.blackRua &= bit; break
            case Piece.KHUN: state.blackKhun &= bit; break
        }
    }

    updateOccupancy(state)
}

/**
 * Get piece at a square
 * Returns [color, piece] or null if empty
 */
export function getPieceAt(state: BitboardState, square: number): [Color, Piece] | null {
    const bit = 1n << BigInt(square)

    // Check white pieces
    if (state.whiteBia & bit) return [Color.WHITE, Piece.BIA]
    if (state.whiteFlippedBia & bit) return [Color.WHITE, Piece.FLIPPED_BIA]
    if (state.whiteMa & bit) return [Color.WHITE, Piece.MA]
    if (state.whiteThon & bit) return [Color.WHITE, Piece.THON]
    if (state.whiteMet & bit) return [Color.WHITE, Piece.MET]
    if (state.whiteRua & bit) return [Color.WHITE, Piece.RUA]
    if (state.whiteKhun & bit) return [Color.WHITE, Piece.KHUN]

    // Check black pieces
    if (state.blackBia & bit) return [Color.BLACK, Piece.BIA]
    if (state.blackFlippedBia & bit) return [Color.BLACK, Piece.FLIPPED_BIA]
    if (state.blackMa & bit) return [Color.BLACK, Piece.MA]
    if (state.blackThon & bit) return [Color.BLACK, Piece.THON]
    if (state.blackMet & bit) return [Color.BLACK, Piece.MET]
    if (state.blackRua & bit) return [Color.BLACK, Piece.RUA]
    if (state.blackKhun & bit) return [Color.BLACK, Piece.KHUN]

    return null
}

/**
 * Print bitboard for debugging
 */
export function printBitboard(bitboard: Bitboard): string {
    let result = '\n'

    for (let rank = 7; rank >= 0; rank--) {
        result += `${rank + 1} `
        for (let file = 0; file < 8; file++) {
            const square = rank * 8 + file
            const bit = getBit(bitboard, square)
            result += bit ? '1 ' : '. '
        }
        result += '\n'
    }

    result += '  a b c d e f g h\n'

    return result
}
