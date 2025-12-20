import { useMemo, useRef, useEffect } from 'react'
import { Color, Piece, isCheck as checkIsCheck } from '@kaisukez/makruk-js'
import type { Game, Move } from '@kaisukez/makruk-js'
import { Square } from './Square'
import { FILE_NAMES, RANK_NAMES } from '../../utils/constants'

interface BoardProps {
  state: Game
  orientation: Color
  selectedSquare: number | null
  legalMoves: Move[]
  lastMove: Move | null
  onSquareClick: (square: number) => void
  disabled?: boolean
  dimmed?: boolean
  size: number
}

function getPieceAt(state: Game, square: number): { color: Color; piece: Piece } | null {
  const board = state.board
  const bit = 1n << BigInt(square)

  if (board.whiteBia & bit) return { color: Color.WHITE, piece: Piece.BIA }
  if (board.whiteFlippedBia & bit) return { color: Color.WHITE, piece: Piece.FLIPPED_BIA }
  if (board.whiteMa & bit) return { color: Color.WHITE, piece: Piece.MA }
  if (board.whiteThon & bit) return { color: Color.WHITE, piece: Piece.THON }
  if (board.whiteMet & bit) return { color: Color.WHITE, piece: Piece.MET }
  if (board.whiteRua & bit) return { color: Color.WHITE, piece: Piece.RUA }
  if (board.whiteKhun & bit) return { color: Color.WHITE, piece: Piece.KHUN }

  if (board.blackBia & bit) return { color: Color.BLACK, piece: Piece.BIA }
  if (board.blackFlippedBia & bit) return { color: Color.BLACK, piece: Piece.FLIPPED_BIA }
  if (board.blackMa & bit) return { color: Color.BLACK, piece: Piece.MA }
  if (board.blackThon & bit) return { color: Color.BLACK, piece: Piece.THON }
  if (board.blackMet & bit) return { color: Color.BLACK, piece: Piece.MET }
  if (board.blackRua & bit) return { color: Color.BLACK, piece: Piece.RUA }
  if (board.blackKhun & bit) return { color: Color.BLACK, piece: Piece.KHUN }

  return null
}

function getKingSquare(state: Game, color: Color): number | null {
  const board = state.board
  const kingBB = color === Color.WHITE ? board.whiteKhun : board.blackKhun
  if (kingBB === 0n) return null

  let square = 0
  let bb = kingBB
  while ((bb & 1n) === 0n) {
    bb >>= 1n
    square++
  }
  return square
}

const BASE_SIZE = 480
const BASE_SQUARE_SIZE = BASE_SIZE / 8

export function Board({
  state,
  orientation,
  selectedSquare,
  legalMoves,
  lastMove,
  onSquareClick,
  disabled = false,
  dimmed = false,
  size,
}: BoardProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      const scale = size / BASE_SIZE
      containerRef.current.style.setProperty('--board-size', `${size}px`)
      containerRef.current.style.setProperty('--board-scale', `${scale}`)
    }
  }, [size])

  const isInCheck = checkIsCheck(state)
  const kingInCheckSquare = isInCheck ? getKingSquare(state, state.turn) : null

  const legalMoveSquares = useMemo(() => {
    return new Set(legalMoves.filter((m) => m.from === selectedSquare).map((m) => m.to))
  }, [legalMoves, selectedSquare])

  const lastMoveSquares = useMemo(() => {
    if (!lastMove) return new Set<number>()
    return new Set([lastMove.from, lastMove.to])
  }, [lastMove])

  const squares = useMemo(() => {
    const result: number[] = []
    for (let rank = 7; rank >= 0; rank--) {
      for (let file = 0; file < 8; file++) {
        result.push(rank * 8 + file)
      }
    }
    return orientation === Color.WHITE ? result : result.reverse()
  }, [orientation])

  const files = orientation === Color.WHITE ? FILE_NAMES : [...FILE_NAMES].reverse()
  const ranks = orientation === Color.WHITE ? [...RANK_NAMES].reverse() : RANK_NAMES

  const initialScale = size / BASE_SIZE

  return (
    <div
      ref={containerRef}
      className={`select-none ${disabled ? 'pointer-events-none' : ''} ${dimmed ? 'opacity-80' : ''}`}
      style={{
        '--board-size': `${size}px`,
        '--board-scale': `${initialScale}`,
        width: 'calc(var(--board-size) + 48px)',
        height: 'calc(var(--board-size) + 20px)',
      } as React.CSSProperties}
    >
      <div className="flex">
        <div
          className="w-6 flex-shrink-0 flex flex-col justify-around"
          style={{ height: 'var(--board-size)' }}
        >
          {ranks.map((rank) => (
            <div key={rank} className="text-xs text-gray-400 pr-1 text-right">
              {rank}
            </div>
          ))}
        </div>
        <div style={{ width: 'var(--board-size)', height: 'var(--board-size)' }}>
          <div
            className="grid grid-cols-8 border-2 border-gray-700 rounded overflow-hidden"
            style={{
              width: BASE_SIZE,
              height: BASE_SIZE,
              transform: 'scale(var(--board-scale))',
              transformOrigin: 'top left',
            }}
          >
            {squares.map((square) => {
              const file = square & 7
              const rank = square >> 3
              const isLight = (file + rank) % 2 === 1
              const piece = getPieceAt(state, square)

              return (
                <Square
                  key={square}
                  piece={piece}
                  isLight={isLight}
                  isSelected={selectedSquare === square}
                  isLegalMove={legalMoveSquares.has(square)}
                  isLastMove={lastMoveSquares.has(square)}
                  isCheck={kingInCheckSquare === square}
                  onClick={() => onSquareClick(square)}
                  size={BASE_SQUARE_SIZE}
                />
              )
            })}
          </div>
        </div>
        <div className="w-6 flex-shrink-0" />
      </div>
      <div className="flex">
        <div className="w-6 flex-shrink-0" />
        <div className="grid grid-cols-8 flex-shrink-0" style={{ width: 'var(--board-size)' }}>
          {files.map((file) => (
            <div key={file} className="text-center text-xs text-gray-400 pt-1">
              {file}
            </div>
          ))}
        </div>
        <div className="w-6 flex-shrink-0" />
      </div>
    </div>
  )
}
