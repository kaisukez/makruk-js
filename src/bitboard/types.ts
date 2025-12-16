import { Color, Piece } from "common/const"

export type Bitboard = bigint

export type BitboardState = {
    whiteBia: Bitboard
    blackBia: Bitboard
    whiteFlippedBia: Bitboard
    blackFlippedBia: Bitboard
    whiteRua: Bitboard
    blackRua: Bitboard
    whiteMa: Bitboard
    blackMa: Bitboard
    whiteThon: Bitboard
    blackThon: Bitboard
    whiteMet: Bitboard
    blackMet: Bitboard
    whiteKhun: Bitboard
    blackKhun: Bitboard
    whiteOccupancy: Bitboard
    blackOccupancy: Bitboard
    allOccupancy: Bitboard
}

export type BitboardMove = {
    from: number
    to: number
    piece: Piece
    color: Color
    captured?: Piece
    promotion?: Piece
}

export type Move = string | BitboardMove
