import { Color, Piece, SquareIndex } from "common/const"
import type { Countdown } from "bitboard/rules/countdown"

// ============================================================================
// Internal types (low-level bitboard representation)
// ============================================================================

export type Mask64 = bigint

export type BoardState = {
    whiteBia: Mask64
    blackBia: Mask64
    whiteFlippedBia: Mask64
    blackFlippedBia: Mask64
    whiteRua: Mask64
    blackRua: Mask64
    whiteMa: Mask64
    blackMa: Mask64
    whiteThon: Mask64
    blackThon: Mask64
    whiteMet: Mask64
    blackMet: Mask64
    whiteKhun: Mask64
    blackKhun: Mask64
    whiteOccupancy: Mask64
    blackOccupancy: Mask64
    allOccupancy: Mask64
}

export type Move = {
    from: number
    to: number
    piece: Piece
    color: Color
    captured?: Piece
    promotion?: Piece
}

export type MoveInput = string | Move

// ============================================================================
// Public API types (matching 0x88 interface)
// ============================================================================

/**
 * State type - wrapper around BoardState for API compatibility
 */
export interface State {
    board: BoardState
    turn: Color
    moveNumber: number
    fen: string
    countdown: Countdown | null
    fenOccurrence: Record<string, number>
}

/**
 * MoveObject type - wrapper around Move for API compatibility
 */
export interface MoveObject {
    from: SquareIndex
    to: SquareIndex
    piece: Piece
    color: Color
    captured?: Piece
    promotion?: Piece
    san: string
    flags: {
        normal: boolean
        capture: boolean
        promotion: boolean
    }
}

export interface MinimaxOutput {
    bestScore: number
    bestMove: MoveObject | null
}

// ============================================================================
// Internal conversion utilities
// ============================================================================

export function squareToIndex(square: number): SquareIndex {
    const rank = Math.floor(square / 8)
    const file = square % 8
    return (rank * 16 + file) as SquareIndex
}

export function squareIndexToMask64Square(sq: SquareIndex): number {
    const rank = Math.floor(sq / 16)
    const file = sq % 16
    return rank * 8 + file
}
