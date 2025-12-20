import { Color, Piece } from "common/const"
import type { Countdown } from "common/types"

export type Mask64 = bigint

export type Game = {
    board: Board
    turn: Color
    moveNumber: number
    countdown: Countdown | null
    hash: bigint
    positionOccurrence: Map<bigint, number>
}

export type Board = {
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

export type MinimaxOutput = {
    bestScore: number
    bestMove: Move | null
    nodesSearched: number
}
