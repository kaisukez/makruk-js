# Bitboard AI

High-performance AI engine for Makruk using bitboard representation.

## Architecture

```
evaluation.ts  - Position scoring (material, PST, king safety)
search.ts      - Alpha-beta with TT, quiescence, move ordering
```

## Search Algorithm

### Alpha-Beta Minimax

Standard negamax with alpha-beta pruning. White maximizes, black minimizes.

```
minimax(state, depth, alpha, beta):
    if terminal: return score
    if depth == 0: return quiescence(state, alpha, beta)

    for each move:
        score = minimax(child, depth-1, alpha, beta)
        update alpha/beta
        if beta <= alpha: break  // Prune

    return best_score
```

### Transposition Table

Caches evaluated positions to avoid redundant computation.

**Hash Function**: Uses all 14 bitboards concatenated with turn:
```
whiteBia_whiteFlippedBia_..._blackKhun_turn
```

**Entry Types**:
- `exact`: Score is exact (within alpha-beta window)
- `lowerbound`: Score >= stored value (beta cutoff)
- `upperbound`: Score <= stored value (alpha cutoff)

### Move Ordering (MVV-LVA)

Better move ordering = more pruning = faster search.

**Priority** (highest first):
1. **TT best move** (10000) - From previous search
2. **Captures** (1000 + victim×100 - attacker) - Most Valuable Victim, Least Valuable Attacker
3. **Promotions** (900) - Bia promotion
4. **Quiet moves** (0) - Non-captures

Example: Bia (1) capturing Rua (5) scores `1000 + 500 - 1 = 1499`

### Quiescence Search

Prevents horizon effect by searching captures until position is "quiet".

```
quiescence(state, alpha, beta):
    stand_pat = evaluate(state)
    if stand_pat >= beta: return beta  // Standing pat is good enough

    for each capture:
        score = quiescence(child, alpha, beta)
        update alpha/beta
        if beta <= alpha: break

    return alpha
```

Without quiescence, depth-limited search might stop right before an obvious recapture, giving wrong evaluation.

### Iterative Deepening

Searches depth 1, then 2, then 3... Benefits:
- Always has a valid move (can stop anytime)
- TT from shallow search improves move ordering for deeper search
- Natural time control

## Evaluation

### Material Values

From Thai Chess tradition (see `common/const`):
```
Bia (Pawn)     = 1.0
Flipped Bia    = 1.7
Met (Queen)    = 1.7
Thon (Bishop)  = 2.6
Ma (Knight)    = 3.0
Rua (Rook)     = 5.0
Khun (King)    = 0 (invaluable)
```

### Piece-Square Tables (PST)

Position bonuses stored in 64-element arrays.

**General PST** (center preference):
```
0.00 0.05 0.05 0.10 0.10 0.05 0.05 0.00
0.05 0.10 0.15 0.20 0.20 0.15 0.10 0.05
0.05 0.15 0.25 0.30 0.30 0.25 0.15 0.05
0.10 0.20 0.30 0.40 0.40 0.30 0.20 0.10  <- Center
0.10 0.20 0.30 0.40 0.40 0.30 0.20 0.10  <- Center
0.05 0.15 0.25 0.30 0.30 0.25 0.15 0.05
0.05 0.10 0.15 0.20 0.20 0.15 0.10 0.05
0.00 0.05 0.05 0.10 0.10 0.05 0.05 0.00
```

**Bia PST** (advancement bonus):
- Rank 3 (start): 0
- Rank 4: +0.10 to +0.20
- Rank 5: +0.15 to +0.30
- Rank 6 (promotion): +0.30 to +0.50

**King Safety PST**:
- Corners: +0.20 to +0.30 (safe)
- Center: -0.20 to -0.30 (exposed)

### Center Control Bonus

Extra +0.1 per piece on d4, e4, d5, e5.

### Final Score

```
score = Σ(white_material) - Σ(black_material)
      + Σ(white_PST) - Σ(black_PST)
      + white_center - black_center
```

Positive = white advantage. Negative = black advantage.

## Performance

Key optimizations over 0x88:
- Bitboard operations (popCount, getLSB)
- Transposition table hit rate
- Move ordering reduces nodes by 90%+
- Quiescence only searches captures

See [benchmark/README.md](../../../benchmark/README.md) for performance comparisons.

