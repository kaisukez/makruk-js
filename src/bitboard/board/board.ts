/**
 * Mask64 representation for Makruk
 *
 * Each bitboard is a 64-bit integer (using BigInt) representing the 8x8 board.
 * Bit 0 = a1, Bit 1 = b1, ..., Bit 7 = h1, Bit 8 = a2, ..., Bit 63 = h8
 *
 * We use 12 bitboards total:
 * - 6 for white pieces (Bia, FlippedBia, Ma, Thon, Met, Rua, Khun)
 * - 6 for black pieces (Bia, FlippedBia, Ma, Thon, Met, Rua, Khun)
 */

import { Color, Piece, SquareIndex } from "common/const"

// Mask64 type (64-bit unsigned integer)
export type Mask64 = bigint

// Mask64 representation of the board state
export interface Board {
    // Individual piece bitboards
    whiteBia: Mask64
    whiteFlippedBia: Mask64
    whiteMa: Mask64
    whiteThon: Mask64
    whiteMet: Mask64
    whiteRua: Mask64
    whiteKhun: Mask64

    blackBia: Mask64
    blackFlippedBia: Mask64
    blackMa: Mask64
    blackThon: Mask64
    blackMet: Mask64
    blackRua: Mask64
    blackKhun: Mask64

    // Occupancy bitboards (computed on demand)
    whiteOccupancy: Mask64
    blackOccupancy: Mask64
    allOccupancy: Mask64
}

// Constants
export const EMPTY_MASK: Mask64 = 0n
export const FULL_MASK: Mask64 = 0xFFFFFFFFFFFFFFFFn

// Rank masks
export const RANK_1: Mask64 = 0xFFn
export const RANK_2: Mask64 = 0xFF00n
export const RANK_3: Mask64 = 0xFF0000n
export const RANK_4: Mask64 = 0xFF000000n
export const RANK_5: Mask64 = 0xFF00000000n
export const RANK_6: Mask64 = 0xFF0000000000n
export const RANK_7: Mask64 = 0xFF000000000000n
export const RANK_8: Mask64 = 0xFF00000000000000n

// File masks
export const FILE_A: Mask64 = 0x0101010101010101n
export const FILE_B: Mask64 = 0x0202020202020202n
export const FILE_C: Mask64 = 0x0404040404040404n
export const FILE_D: Mask64 = 0x0808080808080808n
export const FILE_E: Mask64 = 0x1010101010101010n
export const FILE_F: Mask64 = 0x2020202020202020n
export const FILE_G: Mask64 = 0x4040404040404040n
export const FILE_H: Mask64 = 0x8080808080808080n

/**
 * Convert 0x88 square index to bitboard square (0-63)
 */
export function squareIndexToMask64Square(squareIndex: SquareIndex): number {
    const rank = Math.floor(squareIndex / 16)
    const file = squareIndex % 16
    return rank * 8 + file
}

/**
 * Convert bitboard square (0-63) to 0x88 square index
 */
export function squareToIndex(square: number): SquareIndex {
    const rank = Math.floor(square / 8)
    const file = square % 8
    return (rank * 16 + file) as SquareIndex
}

/**
 * Set a bit at the given square
 */
export function setBit(bitboard: Mask64, square: number): Mask64 {
    return bitboard | (1n << BigInt(square))
}

/**
 * Clear a bit at the given square
 */
export function clearBit(bitboard: Mask64, square: number): Mask64 {
    const ALL_BITS = 0xFFFFFFFFFFFFFFFFn
    const mask = 1n << BigInt(square)
    return bitboard & (ALL_BITS ^ mask)
}

/**
 * Get bit at the given square (returns 1 or 0)
 */
export function getBit(bitboard: Mask64, square: number): number {
    return (bitboard & (1n << BigInt(square))) !== 0n ? 1 : 0
}

/**
 * Count the number of set bits (population count)
 */
