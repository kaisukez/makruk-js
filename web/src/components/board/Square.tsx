import { memo } from 'react'
import { Color, Piece } from '@kaisukez/makruk-js'
import { PieceComponent } from './Piece'

interface SquareProps {
  piece: { color: Color; piece: Piece } | null
  isLight: boolean
  isSelected: boolean
  isLegalMove: boolean
  isLastMove: boolean
  isCheck: boolean
  onClick: () => void
  size: number
}

export const Square = memo(function Square({
  piece,
  isLight,
  isSelected,
  isLegalMove,
  isLastMove,
  isCheck,
  onClick,
  size,
}: SquareProps) {
  let bgClass = isLight ? 'bg-board-light' : 'bg-board-dark'

  if (isCheck) {
    bgClass = 'bg-red-500'
  } else if (isSelected) {
    bgClass = 'bg-yellow-400'
  } else if (isLastMove) {
    bgClass = isLight ? 'bg-yellow-200' : 'bg-yellow-600'
  }

  const dotSize = Math.max(8, size * 0.25)

  return (
    <div
      className={`flex items-center justify-center relative cursor-pointer ${bgClass}`}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      {piece && <PieceComponent color={piece.color} piece={piece.piece} size={size * 0.85} />}
      {isLegalMove && (
        <div
          className={`absolute rounded-full ${
            piece
              ? 'border-4 border-green-500 opacity-50'
              : 'bg-green-500 opacity-50'
          }`}
          style={piece ? { width: size, height: size } : { width: dotSize, height: dotSize }}
        />
      )}
    </div>
  )
})
