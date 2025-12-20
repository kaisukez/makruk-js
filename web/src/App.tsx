import { useState, useEffect, useCallback, useRef } from 'react'
import { Board } from './components/board/Board'
import { GameStatus } from './components/game/GameStatus'
import { MoveHistory } from './components/game/MoveHistory'
import { CollapsibleSection } from './components/ui/CollapsibleSection'
import { useGame } from './hooks/useGame'
import { useBot } from './hooks/useBot'
import { Color } from '@kaisukez/makruk-js'

function isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 1024
}

const DEFAULT_DEPTH = 4
const MIN_BOARD_SIZE = 320
const MAX_BOARD_SIZE = 800

function getDefaultWorkers(): number {
    if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
        return Math.max(1, Math.floor(navigator.hardwareConcurrency / 2))
    }
    return 2
}

function getDefaultBoardSize(): number {
    if (typeof window === 'undefined') return 480

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const isMobile = viewportWidth < 1024 // lg breakpoint

    // On mobile, use most of the width (stacked layout)
    // On desktop, leave room for the side panel
    const maxByWidth = isMobile
        ? viewportWidth - 80 // Board + labels (48px) + padding
        : viewportWidth - 400 // Leave room for side panel

    const maxByHeight = viewportHeight - 250

    const idealSize = Math.min(maxByWidth, maxByHeight)
    const clampedSize = Math.max(MIN_BOARD_SIZE, Math.min(MAX_BOARD_SIZE, idealSize))

    // Round to nearest 16 to match slider step
    return Math.round(clampedSize / 16) * 16
}

function getMaxBoardSize(): number {
    if (typeof window === 'undefined') return MAX_BOARD_SIZE

    const viewportWidth = window.innerWidth
    const isMobile = viewportWidth < 1024

    const maxByWidth = isMobile
        ? viewportWidth - 80
        : viewportWidth - 400

    return Math.min(MAX_BOARD_SIZE, Math.max(MIN_BOARD_SIZE, maxByWidth))
}

