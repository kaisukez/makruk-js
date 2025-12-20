/**
 * Parallel search benchmarks
 * Compares: Single-thread vs Parallel (YBWC - Young Brothers Wait Concept)
 *
 * YBWC searches first move sequentially to establish a good bound,
 * then parallelizes remaining moves with that bound already set.
 *
 * Note: Workers are pre-created and reused to avoid measuring startup overhead.
 */

const { Worker } = require('worker_threads')
const os = require('os')
const path = require('path')
const bitboard = require('../dist/bitboard.js')

const NUM_WORKERS = 4

const FENS = {
    endgame: '4k3/8/8/8/8/8/8/4K2r w 1',
    middlegame: '4k3/4r3/2b2b2/8/8/2B2B2/4R3/4K3 w 1',
    opening: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1',
}

// Worker pool for parallelization
class WorkerPool {
    constructor(size) {
        this.workers = []
        this.size = size
    }

    async init() {
        for (let i = 0; i < this.size; i++) {
            const worker = new Worker(path.join(__dirname, 'workers/root-worker.cjs'))
            await new Promise(resolve => worker.once('online', resolve))
            this.workers.push(worker)
        }
    }

    search(state, moves, depth, workerId, sharedBoundsBuffer = null, isWhite = null) {
        const worker = this.workers[workerId]
        return new Promise((resolve, reject) => {
            const handler = (msg) => {
                if (msg.workerId === workerId) {
                    worker.off('message', handler)
                    worker.off('error', errorHandler)
                    resolve(msg)
                }
            }
            const errorHandler = (err) => {
                worker.off('message', handler)
                reject(err)
            }
            worker.on('message', handler)
            worker.once('error', errorHandler)
            worker.postMessage({ state, moves, depth, workerId, sharedBoundsBuffer, isWhite })
        })
    }

    terminate() {
        this.workers.forEach(w => w.terminate())
        this.workers = []
    }
}

// Single-threaded search (baseline)
function singleThreadSearch(state, depth) {
    const tt = bitboard.createTranspositionTable()
    return bitboard.findBestMove(state, depth, tt)
}

// Simple parallel search - just distribute all moves to workers with shared bounds
// No sequential portion - fully parallel from the start
async function parallelSearch(pool, state, depth) {
    const allMoves = bitboard.generateLegalMoves(state)
    if (allMoves.length === 0) return { bestScore: 0, bestMove: null, nodesSearched: 0 }

    const isWhite = state.turn === 'w'
    const sharedBounds = bitboard.createSharedBounds(isWhite)
    const moveBuckets = bitboard.distributeMoves(allMoves, pool.size)

    const promises = moveBuckets.map((moves, workerId) => {
        if (moves.length === 0) {
            return Promise.resolve({
                bestScore: isWhite ? -Infinity : Infinity,
                bestMove: null,
                nodesSearched: 0,
            })
        }
        return pool.search(state, moves, depth, workerId, sharedBounds.buffer, isWhite)
    })

    const results = await Promise.all(promises)
    return bitboard.combineResults(results, isWhite)
}

async function runBenchmark(name, fen, depth, iterations, pool) {
    console.log(`\n${name} (depth ${depth}, ${iterations} iter)`)
    console.log('-'.repeat(65))

    const state = bitboard.createGameFromFen(fen)

    // Single-threaded baseline
    const singleStart = process.hrtime.bigint()
    let singleResult
    for (let i = 0; i < iterations; i++) {
        singleResult = singleThreadSearch(state, depth)
    }
    const singleTime = Number(process.hrtime.bigint() - singleStart) / 1e6 / iterations

    console.log(`  Single-thread:   ${singleTime.toFixed(1).padStart(8)} ms  [${(singleResult.nodesSearched || 0).toLocaleString()} nodes]`)

    // Parallel search (YBWC)
    const parallelStart = process.hrtime.bigint()
    let parallelResult
    for (let i = 0; i < iterations; i++) {
        parallelResult = await parallelSearch(pool, state, depth)
    }
    const parallelTime = Number(process.hrtime.bigint() - parallelStart) / 1e6 / iterations
    const speedup = singleTime / parallelTime
    const label = speedup >= 1 ? `${speedup.toFixed(2)}x faster` : `${(1/speedup).toFixed(2)}x slower`

    console.log(`  Parallel (${NUM_WORKERS}w):   ${parallelTime.toFixed(1).padStart(8)} ms  [${label}, ${(parallelResult.nodesSearched || 0).toLocaleString()} nodes]`)
}

async function run() {
    console.log('=== PARALLEL SEARCH BENCHMARKS ===')
    console.log(`Workers: ${NUM_WORKERS} | Cores: ${os.cpus().length}`)
    console.log('Method: YBWC (search first move sequentially, then parallelize)')
    console.log('\nInitializing worker pool...')

    const pool = new WorkerPool(NUM_WORKERS)
    await pool.init()

    console.log('Worker pool ready.')

    try {
        for (const depth of [3, 5]) {
            console.log(`\n${'='.repeat(65)}`)
            console.log(`DEPTH ${depth}`)
            console.log('='.repeat(65))

            const iterations = depth <= 3 ? 5 : depth <= 5 ? 3 : 1

            for (const [name, fen] of Object.entries(FENS)) {
                await runBenchmark(name, fen, depth, iterations, pool)
            }
        }
    } finally {
        pool.terminate()
    }
}

module.exports = { run }
if (require.main === module) run()