## Parallel Search

Two parallel search strategies are available:

1. **Root Parallelization** - Simple, distribute root moves across workers
2. **Lazy SMP** - State-of-the-art, all threads search same tree with shared TT

### Lazy SMP (Recommended)

Lazy SMP is used by top chess engines like Stockfish. All threads search the same tree
with a shared transposition table via SharedArrayBuffer.

**How It Works:**

```
               ┌────────────────────────────────┐
               │   Shared Transposition Table   │
               │      (SharedArrayBuffer)       │
               └────────────────────────────────┘
                    ▲      ▲      ▲      ▲
                    │      │      │      │
              ┌─────┴──┬───┴───┬──┴────┬─┴─────┐
              │Thread 1│Thread 2│Thread 3│Thread 4│
              │depth=6 │depth=7 │depth=5 │depth=6 │
              └────────┴────────┴────────┴────────┘
                     All search the same tree
```

**Benefits over Root Parallelization:**
- Better scaling to many cores
- Threads help each other via TT sharing
- Natural load balancing
- No wasted work on already-pruned subtrees

**Browser (Web Workers):**

```typescript
import {
    createLazySmpTT,
    wrapLazySmpTT,
    lazySmpNewSearch,
    runLazySmpSearch,
    combineLazySmpResults,
    isLazySmpAvailable,
    Color,
} from '@kaisukez/makruk-js'

// Check availability (requires SharedArrayBuffer)
if (!isLazySmpAvailable()) {
    console.warn('Lazy SMP requires SharedArrayBuffer')
}

// Create shared TT (64MB)
const sharedTT = createLazySmpTT(64)

// Increment TT age before each search
lazySmpNewSearch(sharedTT)

// Create workers and run parallel search
const numWorkers = navigator.hardwareConcurrency - 1
const workers = Array.from({ length: numWorkers }, () =>
    new Worker('./lazy-smp-worker.js')
)

const promises = workers.map((worker, threadId) =>
    new Promise(resolve => {
        worker.onmessage = (e) => resolve(e.data.result)
        worker.postMessage({
            type: 'SEARCH',
            state,
            turn: state.turn,
            maxDepth: 8,
            timeLimitMs: 3000,
            threadId,
            sharedTTBuffer: sharedTT.buffer,
            ttAge: sharedTT.currentAge,
        })
    })
)

const results = await Promise.all(promises)
const best = combineLazySmpResults(results, state.turn === Color.WHITE)
```

**Worker file (lazy-smp-worker.js):**

```typescript
import { wrapLazySmpTT, runLazySmpSearch } from '@kaisukez/makruk-js'

const stopFlag = { stopped: false }

self.onmessage = (e) => {
    if (e.data.type === 'STOP') {
        stopFlag.stopped = true
        return
    }

    const { state, turn, maxDepth, timeLimitMs, threadId, sharedTTBuffer, ttAge } = e.data

    stopFlag.stopped = false
    const sharedTT = wrapLazySmpTT(sharedTTBuffer, ttAge)

    const result = runLazySmpSearch(
        state.board,
        turn,
        maxDepth,
        sharedTT,
        threadId,
        stopFlag,
        timeLimitMs
    )

    self.postMessage({ type: 'RESULT', result, threadId })
}
```

**Note:** SharedArrayBuffer requires COOP/COEP headers in browsers:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

### Root Parallelization (Simple)

For environments without SharedArrayBuffer support:

### How It Works

1. Generate all legal moves at root
2. Distribute moves across N workers (round-robin for load balancing)
3. Each worker searches its assigned moves independently
4. Combine results to find the best move

```
Main Thread                    Workers
────────────                   ───────
generateMoves() ──────────────► Worker 1: search moves [0,4,8,...]
distributeMoves() ────────────► Worker 2: search moves [1,5,9,...]
                   ───────────► Worker 3: search moves [2,6,10,...]
                   ───────────► Worker 4: search moves [3,7,11,...]
combineResults() ◄────────────
```

### API

```typescript
// Distribute items across workers (round-robin)
distributeMoves<T>(items: T[], numWorkers: number): T[][]

// Search specific moves at root level (call from worker)
searchMoves(state: BoardState, turn: Color, moves: Move[], depth: number): MinimaxOutput

// Combine results from multiple workers
combineResults(results: MinimaxOutput[], isWhite: boolean): MinimaxOutput

// Get recommended worker count (Node.js only)
getRecommendedWorkers(): number
```

