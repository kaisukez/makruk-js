import { Piece, Color } from '@kaisukez/makruk-js'

export const PIECE_SYMBOLS: Record<Piece, string> = {
  [Piece.KHUN]: 'K',
  [Piece.MET]: 'Q',
  [Piece.RUA]: 'R',
  [Piece.MA]: 'N',
  [Piece.THON]: 'B',
  [Piece.BIA]: 'P',
  [Piece.FLIPPED_BIA]: 'F',
}

export const PIECE_UNICODE: Record<Color, Record<Piece, string>> = {
  [Color.WHITE]: {
    [Piece.KHUN]: '♔',
    [Piece.MET]: '♕',
    [Piece.RUA]: '♖',
    [Piece.MA]: '♘',
    [Piece.THON]: '♗',
    [Piece.BIA]: '♙',
    [Piece.FLIPPED_BIA]: '⛀',
  },
  [Color.BLACK]: {
    [Piece.KHUN]: '♚',
    [Piece.MET]: '♛',
    [Piece.RUA]: '♜',
    [Piece.MA]: '♞',
    [Piece.THON]: '♝',
    [Piece.BIA]: '♟',
    [Piece.FLIPPED_BIA]: '⛂',
  },
}

export const FILE_NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
export const RANK_NAMES = ['1', '2', '3', '4', '5', '6', '7', '8']

export function squareToNotation(square: number): string {
  const file = square & 7
  const rank = square >> 3
  return FILE_NAMES[file] + RANK_NAMES[rank]
}

export function notationToSquare(notation: string): number {
  const file = notation.charCodeAt(0) - 'a'.charCodeAt(0)
  const rank = parseInt(notation[1]) - 1
  return rank * 8 + file
}