export default function App() {
    const [depth, setDepth] = useState(DEFAULT_DEPTH)
    const [numWorkers, setNumWorkers] = useState(getDefaultWorkers)
    const [playerColor, setPlayerColor] = useState<Color>(Color.WHITE)
    const [boardSize, setBoardSize] = useState(getDefaultBoardSize)
    const [maxBoardSize, setMaxBoardSize] = useState(getMaxBoardSize)
    const preferredSizeRef = useRef<number | null>(null)
    const rafRef = useRef<number | null>(null)
    const pendingSizeRef = useRef<number | null>(null)
    const [fenInput, setFenInput] = useState('')
    const [pgnInput, setPgnInput] = useState('')
    const [importError, setImportError] = useState<string | null>(null)

    useEffect(() => {
        const handleResize = () => {
            const newMax = getMaxBoardSize()
            setMaxBoardSize(newMax)

            if (preferredSizeRef.current !== null) {
                // User has a preferred size - use it if it fits, otherwise clamp to max
                setBoardSize(Math.min(preferredSizeRef.current, newMax))
            } else {
                // Auto-resize to optimal size
                setBoardSize(getDefaultBoardSize())
            }
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const handleBoardSizeChange = useCallback((newSize: number) => {
        preferredSizeRef.current = newSize
        pendingSizeRef.current = newSize

        if (rafRef.current === null) {
            rafRef.current = requestAnimationFrame(() => {
                if (pendingSizeRef.current !== null) {
                    setBoardSize(pendingSizeRef.current)
                }
                rafRef.current = null
            })
        }
    }, [])

    const {
        gameState,
        turn,
        legalMoves,
        selectedSquare,
        lastMove,
        moveHistory,
        currentMoveIndex,
        isAtEnd,
        status,
        selectSquare,
        executeMove,
        goToMove,
        newGame,
        loadFen,
        loadPgn,
        fen,
        pgn,
    } = useGame()

    const { isThinking, lastStats, maxWorkers, effectiveWorkers, getBotMove } = useBot(depth, numWorkers)
    const isProcessingRef = useRef(false)

    const isPlayerTurn = turn === playerColor

    useEffect(() => {
        if (status.isGameOver) return
        if (isPlayerTurn) return
        if (isThinking) return
        if (isProcessingRef.current) return
        if (!isAtEnd) return

        isProcessingRef.current = true

        getBotMove(gameState).then((move) => {
            if (move) {
                executeMove(move)
            }
            isProcessingRef.current = false
        })
    }, [gameState, isPlayerTurn, status.isGameOver, isThinking, isAtEnd, getBotMove, executeMove])

    const handleSquareClick = useCallback(
        (square: number) => {
            if (status.isGameOver && isAtEnd) return
            if (!isPlayerTurn) return

            const move = legalMoves.find(
                (m) => m.from === selectedSquare && m.to === square
            )

            if (move) {
                executeMove(move)
            } else {
                selectSquare(square)
            }
        },
        [status.isGameOver, isPlayerTurn, isAtEnd, legalMoves, selectedSquare, executeMove, selectSquare]
    )

    const handleNewGame = () => {
        newGame()
    }

    const handleFlipBoard = () => {
        setPlayerColor(playerColor === Color.WHITE ? Color.BLACK : Color.WHITE)
    }

    const formatTime = (ms: number) => {
        if (ms < 1000) return `${Math.round(ms)}ms`
        return `${(ms / 1000).toFixed(2)}s`
    }

    const formatNodes = (n: number) => {
        if (n < 1000) return n.toString()
        if (n < 1000000) return `${(n / 1000).toFixed(1)}K`
        return `${(n / 1000000).toFixed(2)}M`
    }

    return (
        <div className="min-h-screen flex flex-col">
            <header className="glass-dark p-4 shadow-lg">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold gradient-text">Makruk JS</h1>
                        <span className="text-xs text-gray-400 hidden sm:inline">Thai Chess Library</span>
                    </div>
                    <a
                        href="https://github.com/kaisukez/makruk-js"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors"
                        title="View on GitHub"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                    </a>
                </div>
            </header>

            <main className="flex-1 p-4 pt-6">
                <div className="mx-auto flex flex-col lg:flex-row gap-6 lg:items-start items-center lg:justify-center">
                    <div className="flex-shrink-0" style={{ width: boardSize + 48 }}>
                        <Board
                            state={gameState}
                            orientation={playerColor}
                            selectedSquare={selectedSquare}
                            legalMoves={legalMoves}
                            lastMove={lastMove}
                            onSquareClick={handleSquareClick}
                            disabled={isThinking || !isPlayerTurn}
                            dimmed={!isAtEnd}
                            size={boardSize}
                        />
                        <GameStatus
                            turn={turn}
                            status={status}
                            countdown={gameState.countdown}
                            isThinking={isThinking}
                        />
                    </div>

                    <div className="w-full lg:w-80 lg:flex-shrink-0 space-y-3">
                        <div className="flex gap-2">
                            <button
                                onClick={handleNewGame}
                                className="flex-1 py-2 px-4 gradient-accent gradient-accent-hover rounded-lg text-white font-medium transition-all shadow-lg hover:shadow-purple-500/25"
                                disabled={isThinking}
                            >
                                New Game
                            </button>
                            <button
                                onClick={handleFlipBoard}
                                className="flex-1 py-2 px-4 glass hover:bg-white/10 rounded-lg text-white font-medium transition-all"
                                disabled={isThinking}
                            >
                                Flip Board
                            </button>
                        </div>

                        <CollapsibleSection title="Settings" defaultOpen={!isMobileDevice()}>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm text-gray-400 block mb-1">
                                        Difficulty (Depth = {depth})
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="7"
                                        value={depth}
                                        onChange={(e) => setDepth(Number(e.target.value))}
                                        className="w-full accent-purple-500"
                                        disabled={isThinking}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 block mb-1">
                                        Speed (CPU Cores = {effectiveWorkers})
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max={maxWorkers}
                                        value={numWorkers}
                                        onChange={(e) => setNumWorkers(Number(e.target.value))}
                                        className="w-full accent-purple-500"
                                        disabled={isThinking}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 block mb-1">
                                        Board Size: {boardSize}px
                                    </label>
                                    <input
                                        type="range"
                                        min={MIN_BOARD_SIZE}
                                        max={maxBoardSize}
                                        step="1"
                                        value={boardSize}
                                        onChange={(e) => handleBoardSizeChange(Number(e.target.value))}
                                        className="w-full accent-purple-500"
                                    />
                                </div>
                            </div>
                        </CollapsibleSection>

                        <CollapsibleSection title="Moves" defaultOpen={true}>
                            <MoveHistory
                                moves={moveHistory}
                                currentMoveIndex={currentMoveIndex}
                                onMoveClick={goToMove}
                            />
                        </CollapsibleSection>

                        {lastStats && (
                            <CollapsibleSection title="Last Search" defaultOpen={!isMobileDevice()}>
                                <div className="text-sm text-gray-400 space-y-1">
                                    <div>Time: {formatTime(lastStats.thinkingTimeMs)}</div>
                                    <div>Nodes: {formatNodes(lastStats.nodesSearched)}</div>
                                    <div>Workers: {lastStats.workersUsed}</div>
                                </div>
                            </CollapsibleSection>
                        )}

                        <CollapsibleSection title="FEN" defaultOpen={!isMobileDevice()}>
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <div className="text-xs text-gray-400 break-all font-mono glass-dark p-2 rounded-lg flex-1">
                                        {fen}
                                    </div>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(fen)}
                                        className="px-2 py-1 text-xs glass hover:bg-white/10 rounded text-gray-300"
                                        title="Copy FEN"
                                    >
                                        Copy
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={fenInput}
                                        onChange={(e) => {
                                            setFenInput(e.target.value)
                                            setImportError(null)
                                        }}
                                        placeholder="Paste FEN to import..."
                                        className="flex-1 px-2 py-1 text-xs font-mono glass-dark rounded text-gray-300 placeholder-gray-500"
                                    />
                                    <button
                                        onClick={() => {
                                            if (loadFen(fenInput)) {
                                                setFenInput('')
                                                setImportError(null)
                                            } else {
                                                setImportError('Invalid FEN')
                                            }
                                        }}
                                        className="px-2 py-1 text-xs glass hover:bg-white/10 rounded text-gray-300"
                                        disabled={!fenInput.trim()}
                                    >
                                        Load
                                    </button>
                                </div>
                            </div>
                        </CollapsibleSection>

                        <CollapsibleSection title="PGN" defaultOpen={!isMobileDevice()}>
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <div className="text-xs text-gray-400 break-all font-mono glass-dark p-2 rounded-lg flex-1 max-h-24 overflow-y-auto whitespace-pre-wrap">
                                        {pgn}
                                    </div>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(pgn)}
                                        className="px-2 py-1 text-xs glass hover:bg-white/10 rounded text-gray-300 self-start"
                                        title="Copy PGN"
                                    >
                                        Copy
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    <textarea
                                        value={pgnInput}
                                        onChange={(e) => {
                                            setPgnInput(e.target.value)
                                            setImportError(null)
                                        }}
                                        placeholder="Paste PGN to import..."
                                        className="w-full px-2 py-1 text-xs font-mono glass-dark rounded text-gray-300 placeholder-gray-500 resize-none"
                                        rows={3}
                                    />
                                    <button
                                        onClick={() => {
                                            if (loadPgn(pgnInput)) {
                                                setPgnInput('')
                                                setImportError(null)
                                            } else {
                                                setImportError('Invalid PGN')
                                            }
                                        }}
                                        className="w-full px-2 py-1 text-xs glass hover:bg-white/10 rounded text-gray-300"
                                        disabled={!pgnInput.trim()}
                                    >
                                        Load PGN
                                    </button>
                                </div>
                                {importError && (
                                    <div className="text-xs text-red-400">{importError}</div>
                                )}
                            </div>
                        </CollapsibleSection>
                    </div>
                </div>
            </main>

            <footer className="glass-dark p-3 mt-8">
                <div className="max-w-6xl mx-auto text-center text-xs text-gray-500 space-y-1">
                    <p>
                        Library by{' '}
                        <a
                            href="https://github.com/kaisukez/makruk-js"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 underline"
                        >
                            kaisukez
                        </a>
                        {' '}licensed under{' '}
                        <a
                            href="https://opensource.org/licenses/MIT"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 underline"
                        >
                            MIT
                        </a>
                    </p>
                    <p>
                        Piece images by{' '}
                        <a
                            href="https://github.com/Fulmene/makruk-pieces-image"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 underline"
                        >
                            Fulmene
                        </a>
                        {' '}licensed under{' '}
                        <a
                            href="https://creativecommons.org/licenses/by-sa/4.0/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 underline"
                        >
                            CC BY-SA 4.0
                        </a>
                    </p>
                </div>
            </footer>
        </div>
    )
}