### Browser (Web Workers)

```typescript
// Main thread
const numWorkers = navigator.hardwareConcurrency - 1
const moves = generateLegalMoves(state)
const buckets = distributeMoves(moves, numWorkers)

// Create workers and distribute work
const promises = workers.map((worker, i) => {
    return new Promise(resolve => {
        worker.onmessage = (e) => resolve(e.data)
        worker.postMessage({ moves: buckets[i], state, depth })
    })
})

// Collect and combine
const results = await Promise.all(promises)
const best = combineResults(results, state.turn === Color.WHITE)
```

**Worker file:**
```typescript
self.onmessage = (e) => {
    const { moves, state, depth } = e.data
    const result = searchMoves(state.board, state.turn, moves, depth)
    self.postMessage(result)
}
```

### Node.js (Worker Threads)

```typescript
import { Worker } from 'worker_threads'

const numWorkers = getRecommendedWorkers()
const moves = generateLegalMoves(state)
const buckets = distributeMoves(moves, numWorkers)

// Create worker threads
const promises = buckets.map((moveBucket, i) => {
    return new Promise(resolve => {
        const worker = new Worker('./search-worker.js')
        worker.on('message', resolve)
        worker.postMessage({ moves: moveBucket, state, depth })
    })
})

const results = await Promise.all(promises)
const best = combineResults(results, state.turn === Color.WHITE)
```

**search-worker.js:**
```typescript
import { parentPort } from 'worker_threads'
import { searchMoves } from '@kaisukez/makruk-js'

parentPort.on('message', ({ moves, state, depth }) => {
    const result = searchMoves(state.board, state.turn, moves, depth)
    parentPort.postMessage(result)
})
```

### Why Root-Level Parallelization?

- Simple: No shared transposition table needed
- Efficient: Each worker runs full alpha-beta on its subtree
- Load balanced: Round-robin distribution with move ordering ensures work is evenly split
- No coordination overhead during search

## API

### Types

```typescript
interface MinimaxOutput {
    bestScore: number      // Position evaluation score
    bestMove: Move | null  // Best move found (null if no legal moves)
    nodesSearched: number  // Number of positions evaluated
}

interface Move {
    from: number           // Source square (0-63)
    to: number             // Target square (0-63)
    piece: Piece           // Piece type being moved
    color: Color           // Color of the piece
    captured?: Piece       // Captured piece type (if capture)
    promotion?: Piece      // Promotion piece type (if promotion)
}
```

### Search Functions

#### `findBestMove(state, turn, depth, options?)`

Find the best move at a fixed search depth.

```typescript
function findBestMove(
    state: BoardState,
    turn: Color,
    depth: number,
    options?: {
        useTranspositionTable?: boolean  // Default: true
        clearCache?: boolean             // Default: false
    }
): MinimaxOutput
```

**Parameters:**
- `state` - Current board position
- `turn` - Side to move (`Color.WHITE` or `Color.BLACK`)
- `depth` - Search depth (1-7 recommended, higher = slower but stronger)
- `options.useTranspositionTable` - Enable position caching (recommended)
- `options.clearCache` - Clear cache before search (use for new games)

**Returns:** `MinimaxOutput` with best move and score

**Example:**
```typescript
const result = findBestMove(state, Color.WHITE, 5)
if (result.bestMove) {
    state = applyMove(state, result.bestMove)
}
```

---

#### `iterativeDeepening(state, turn, maxDepth, timeLimitMs?)`

Search with increasing depth until time limit or max depth reached. Recommended for game play.

```typescript
function iterativeDeepening(
    state: BoardState,
    turn: Color,
    maxDepth: number,
    timeLimitMs?: number  // Optional time limit in milliseconds
): MinimaxOutput
```

**Parameters:**
- `state` - Current board position
- `turn` - Side to move
- `maxDepth` - Maximum search depth
- `timeLimitMs` - Stop searching after this many milliseconds

**Returns:** `MinimaxOutput` from the deepest completed search

**Example:**
```typescript
// Search up to depth 8, but stop after 3 seconds
const result = iterativeDeepening(state, Color.WHITE, 8, 3000)
```