export function popCount(bitboard: Mask64): number {
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
export function getLSB(bitboard: Mask64): number {
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
export function popLSB(bitboard: Mask64): { bb: Mask64; square: number } {
    const square = getLSB(bitboard)
    const bb = bitboard & (bitboard - 1n) // Clear LSB
    return { bb, square }
}

/**
 * Get the index of the most significant bit (MSB)
 * Returns -1 if bitboard is empty
 */
export function getMSB(bitboard: Mask64): number {
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
export function shiftNorth(bitboard: Mask64): Mask64 {
    return bitboard << 8n
}

/**
 * Shift bitboard south (down one rank)
 */
export function shiftSouth(bitboard: Mask64): Mask64 {
    return bitboard >> 8n
}

/**
 * Shift bitboard east (right one file)
 */
export function shiftEast(bitboard: Mask64): Mask64 {
    return (bitboard & (FULL_MASK ^ FILE_H)) << 1n
}

/**
 * Shift bitboard west (left one file)
 */
export function shiftWest(bitboard: Mask64): Mask64 {
    return (bitboard & (FULL_MASK ^ FILE_A)) >> 1n
}

/**
 * Shift bitboard north-east
 */
export function shiftNorthEast(bitboard: Mask64): Mask64 {
    return (bitboard & (FULL_MASK ^ FILE_H)) << 9n
}

/**
 * Shift bitboard north-west
 */
export function shiftNorthWest(bitboard: Mask64): Mask64 {
    return (bitboard & (FULL_MASK ^ FILE_A)) << 7n
}

/**
 * Shift bitboard south-east
 */
export function shiftSouthEast(bitboard: Mask64): Mask64 {
    return (bitboard & (FULL_MASK ^ FILE_H)) >> 7n
}

/**
 * Shift bitboard south-west
 */
export function shiftSouthWest(bitboard: Mask64): Mask64 {
    return (bitboard & (FULL_MASK ^ FILE_A)) >> 9n
}

/**
 * Create an empty bitboard state
 */
export function createEmptyBoard(): Board {
    return {
        whiteBia: EMPTY_MASK,
        whiteFlippedBia: EMPTY_MASK,
        whiteMa: EMPTY_MASK,
        whiteThon: EMPTY_MASK,
        whiteMet: EMPTY_MASK,
        whiteRua: EMPTY_MASK,
        whiteKhun: EMPTY_MASK,

        blackBia: EMPTY_MASK,
        blackFlippedBia: EMPTY_MASK,
        blackMa: EMPTY_MASK,
        blackThon: EMPTY_MASK,
        blackMet: EMPTY_MASK,
        blackRua: EMPTY_MASK,
        blackKhun: EMPTY_MASK,

        whiteOccupancy: EMPTY_MASK,
        blackOccupancy: EMPTY_MASK,
        allOccupancy: EMPTY_MASK,
    }
}

/**
 * Update occupancy bitboards
 */
export function updateOccupancy(state: Board): void {
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
export function getPieceMask64(state: Board, color: Color, piece: Piece): Mask64 {
    if (color === Color.WHITE) {
        switch (piece) {
            case Piece.BIA: return state.whiteBia
            case Piece.FLIPPED_BIA: return state.whiteFlippedBia
            case Piece.MA: return state.whiteMa
            case Piece.THON: return state.whiteThon
            case Piece.MET: return state.whiteMet
            case Piece.RUA: return state.whiteRua
            case Piece.KHUN: return state.whiteKhun
            default: return EMPTY_MASK
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
            default: return EMPTY_MASK
        }
    }
}

/**
 * Set a piece on the bitboard
 */
export function setPiece(state: Board, color: Color, piece: Piece, square: number): void {
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
export function removePiece(state: Board, color: Color, piece: Piece, square: number): void {
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
export function getPieceAt(state: Board, square: number): [Color, Piece] | null {
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
export function printMask64(bitboard: Mask64): string {
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

/**
 * Clone a bitboard state
 */
export function cloneBoard(state: Board): Board {
    return { ...state }
}

/**
 * Place a piece on the board (returns new state)
 * If there's already a piece at the square, it will be replaced
 */
export function put(
    state: Board,
    color: Color,
    piece: Piece,
    square: number
): Board {
    const newState = cloneBoard(state)

    // Remove existing piece if any
    const existingPiece = getPieceAt(newState, square)
    if (existingPiece) {
        const [existingColor, existingPieceType] = existingPiece
        removePiece(newState, existingColor, existingPieceType, square)
    }

    // Place new piece
    setPiece(newState, color, piece, square)

    return newState
}

/**
 * Remove a piece from the board (returns new state)
 */
export function remove(state: Board, square: number): Board {
    const newState = cloneBoard(state)

    // Find and remove the piece at this square
    const existingPiece = getPieceAt(newState, square)
    if (existingPiece) {
        const [color, piece] = existingPiece
        removePiece(newState, color, piece, square)
    }

    return newState
}
