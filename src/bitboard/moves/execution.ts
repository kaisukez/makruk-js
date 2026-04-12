import type { Board } from "bitboard/board/board"
import { Color, Piece } from "common/const"
import type { Move } from "bitboard/types"
import { EMPTY_MASK, FULL_MASK, updateOccupancy } from "bitboard/board/board"

export function applyMove(
    state: Board,
    move: Move
): Board {
    if (move.from < 0 || move.from > 63) {
        throw new Error(`Invalid move.from: ${move.from}`)
    }
    if (move.to < 0 || move.to > 63) {
        throw new Error(`Invalid move.to: ${move.to}`)
    }

    const fromBit = 1n << BigInt(move.from)
    const toBit = 1n << BigInt(move.to)
    const clearFromBit = FULL_MASK ^ fromBit
    const finalPiece = move.promotion || move.piece

    let newState: Board = {
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
        whiteOccupancy: EMPTY_MASK,
        blackOccupancy: EMPTY_MASK,
        allOccupancy: EMPTY_MASK,
    }

    // Remove captured piece
    if (move.captured !== undefined) {
        const enemyColor = move.color === Color.WHITE ? Color.BLACK : Color.WHITE
        const clearToBit = FULL_MASK ^ toBit

        if (enemyColor === Color.WHITE) {
            switch (move.captured) {
                case Piece.BIA:         newState.whiteBia        &= clearToBit; break
                case Piece.FLIPPED_BIA: newState.whiteFlippedBia &= clearToBit; break
                case Piece.MA:          newState.whiteMa         &= clearToBit; break
                case Piece.THON:        newState.whiteThon       &= clearToBit; break
                case Piece.MET:         newState.whiteMet        &= clearToBit; break
                case Piece.RUA:         newState.whiteRua        &= clearToBit; break
                case Piece.KHUN:        newState.whiteKhun       &= clearToBit; break
            }
        } else {
            switch (move.captured) {
                case Piece.BIA:         newState.blackBia        &= clearToBit; break
                case Piece.FLIPPED_BIA: newState.blackFlippedBia &= clearToBit; break
                case Piece.MA:          newState.blackMa         &= clearToBit; break
                case Piece.THON:        newState.blackThon       &= clearToBit; break
                case Piece.MET:         newState.blackMet        &= clearToBit; break
                case Piece.RUA:         newState.blackRua        &= clearToBit; break
                case Piece.KHUN:        newState.blackKhun       &= clearToBit; break
            }
        }
    }

    // Remove moving piece from source square
    if (move.color === Color.WHITE) {
        switch (move.piece) {
            case Piece.BIA:         newState.whiteBia        &= clearFromBit; break
            case Piece.FLIPPED_BIA: newState.whiteFlippedBia &= clearFromBit; break
            case Piece.MA:          newState.whiteMa         &= clearFromBit; break
            case Piece.THON:        newState.whiteThon       &= clearFromBit; break
            case Piece.MET:         newState.whiteMet        &= clearFromBit; break
            case Piece.RUA:         newState.whiteRua        &= clearFromBit; break
            case Piece.KHUN:        newState.whiteKhun       &= clearFromBit; break
        }
    } else {
        switch (move.piece) {
            case Piece.BIA:         newState.blackBia        &= clearFromBit; break
            case Piece.FLIPPED_BIA: newState.blackFlippedBia &= clearFromBit; break
            case Piece.MA:          newState.blackMa         &= clearFromBit; break
            case Piece.THON:        newState.blackThon       &= clearFromBit; break
            case Piece.MET:         newState.blackMet        &= clearFromBit; break
            case Piece.RUA:         newState.blackRua        &= clearFromBit; break
            case Piece.KHUN:        newState.blackKhun       &= clearFromBit; break
        }
    }

    // Place piece (or promoted piece) on destination square
    if (move.color === Color.WHITE) {
        switch (finalPiece) {
            case Piece.BIA:         newState.whiteBia        |= toBit; break
            case Piece.FLIPPED_BIA: newState.whiteFlippedBia |= toBit; break
            case Piece.MA:          newState.whiteMa         |= toBit; break
            case Piece.THON:        newState.whiteThon       |= toBit; break
            case Piece.MET:         newState.whiteMet        |= toBit; break
            case Piece.RUA:         newState.whiteRua        |= toBit; break
            case Piece.KHUN:        newState.whiteKhun       |= toBit; break
        }
    } else {
        switch (finalPiece) {
            case Piece.BIA:         newState.blackBia        |= toBit; break
            case Piece.FLIPPED_BIA: newState.blackFlippedBia |= toBit; break
            case Piece.MA:          newState.blackMa         |= toBit; break
            case Piece.THON:        newState.blackThon       |= toBit; break
            case Piece.MET:         newState.blackMet        |= toBit; break
            case Piece.RUA:         newState.blackRua        |= toBit; break
            case Piece.KHUN:        newState.blackKhun       |= toBit; break
        }
    }

    updateOccupancy(newState)

    return newState
}
