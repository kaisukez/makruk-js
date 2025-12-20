import { useState, useCallback, useMemo } from 'react'
import {
  createInitialState,
  move as makeMove,
  generateLegalMoves,
  isCheck,
  isCheckmate,
  isStalemate,
  isDraw,
  isGameOver,
  isInsufficientMaterial,
  isThreefoldRepetition,
  isCountdownExpired,
  exportFen,
  createGameFromFen,
  moveToSan,
  importPgn,
} from '@kaisukez/makruk-js'
import type { Move, Game } from '@kaisukez/makruk-js'

export type MoveWithSan = Move & { san: string }

interface HistoryEntry {
  state: Game
  move: MoveWithSan | null
}

export function useGame() {
  const [history, setHistory] = useState<HistoryEntry[]>(() => [
    { state: createInitialState(), move: null }
  ])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null)

  const gameState = history[currentIndex].state
  const isAtEnd = currentIndex === history.length - 1

  const legalMoves = useMemo(
    () => generateLegalMoves(gameState),
    [gameState]
  )

  const legalMovesForSquare = useMemo(() => {
    if (selectedSquare === null) return []
    return legalMoves.filter((m) => m.from === selectedSquare)
  }, [legalMoves, selectedSquare])

  const turn = gameState.turn

  const status = useMemo(() => ({
    isCheck: isCheck(gameState),
    isCheckmate: isCheckmate(gameState),
    isStalemate: isStalemate(gameState),
    isDraw: isDraw(gameState),
    isGameOver: isGameOver(gameState),
    isInsufficientMaterial: isInsufficientMaterial(gameState),
    isThreefoldRepetition: isThreefoldRepetition(gameState),
    isCountdownExpired: isCountdownExpired(gameState.countdown),
  }), [gameState])

  const countdown = gameState.countdown

  const moveHistory = useMemo(() => {
    return history.slice(1).map(entry => entry.move!).filter(Boolean)
  }, [history])

  const lastMove = currentIndex > 0 ? history[currentIndex].move : null

  const selectSquare = useCallback((square: number) => {
    if (selectedSquare === square) {
      setSelectedSquare(null)
      return
    }

    if (selectedSquare !== null) {
      const move = legalMoves.find(
        (m) => m.from === selectedSquare && m.to === square
      )
      if (move) {
        try {
          const san = moveToSan(gameState.board, gameState.turn, move)
          const moveWithSan: MoveWithSan = { ...move, san }
          const newState = makeMove(gameState, move)

          setHistory(prev => {
            const truncated = prev.slice(0, currentIndex + 1)
            return [...truncated, { state: newState, move: moveWithSan }]
          })
          setCurrentIndex(prev => prev + 1)
          setSelectedSquare(null)
          return
        } catch {
          // Invalid move, just select new square
        }
      }
    }

    const clickedPiece = legalMoves.find((m) => m.from === square)
    if (clickedPiece) {
      setSelectedSquare(square)
    } else {
      setSelectedSquare(null)
    }
  }, [gameState, selectedSquare, legalMoves, currentIndex])

  const executeMove = useCallback((move: Move) => {
    try {
      const san = moveToSan(gameState.board, gameState.turn, move)
      const moveWithSan: MoveWithSan = { ...move, san }
      const newState = makeMove(gameState, move)

      setHistory(prev => {
        const truncated = prev.slice(0, currentIndex + 1)
        return [...truncated, { state: newState, move: moveWithSan }]
      })
      setCurrentIndex(prev => prev + 1)
      setSelectedSquare(null)
    } catch (e) {
      console.error('Invalid move:', e)
    }
  }, [gameState, currentIndex])

  const goToMove = useCallback((moveIndex: number) => {
    const targetIndex = moveIndex + 1
    if (targetIndex >= 0 && targetIndex < history.length) {
      setCurrentIndex(targetIndex)
      setSelectedSquare(null)
    }
  }, [history.length])

  const goToStart = useCallback(() => {
    setCurrentIndex(0)
    setSelectedSquare(null)
  }, [])

  const goToEnd = useCallback(() => {
    setCurrentIndex(history.length - 1)
    setSelectedSquare(null)
  }, [history.length])

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setSelectedSquare(null)
    }
  }, [currentIndex])

  const goForward = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedSquare(null)
    }
  }, [currentIndex, history.length])

  const newGame = useCallback(() => {
    setHistory([{ state: createInitialState(), move: null }])
    setCurrentIndex(0)
    setSelectedSquare(null)
  }, [])

  const loadFen = useCallback((fen: string) => {
    try {
      const state = createGameFromFen(fen)
      setHistory([{ state, move: null }])
      setCurrentIndex(0)
      setSelectedSquare(null)
      return true
    } catch (e) {
      console.error('Invalid FEN:', e)
      return false
    }
  }, [])

  const loadPgn = useCallback((pgn: string) => {
    try {
      const states = importPgn(pgn)
      if (states.length === 0) {
        return false
      }
      const newHistory: HistoryEntry[] = states.map((state, i) => {
        if (i === 0) {
          return { state, move: null }
        }
        const prevState = states[i - 1]
        const moves = generateLegalMoves(prevState)
        const appliedMove = moves.find(m => {
          const resultState = makeMove(prevState, m)
          return exportFen(resultState) === exportFen(state)
        })
        if (appliedMove) {
          const san = moveToSan(prevState.board, prevState.turn, appliedMove)
          return { state, move: { ...appliedMove, san } }
        }
        return { state, move: null }
      })
      setHistory(newHistory)
      setCurrentIndex(newHistory.length - 1)
      setSelectedSquare(null)
      return true
    } catch (e) {
      console.error('Invalid PGN:', e)
      return false
    }
  }, [])

  const pgn = useMemo(() => {
    const moves = history.slice(1).map(h => h.move?.san).filter(Boolean)
    if (moves.length === 0) {
      return '[Event "?"]\n[Site "?"]\n[Date "' + new Date().toISOString().split('T')[0].replace(/-/g, '.') + '"]\n[Round "?"]\n[White "?"]\n[Black "?"]\n[Result "*"]\n\n*'
    }

    const moveText = moves.map((san, i) => {
      const moveNum = Math.floor(i / 2) + 1
      if (i % 2 === 0) {
        return `${moveNum}. ${san}`
      }
      return san
    }).join(' ')

    const tags = [
      '[Event "?"]',
      '[Site "?"]',
      '[Date "' + new Date().toISOString().split('T')[0].replace(/-/g, '.') + '"]',
      '[Round "?"]',
      '[White "?"]',
      '[Black "?"]',
      '[Result "*"]',
    ].join('\n')

    return `${tags}\n\n${moveText} *`
  }, [history])

  const fen = exportFen(gameState)

  return {
    gameState,
    turn,
    legalMoves,
    legalMovesForSquare,
    selectedSquare,
    setSelectedSquare,
    lastMove,
    moveHistory,
    currentMoveIndex: currentIndex - 1,
    isAtEnd,
    status,
    countdown,
    selectSquare,
    executeMove,
    goToMove,
    goToStart,
    goToEnd,
    goBack,
    goForward,
    newGame,
    loadFen,
    loadPgn,
    fen,
    pgn,
  }
}
