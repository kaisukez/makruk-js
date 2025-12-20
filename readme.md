# Makruk JS

A headless Makruk (Thai chess) library. No UI included - this is a pure game logic engine.

**Live Demo with UI: [makruk-js.com](https://makruk-js.com)**

## Features

- **Headless** - Pure game logic, no UI dependencies
- **Fast** - Bitboard representation with bitwise operations
- **Immutable** - All functions return new state objects
- **TypeScript** - Full type definitions included
- **Zero Dependencies** - Only peer dependency is TypeScript

## Installation

```bash
pnpm add @kaisukez/makruk-js
```

## Quick Start

```ts
import { createInitialState, move, generateLegalMoves, isGameOver } from '@kaisukez/makruk-js'

const state = createInitialState()
const newState = move(state, 'Me2')

const moves = generateLegalMoves(newState)
console.log(`${moves.length} legal moves`)
console.log(isGameOver(newState))
```

## API

### Game Management

```ts
import { move, generateLegalMoves } from '@kaisukez/makruk-js'

// Move using SAN notation
state = move(state, 'Me2')

// Move using MoveObject
const moves = generateLegalMoves(state)
state = move(state, moves[0])
```

### Status Checking

```ts
import { isCheck, isCheckmate, isStalemate, isDraw, isGameOver } from '@kaisukez/makruk-js'

isCheck(state)       // Is current player in check?
isCheckmate(state)   // Is it checkmate?
isStalemate(state)   // Is it stalemate?
isDraw(state)        // Any type of draw?
isGameOver(state)    // Game ended?
```

### FEN Support

```ts
import { createInitialState, importFen, exportFen, INITIAL_FEN, EMPTY_FEN } from '@kaisukez/makruk-js'

// Create initial state (preferred)
const state = createInitialState()

// Or import from FEN string
const customState = importFen('4k3/8/8/8/8/8/8/4K3 w 1')
const fen = exportFen(customState)
```

### PGN Support

```ts
import { importPgn, exportPgnFromHistory, parsePgn, exportPgn } from '@kaisukez/makruk-js'

// Import PGN to game states
const states = importPgn(pgnString)

// Export game history to PGN
const pgn = exportPgnFromHistory(states, { Event: 'Game', White: 'Player1', Black: 'Player2' })

// Low-level: parse/export PGN structure
const game = parsePgn(pgnString)
const pgnOutput = exportPgn(game)
```

### AI

```ts
import { findBestMove, iterativeDeepening, minimax, evaluate } from '@kaisukez/makruk-js'

// Find best move at fixed depth
const { bestMove, bestScore } = findBestMove(state, 3)
if (bestMove) {
    state = move(state, bestMove)
}

// Iterative deepening with time limit (recommended)
const result = iterativeDeepening(state, 5, 3000) // max depth 5, 3 seconds

// Direct minimax with alpha-beta
const result = minimax(state, depth, -Infinity, Infinity)

// Position evaluation
const score = evaluate(state)
```

### Parallel Search (Multi-core)

For web workers or Node.js worker threads:

```ts
import {
    searchMoves,
    distributeMoves,
    combineResults,
    generateLegalMoves,
    getRecommendedWorkers
} from '@kaisukez/makruk-js'

// Get number of workers based on CPU cores
const numWorkers = getRecommendedWorkers() // Node.js only
// For browser: navigator.hardwareConcurrency - 1

// Distribute moves across workers
const moves = generateLegalMoves(state)
const moveBuckets = distributeMoves(moves, numWorkers)

// Each worker searches its assigned moves
const result = searchMoves(state.board, state.turn, moveBuckets[workerIndex], depth)

// Combine results from all workers
const combined = combineResults(workerResults, state.turn === Color.WHITE)
```

### Board Manipulation

```ts
import { put, remove, Color, Piece, SquareIndex } from '@kaisukez/makruk-js'

state = put(state, Color.WHITE, Piece.RUA, SquareIndex.d4)
state = remove(state, SquareIndex.d4)
```

## Types

```ts
import type { State, MoveObject, MinimaxOutput, PgnGame, PgnMove } from '@kaisukez/makruk-js'
import { Color, Piece, SquareIndex, PIECE_POWER } from '@kaisukez/makruk-js'
```

### State

```ts
interface State {
    board: BoardState      // Internal board representation
    turn: Color            // Current player
    moveNumber: number     // Current move number
    fen: string            // Current FEN
    countdown: object      // Makruk counting rules state
    fenOccurrence: object  // Position repetition tracking
}
```

### MoveObject

```ts
interface MoveObject {
    from: SquareIndex
    to: SquareIndex
    piece: Piece
    color: Color
    captured?: Piece
    promotion?: Piece
    san: string
    flags: { normal: boolean, capture: boolean, promotion: boolean }
}
```

## Pieces

| Symbol | Name | Thai | Movement |
|--------|------|------|----------|
| K/k | Khun (King) | ขุน | One square any direction |
| E/e | Met (Queen) | เม็ด | One square diagonally |
| R/r | Rua (Rook) | เรือ | Any squares horizontally/vertically |
| M/m | Ma (Knight) | ม้า | L-shape |
| T/t | Thon (Bishop) | โคน | One square diagonally forward |
| B/b | Bia (Pawn) | เบี้ยคว่ำ | One square forward |
| F/f | Flipped Bia | เบี้ยหงาย | One square forward or diagonally forward |

Capital = White, lowercase = Black.

## Counting Rules

Makruk has special endgame rules. When one side has only the King left, the other side must checkmate within a limited number of moves. The `countdown` property tracks this automatically.

## 0x88 Implementation

A deprecated array-based implementation is available for backward compatibility:

```ts
import { importFen, move, printBoard } from '@kaisukez/makruk-js/0x88'
```

See [0x88 README](./src/0x88/README.md) for details.

## Development

```bash
pnpm install    # Install dependencies
pnpm test       # Run tests
pnpm build      # Build
```

## License

MIT
