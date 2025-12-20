/**
 * Root parallelization worker for Node.js
 * Supports both regular and shared-bounds search
 * Each search uses a fresh transposition table
 */

const { parentPort } = require('worker_threads')
const bitboard = require('../../dist/bitboard.js')

// Handle messages for repeated searches
parentPort.on('message', (data) => {
    const { state, moves, depth, workerId, sharedBoundsBuffer, isWhite } = data

    // Create a fresh TT for each search
    const tt = bitboard.createTranspositionTable()

    let result
    if (sharedBoundsBuffer) {
        // Use shared bounds for better pruning
        const sharedBounds = bitboard.wrapSharedBounds(sharedBoundsBuffer, isWhite)
        result = bitboard.searchMovesWithSharedBounds(state, moves, depth, sharedBounds, tt)
    } else {
        // Regular search without shared bounds
        result = bitboard.searchMoves(state, moves, depth, tt)
    }

    parentPort.postMessage({
        bestScore: result.bestScore,
        bestMove: result.bestMove,
        nodesSearched: result.nodesSearched,
        workerId,
    })
})
