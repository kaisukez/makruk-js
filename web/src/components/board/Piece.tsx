import { memo } from 'react'
import { Color, Piece } from '@kaisukez/makruk-js'

interface PieceProps {
  color: Color
  piece: Piece
  size: number
}

const PIECE_IMAGES: Record<Piece, string> = {
  [Piece.BIA]: 'bia',
  [Piece.FLIPPED_BIA]: 'biangai',
  [Piece.MA]: 'ma',
  [Piece.THON]: 'khon',
  [Piece.MET]: 'met',
  [Piece.RUA]: 'rua',
  [Piece.KHUN]: 'khun',
}

export const PieceComponent = memo(function PieceComponent({ color, piece, size }: PieceProps) {
  const pieceName = PIECE_IMAGES[piece]
  const colorSuffix = color === Color.WHITE ? 'w' : 'b'
  const basePath = import.meta.env.BASE_URL || '/'
  const imagePath = `${basePath}makruk-pieces-image-master/${pieceName}_${colorSuffix}.svg`

  return (
    <img
      src={imagePath}
      alt={`${color === Color.WHITE ? 'White' : 'Black'} ${piece}`}
      className="select-none pointer-events-none"
      style={{ width: size, height: size }}
      draggable={false}
    />
  )
})
