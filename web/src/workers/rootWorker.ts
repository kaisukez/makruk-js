/**
 * Root Parallelization Web Worker
 *
 * Each worker searches a subset of root moves.
 * Supports shared bounds via SharedArrayBuffer for better pruning.
 */

import {
    searchMoves,
    searchMovesWithSharedBounds,
    wrapSharedBounds,
    createTranspositionTable,
} from '@kaisukez/makruk-js'
import type { Game, Move } from '@kaisukez/makruk-js'

export interface RootWorkerRequest {
    type: 'SEARCH'
    state: Game
    moves: Move[]
    depth: number
    workerId: number
    sharedBoundsBuffer?: SharedArrayBuffer
    isWhite?: boolean
}

export interface RootWorkerResponse {
    type: 'RESULT'
    bestScore: number
    bestMove: Move | null
    nodesSearched: number
    workerId: number
}

self.onmessage = (event: MessageEvent<RootWorkerRequest>) => {
    const data = event.data

    if (data.type === 'SEARCH') {
        const { state, moves, depth, workerId, sharedBoundsBuffer, isWhite } = data

        const tt = createTranspositionTable()

        let result
        if (sharedBoundsBuffer && isWhite !== undefined) {
            const sharedBounds = wrapSharedBounds(sharedBoundsBuffer, isWhite)
            result = searchMovesWithSharedBounds(state, moves, depth, sharedBounds, tt)
        } else {
            result = searchMoves(state, moves, depth, tt)
        }

        const response: RootWorkerResponse = {
            type: 'RESULT',
            bestScore: result.bestScore,
            bestMove: result.bestMove,
            nodesSearched: result.nodesSearched,
            workerId,
        }

        self.postMessage(response)
    }
}