---

#### `minimax(state, turn, depth, alpha, beta, useTranspositionTable?)`

Low-level alpha-beta search. Use `findBestMove` or `iterativeDeepening` instead for normal use.

```typescript
function minimax(
    state: BoardState,
    turn: Color,
    depth: number,
    alpha: number,           // Lower bound (-Infinity initially)
    beta: number,            // Upper bound (Infinity initially)
    useTranspositionTable?: boolean  // Default: true
): MinimaxOutput
```

**Example:**
```typescript
const result = minimax(state, Color.WHITE, 5, -Infinity, Infinity, true)
```

---

### Parallel Search Functions

#### `distributeMoves<T>(items, numWorkers)`

Distribute items across workers using round-robin for load balancing.

```typescript
function distributeMoves<T>(items: T[], numWorkers: number): T[][]
```

**Parameters:**
- `items` - Array of items to distribute (usually moves)
- `numWorkers` - Number of workers to distribute across

**Returns:** Array of arrays, one bucket per worker

**Example:**
```typescript
const moves = generateLegalMoves(state, turn)
const buckets = distributeMoves(moves, 4)
// buckets[0] = [move0, move4, move8, ...]
// buckets[1] = [move1, move5, move9, ...]
// buckets[2] = [move2, move6, move10, ...]
// buckets[3] = [move3, move7, move11, ...]
```

---

#### `searchMoves(state, turn, moves, depth)`

Search a specific subset of moves. Designed to be called from a worker.

```typescript
function searchMoves(
    state: BoardState,
    turn: Color,
    moves: Move[],
    depth: number
): MinimaxOutput
```

**Parameters:**
- `state` - Current board position
- `turn` - Side to move
- `moves` - Subset of legal moves to search
- `depth` - Search depth

**Returns:** `MinimaxOutput` with best move from the given subset

**Example (in worker):**
```typescript
self.onmessage = (e) => {
    const { state, turn, moves, depth } = e.data
    const result = searchMoves(state, turn, moves, depth)
    self.postMessage(result)
}
```

---

#### `combineResults(results, isWhite)`

Combine results from multiple workers to find the overall best move.

```typescript
function combineResults(
    results: MinimaxOutput[],
    isWhite: boolean
): MinimaxOutput
```

**Parameters:**
- `results` - Array of results from each worker
- `isWhite` - True if finding best move for white (maximizing)

**Returns:** Combined `MinimaxOutput` with the best move across all workers

**Example:**
```typescript
const workerResults = await Promise.all(workerPromises)
const best = combineResults(workerResults, state.turn === Color.WHITE)
```

---

#### `getRecommendedWorkers()`

Get recommended number of workers for Node.js environments.

```typescript
function getRecommendedWorkers(): number
```

**Returns:** `os.cpus().length - 1` in Node.js, `2` as fallback

**Note:** For browsers, use `navigator.hardwareConcurrency - 1` directly.

---

### Move Ordering Functions

#### `getMoveScore(move, ttBestMove?)`

Calculate move priority for search ordering. Higher scores are searched first.

```typescript
function getMoveScore(move: Move, ttBestMove?: Move | null): number
```

**Priority scores:**
| Move Type | Score |
|-----------|-------|
| TT best move | 10000 |
| Captures | 1000 + victim×100 - attacker |
| Promotions | 900 |
| Quiet moves | 0 |

---

#### `orderMoves(moves, ttBestMove?)`

Sort moves in-place for better alpha-beta pruning.

```typescript
function orderMoves(moves: Move[], ttBestMove?: Move | null): void
```

---

### Evaluation Functions

#### `evaluateFast(state)`

Fast position evaluation using material and piece-square tables.

```typescript
function evaluateFast(state: BoardState): number
```

**Returns:** Score in centipawns. Positive = white advantage, negative = black advantage.

**Example:**
```typescript
const score = evaluateFast(state)
// score = 2.5 means white is up ~2.5 pawns worth of material/position
```

---

### Transposition Table Functions

#### `getTranspositionTableStats()`

Get current transposition table statistics.

```typescript
function getTranspositionTableStats(): { size: number }
```

---

#### `clearTranspositionTable()`

Clear all cached positions. Call when starting a new game.

```typescript
function clearTranspositionTable(): void
```
