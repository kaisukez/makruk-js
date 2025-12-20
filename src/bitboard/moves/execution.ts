import type { Mask64, Board } from "bitboard/board/board"
import { Color, Piece } from "common/const"
import { EMPTY_MASK, updateOccupancy } from "bitboard/board/board"
import type { Move } from "bitboard/moves/generation"

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

    const getPieceMask64 = (s: Board, color: Color, piece: Piece): Mask64 => {
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
        return EMPTY_MASK
    }

    const fromBit = 1n << BigInt(move.from)
    const toBit = 1n << BigInt(move.to)
    // Create mask to clear a bit (NOT operator on BigInt creates negative numbers!)
    const ALL_BITS = 0xFFFFFFFFFFFFFFFFn
    const clearFromBit = ALL_BITS ^ fromBit  // XOR to flip the bit
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

    if (move.captured !== undefined) {
        const enemyColor = move.color === Color.WHITE ? Color.BLACK : Color.WHITE
        const capturedPieceMask = getPieceMask64(newState, enemyColor, move.captured)
        const clearToBit = ALL_BITS ^ toBit

        if (enemyColor === Color.WHITE) {
            switch (move.captured) {
                case Piece.BIA: newState.whiteBia = capturedPieceMask & clearToBit; break
                case Piece.FLIPPED_BIA: newState.whiteFlippedBia = capturedPieceMask & clearToBit; break
                case Piece.MA: newState.whiteMa = capturedPieceMask & clearToBit; break
                case Piece.THON: newState.whiteThon = capturedPieceMask & clearToBit; break
                case Piece.MET: newState.whiteMet = capturedPieceMask & clearToBit; break
                case Piece.RUA: newState.whiteRua = capturedPieceMask & clearToBit; break
                case Piece.KHUN: newState.whiteKhun = capturedPieceMask & clearToBit; break
            }
        } else {
            switch (move.captured) {
                case Piece.BIA: newState.blackBia = capturedPieceMask & clearToBit; break
                case Piece.FLIPPED_BIA: newState.blackFlippedBia = capturedPieceMask & clearToBit; break
                case Piece.MA: newState.blackMa = capturedPieceMask & clearToBit; break
                case Piece.THON: newState.blackThon = capturedPieceMask & clearToBit; break
                case Piece.MET: newState.blackMet = capturedPieceMask & clearToBit; break
                case Piece.RUA: newState.blackRua = capturedPieceMask & clearToBit; break
                case Piece.KHUN: newState.blackKhun = capturedPieceMask & clearToBit; break
            }
        }
    }

    const sourcePieceMask = getPieceMask64(newState, move.color, move.piece)
    if (move.color === Color.WHITE) {
        switch (move.piece) {
            case Piece.BIA: newState.whiteBia = sourcePieceMask & clearFromBit; break
            case Piece.FLIPPED_BIA: newState.whiteFlippedBia = sourcePieceMask & clearFromBit; break
            case Piece.MA: newState.whiteMa = sourcePieceMask & clearFromBit; break
            case Piece.THON: newState.whiteThon = sourcePieceMask & clearFromBit; break
            case Piece.MET: newState.whiteMet = sourcePieceMask & clearFromBit; break
            case Piece.RUA: newState.whiteRua = sourcePieceMask & clearFromBit; break
            case Piece.KHUN: newState.whiteKhun = sourcePieceMask & clearFromBit; break
        }
    } else {
        switch (move.piece) {
            case Piece.BIA: newState.blackBia = sourcePieceMask & clearFromBit; break
            case Piece.FLIPPED_BIA: newState.blackFlippedBia = sourcePieceMask & clearFromBit; break
            case Piece.MA: newState.blackMa = sourcePieceMask & clearFromBit; break
            case Piece.THON: newState.blackThon = sourcePieceMask & clearFromBit; break
            case Piece.MET: newState.blackMet = sourcePieceMask & clearFromBit; break
            case Piece.RUA: newState.blackRua = sourcePieceMask & clearFromBit; break
            case Piece.KHUN: newState.blackKhun = sourcePieceMask & clearFromBit; break
        }
    }

    const destPieceMask = getPieceMask64(newState, move.color, finalPiece)
    if (move.color === Color.WHITE) {
        switch (finalPiece) {
            case Piece.BIA: newState.whiteBia = destPieceMask | toBit; break
            case Piece.FLIPPED_BIA: newState.whiteFlippedBia = destPieceMask | toBit; break
            case Piece.MA: newState.whiteMa = destPieceMask | toBit; break
            case Piece.THON: newState.whiteThon = destPieceMask | toBit; break
            case Piece.MET: newState.whiteMet = destPieceMask | toBit; break
            case Piece.RUA: newState.whiteRua = destPieceMask | toBit; break
            case Piece.KHUN: newState.whiteKhun = destPieceMask | toBit; break
        }
    } else {
        switch (finalPiece) {
            case Piece.BIA: newState.blackBia = destPieceMask | toBit; break
            case Piece.FLIPPED_BIA: newState.blackFlippedBia = destPieceMask | toBit; break
            case Piece.MA: newState.blackMa = destPieceMask | toBit; break
            case Piece.THON: newState.blackThon = destPieceMask | toBit; break
            case Piece.MET: newState.blackMet = destPieceMask | toBit; break
            case Piece.RUA: newState.blackRua = destPieceMask | toBit; break
            case Piece.KHUN: newState.blackKhun = destPieceMask | toBit; break
        }
    }

    updateOccupancy(newState)

    return newState
}
