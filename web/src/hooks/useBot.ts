import { useState, useCallback, useEffect, useRef } from 'react'
import {
    generateLegalMoves,
    distributeMoves,
    combineResults,
    createSharedBounds,
    Color,
} from '@kaisukez/makruk-js'
import type { Game, Move } from '@kaisukez/makruk-js'
import type { RootWorkerRequest, RootWorkerResponse } from '../workers/rootWorker'

export interface BotStats {
    thinkingTimeMs: number
    nodesSearched: number
    workersUsed: number
}

function getMaxWorkers(): number {
    if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
        return Math.max(1, navigator.hardwareConcurrency - 1)
    }
    return 2
}

function supportsSharedArrayBuffer(): boolean {
    try {
        return typeof SharedArrayBuffer !== 'undefined'
    } catch {
        return false
    }
}

function createWorker(): Worker {
    return new Worker(
        new URL('../workers/rootWorker.ts', import.meta.url),
        { type: 'module' }
    )
}

export function useBot(depth: number, numWorkers: number) {
    const [isThinking, setIsThinking] = useState(false)
    const [lastStats, setLastStats] = useState<BotStats | null>(null)
    const workersRef = useRef<Worker[]>([])
    const useSharedBoundsRef = useRef(false)
    const currentWorkersRef = useRef(0)

    const maxWorkers = getMaxWorkers()
    const effectiveWorkers = Math.min(numWorkers, maxWorkers)

    useEffect(() => {
        workersRef.current.forEach(w => w.terminate())
        workersRef.current = Array.from({ length: effectiveWorkers }, () => createWorker())
        currentWorkersRef.current = effectiveWorkers
        useSharedBoundsRef.current = supportsSharedArrayBuffer()

        return () => {
            workersRef.current.forEach(w => w.terminate())
            workersRef.current = []
        }
    }, [effectiveWorkers])

    const getBotMove = useCallback(async (state: Game): Promise<Move | null> => {
        if (workersRef.current.length === 0) {
            return null
        }

        setIsThinking(true)
        const startTime = performance.now()

        try {
            const workers = workersRef.current
            const workersUsed = workers.length
            const isWhite = state.turn === Color.WHITE

            const allMoves = generateLegalMoves(state)
            if (allMoves.length === 0) return null

            const moveBuckets = distributeMoves(allMoves, workersUsed)

            let sharedBoundsBuffer: SharedArrayBuffer | undefined
            if (useSharedBoundsRef.current) {
                const sharedBounds = createSharedBounds(isWhite)
                sharedBoundsBuffer = sharedBounds.buffer
            }

            const workerPromises = workers.map((worker, workerId) => {
                const moves = moveBuckets[workerId]
                if (moves.length === 0) {
                    return Promise.resolve({
                        bestScore: isWhite ? -Infinity : Infinity,
                        bestMove: null,
                        nodesSearched: 0,
                    })
                }

                return new Promise<{ bestScore: number; bestMove: Move | null; nodesSearched: number }>((resolve) => {
                    const handleMessage = (event: MessageEvent<RootWorkerResponse>) => {
                        if (event.data.type === 'RESULT' && event.data.workerId === workerId) {
                            worker.removeEventListener('message', handleMessage)
                            resolve({
                                bestScore: event.data.bestScore,
                                bestMove: event.data.bestMove,
                                nodesSearched: event.data.nodesSearched,
                            })
                        }
                    }

                    worker.addEventListener('message', handleMessage)

                    const request: RootWorkerRequest = {
                        type: 'SEARCH',
                        state,
                        moves,
                        depth,
                        workerId,
                        sharedBoundsBuffer,
                        isWhite,
                    }

                    worker.postMessage(request)
                })
            })

            const results = await Promise.all(workerPromises)
            const combined = combineResults(results, isWhite)

            const thinkingTimeMs = performance.now() - startTime
            const nodesSearched = results.reduce((sum, r) => sum + r.nodesSearched, 0)

            setLastStats({ thinkingTimeMs, nodesSearched, workersUsed })

            return combined.bestMove
        } catch (error) {
            console.error('Bot error:', error)
            return null
        } finally {
            setIsThinking(false)
        }
    }, [depth])

    return {
        isThinking,
        lastStats,
        maxWorkers,
        effectiveWorkers,
        getBotMove,
    }
}
