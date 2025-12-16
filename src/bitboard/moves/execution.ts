/**
 * Bitboard move execution
 */

import type { Bitboard, BitboardState } from "bitboard/board/board"
import { Color, Piece } from "common/const"
import { EMPTY_BITBOARD, updateOccupancy } from "bitboard/board/board"
import type { BitboardMove } from "bitboard/moves/generation"

/**
 * Apply a bitboard move to the state and return a new state
 */
export function applyBitboardMove(
    state: BitboardState,
    move: BitboardMove
): BitboardState {
    // Validate move squares
    if (move.from < 0 || move.from > 63) {
        throw new Error(`Invalid move.from: ${move.from}`)
    }
    if (move.to < 0 || move.to > 63) {
        throw new Error(`Invalid move.to: ${move.to}`)
    }

    // Helper to get bitboard for a piece type from newState
    const getBB = (s: BitboardState, color: Color, piece: Piece): Bitboard => {
        if (color === Color.WHITE) {
            switch (piece) {
                case Piece.BIA: return s.whiteBia
                case Piece.FLIPPED_BIA: return s.whiteFlippedBia
                case Piece.MA: return s.whiteMa
                case Piece.THON: return s.whiteThon
                case Piece.MET: return s.whiteMet
                case Piece.RUA: return s.whiteRua
                case Piece.KHUN: return s.whiteKhun
            }
        } else {
            switch (piece) {
                case Piece.BIA: return s.blackBia
                case Piece.FLIPPED_BIA: return s.blackFlippedBia
                case Piece.MA: return s.blackMa
                case Piece.THON: return s.blackThon
                case Piece.MET: return s.blackMet
                case Piece.RUA: return s.blackRua
                case Piece.KHUN: return s.blackKhun
            }
        }
        return EMPTY_BITBOARD
    }

    const fromBit = 1n << BigInt(move.from)
    const toBit = 1n << BigInt(move.to)
    // Create mask to clear a bit (NOT operator on BigInt creates negative numbers!)
    const ALL_BITS = 0xFFFFFFFFFFFFFFFFn
    const clearFromBit = ALL_BITS ^ fromBit  // XOR to flip the bit
    const finalPiece = move.promotion || move.piece

    // Start with current state
    let newState: BitboardState = {
        whiteBia: state.whiteBia,
        whiteFlippedBia: state.whiteFlippedBia,
        whiteMa: state.whiteMa,
        whiteThon: state.whiteThon,
        whiteMet: state.whiteMet,
        whiteRua: state.whiteRua,
        whiteKhun: state.whiteKhun,
        blackBia: state.blackBia,
        blackFlippedBia: state.blackFlippedBia,
        blackMa: state.blackMa,
        blackThon: state.blackThon,
        blackMet: state.blackMet,
        blackRua: state.blackRua,
        blackKhun: state.blackKhun,
        whiteOccupancy: EMPTY_BITBOARD,
        blackOccupancy: EMPTY_BITBOARD,
        allOccupancy: EMPTY_BITBOARD,
    }

    // Remove captured piece if any
    if (move.captured !== undefined) {
        const enemyColor = move.color === Color.WHITE ? Color.BLACK : Color.WHITE
        const capturedBB = getBB(newState, enemyColor, move.captured)
        const clearToBit = ALL_BITS ^ toBit

        if (enemyColor === Color.WHITE) {
            switch (move.captured) {
                case Piece.BIA: newState.whiteBia = capturedBB & clearToBit; break
                case Piece.FLIPPED_BIA: newState.whiteFlippedBia = capturedBB & clearToBit; break
                case Piece.MA: newState.whiteMa = capturedBB & clearToBit; break
                case Piece.THON: newState.whiteThon = capturedBB & clearToBit; break
                case Piece.MET: newState.whiteMet = capturedBB & clearToBit; break
                case Piece.RUA: newState.whiteRua = capturedBB & clearToBit; break
                case Piece.KHUN: newState.whiteKhun = capturedBB & clearToBit; break
            }
        } else {
            switch (move.captured) {
                case Piece.BIA: newState.blackBia = capturedBB & clearToBit; break
                case Piece.FLIPPED_BIA: newState.blackFlippedBia = capturedBB & clearToBit; break
                case Piece.MA: newState.blackMa = capturedBB & clearToBit; break
                case Piece.THON: newState.blackThon = capturedBB & clearToBit; break
                case Piece.MET: newState.blackMet = capturedBB & clearToBit; break
                case Piece.RUA: newState.blackRua = capturedBB & clearToBit; break
                case Piece.KHUN: newState.blackKhun = capturedBB & clearToBit; break
            }
        }
    }

    // Remove piece from source square
    const sourceBB = getBB(newState, move.color, move.piece)
    if (move.color === Color.WHITE) {
        switch (move.piece) {
            case Piece.BIA: newState.whiteBia = sourceBB & clearFromBit; break
            case Piece.FLIPPED_BIA: newState.whiteFlippedBia = sourceBB & clearFromBit; break
            case Piece.MA: newState.whiteMa = sourceBB & clearFromBit; break
            case Piece.THON: newState.whiteThon = sourceBB & clearFromBit; break
            case Piece.MET: newState.whiteMet = sourceBB & clearFromBit; break
            case Piece.RUA: newState.whiteRua = sourceBB & clearFromBit; break
            case Piece.KHUN: newState.whiteKhun = sourceBB & clearFromBit; break
        }
    } else {
        switch (move.piece) {
            case Piece.BIA: newState.blackBia = sourceBB & clearFromBit; break
            case Piece.FLIPPED_BIA: newState.blackFlippedBia = sourceBB & clearFromBit; break
            case Piece.MA: newState.blackMa = sourceBB & clearFromBit; break
            case Piece.THON: newState.blackThon = sourceBB & clearFromBit; break
            case Piece.MET: newState.blackMet = sourceBB & clearFromBit; break
            case Piece.RUA: newState.blackRua = sourceBB & clearFromBit; break
            case Piece.KHUN: newState.blackKhun = sourceBB & clearFromBit; break
        }
    }

    // Add piece to destination square (with promotion if applicable)
    const destBB = getBB(newState, move.color, finalPiece)
    if (move.color === Color.WHITE) {
        switch (finalPiece) {
            case Piece.BIA: newState.whiteBia = destBB | toBit; break
            case Piece.FLIPPED_BIA: newState.whiteFlippedBia = destBB | toBit; break
            case Piece.MA: newState.whiteMa = destBB | toBit; break
            case Piece.THON: newState.whiteThon = destBB | toBit; break
            case Piece.MET: newState.whiteMet = destBB | toBit; break
            case Piece.RUA: newState.whiteRua = destBB | toBit; break
            case Piece.KHUN: newState.whiteKhun = destBB | toBit; break
        }
    } else {
        switch (finalPiece) {
            case Piece.BIA: newState.blackBia = destBB | toBit; break
            case Piece.FLIPPED_BIA: newState.blackFlippedBia = destBB | toBit; break
            case Piece.MA: newState.blackMa = destBB | toBit; break
            case Piece.THON: newState.blackThon = destBB | toBit; break
            case Piece.MET: newState.blackMet = destBB | toBit; break
            case Piece.RUA: newState.blackRua = destBB | toBit; break
            case Piece.KHUN: newState.blackKhun = destBB | toBit; break
        }
    }

    // Update occupancy bitboards
    updateOccupancy(newState)

    return newState
}
