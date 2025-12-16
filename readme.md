# Makruk JS

> A high-performance TypeScript library for Makruk (Thai Chess) using bitboard representation

**🚀 High Performance:** Uses bitboard representation with bitwise operations for fast move generation and evaluation.

**📦 Dual Implementations:**
- **Bitboard** (default, recommended): Optimized for speed using bitwise operations
- **0x88** (deprecated): Original array-based implementation still available for compatibility - [See 0x88 README](./src/0x88/README.md)

## Table of Contents

- [What is Makruk?](#what-is-makruk)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
  - [Game Management](#game-management)
  - [Status Checking](#status-checking)
  - [FEN Support](#fen-support)
  - [PGN Support](#pgn-support)
  - [AI](#ai)
  - [Board Manipulation](#board-manipulation)
- [Examples](#examples)
- [TypeScript Types](#typescript-types)
- [Piece Reference](#piece-reference)
- [Development](#development)

---

## What is Makruk?

Makruk (หมากรุก), also known as Thai Chess, is a chess variant played in Thailand and Cambodia. It is closely related to chess but has different pieces and rules. The game is believed to be descended from the ancient Indian game of Chaturanga.

**Key Differences from Chess:**
- Different piece movements (Met/Queen and Thon/Bishop move differently)
- Pawns start on the 3rd/6th rank
- Special endgame counting rules

---

## Features

✅ **Bitboard Representation** - Fast bitwise operations for move generation
✅ **Immutable API** - All functions return new state objects
✅ **Full TypeScript Support** - Complete type definitions
✅ **FEN Import/Export** - Standard position notation
✅ **PGN Support** - Game recording and playback with comments, variations, NAGs
✅ **AI Engine** - Minimax with alpha-beta pruning
✅ **Counting Rules** - Automatic endgame countdown tracking
✅ **98.5% Test Coverage** - Comprehensive test suite
✅ **Zero Dependencies** - Only peer dependency: TypeScript

**Performance Benchmarks:**
- Move Generation: ~20-30x faster than 0x88
- FEN Export: ~30-70x faster than 0x88
- AI Search: ~70-400x faster than 0x88

---

## Installation

```bash
# Using pnpm (recommended)
pnpm add @kaisukez/makruk-js

# Using npm
npm install @kaisukez/makruk-js

# Using yarn
yarn add @kaisukez/makruk-js
```

---

## Quick Start

```ts
import { importFen, INITIAL_FEN, move, isGameOver } from '@kaisukez/makruk-js'

// Start a new game (uses bitboard implementation by default)
let state = importFen(INITIAL_FEN)

// Make a move using Standard Algebraic Notation
state = move(state, 'Me2')

// Check if game is over
console.log(isGameOver(state))  // false
```

That's it! The state is immutable, so each `move()` returns a new state object without modifying the original.

**Need the 0x88 version?** See the [0x88 README](./src/0x88/README.md) for instructions on using the deprecated array-based implementation.

---

## Core Concepts

### Immutability

Every function returns a **new state object**. The original state is never modified:

```ts
import { importFen, INITIAL_FEN, move, generateLegalMoves, Color, Piece, SquareIndex, BITS } from '@kaisukez/makruk-js'

const state1 = importFen(INITIAL_FEN)

// Method 1: Move using SAN (Standard Algebraic Notation)
const state2 = move(state1, 'Me2')

// Method 2: Move using a MoveObject from legal moves
const legalMoves = generateLegalMoves(state1)
const state3 = move(state1, legalMoves[0])

// Method 3: Move using a manually crafted MoveObject
const state4 = move(state1, {
    color: Color.WHITE,
    piece: Piece.MA,
    from: SquareIndex.b1,
    to: SquareIndex.c3,
    flags: BITS.NORMAL
})

// state1 is unchanged in all cases
// state2, state3, and state4 are new states after their respective moves
```

### State Object

The `State` object is a wrapper around the bitboard representation:
- `_bitboard`: Internal bitboard state (BitboardState)
- `_turn`: Whose turn it is (Color.WHITE or Color.BLACK)
- `moveNumber`: Current move number
- `fen`: Current position in FEN notation

The bitboard state internally uses 64-bit integers (BigInt) to represent piece positions for fast bitwise operations.

---

## API Reference

### Game Management

#### `move(state, move)`

Make a move and return a new state.

**Parameters:**
- `state`: Current game state
- `move`: Either a SAN string (e.g., `"Me2"`) or a MoveObject from `generateLegalMoves()`

**Returns:** New state after the move

**Example:**
```ts
import { move, generateLegalMoves } from '@kaisukez/makruk-js'

// Using SAN notation
state = move(state, 'Me2')

// Using a move object
const moves = generateLegalMoves(state)
state = move(state, moves[0])
```

#### `generateLegalMoves(state)`

Get all legal moves for the current position.

**Returns:** Array of MoveObject

**Example:**
```ts
import { generateLegalMoves } from '@kaisukez/makruk-js'

const moves = generateLegalMoves(state)
console.log(`${moves.length} legal moves available`)
```

---

### Status Checking

#### `isGameOver(state)`

Check if the game has ended.

**Returns:** `true` if game is over (checkmate, stalemate, or draw)

```ts
import { isGameOver } from '@kaisukez/makruk-js'

if (isGameOver(state)) {
    console.log('Game finished!')
}
```

#### Other Status Functions

```ts
import {
    isCheck,
    isCheckmate,
    isStalemate,
    isThreefoldRepetition,
    isDraw
} from '@kaisukez/makruk-js'

console.log(isCheck(state))                // Is current player in check?
console.log(isCheckmate(state))            // Is it checkmate?
console.log(isStalemate(state))            // Is it stalemate?
console.log(isThreefoldRepetition(state))  // Position repeated 3 times?
console.log(isDraw(state))                 // Any type of draw?
```

---

### FEN Support

FEN (Forsyth-Edwards Notation) is a standard notation for describing board positions.

#### `importFen(fenString)`

Load a position from FEN notation.

**Example:**
```ts
import { importFen, INITIAL_FEN, EMPTY_FEN } from '@kaisukez/makruk-js'

// Start position
const state = importFen(INITIAL_FEN)

// Empty board
const emptyState = importFen(EMPTY_FEN)

// Custom position
const customState = importFen("4k3/8/8/8/8/8/8/4K3 w 1")
```

#### `exportFen(state)`

Convert a state to FEN notation.

**Example:**
```ts
import { exportFen } from '@kaisukez/makruk-js'

const fen = exportFen(state)
console.log(fen)  // "rnsmksnr/8/bbbbbbbb/8/8/BBBBBBBB/8/RNSKMSNR w 1"
```

**Constants:**
- `INITIAL_FEN` - Standard Makruk starting position
- `EMPTY_FEN` - Empty board (kings only)

---

### PGN Support

PGN (Portable Game Notation) is a standard format for recording chess games.

#### `importPgn(pgnString, options?)`

Import a PGN game and convert it to an array of game states.

**Parameters:**
- `pgnString`: PGN text
- `options?`: Optional parsing options
  - `includeComments?: boolean` (default: true)
  - `includeVariations?: boolean` (default: true)
  - `includeNags?: boolean` (default: true)

**Returns:** Array of State objects (one for each move)

**Example:**
```ts
import { importPgn } from '@kaisukez/makruk-js'

const pgn = `[Event "Casual Game"]
[White "Player1"]
[Black "Player2"]

1. e4 { King's pawn } e5 2. Nf3 Nc6 *`

const states = importPgn(pgn)
// states[0] = initial position
// states[1] = position after 1. e4
// states[2] = position after 1... e5
```

#### `exportPgnFromHistory(states, tags?, options?)`

Export a game history to PGN format.

**Parameters:**
- `states`: Array of game states
- `tags?`: Optional game tags (Event, White, Black, etc.)
- `options?`: Optional export options

**Example:**
```ts
import { exportPgnFromHistory } from '@kaisukez/makruk-js'

const pgn = exportPgnFromHistory(
    gameStates,
    {
        Event: 'Casual Game',
        White: 'Player1',
        Black: 'Player2',
        Result: '*'
    }
)
console.log(pgn)
```

#### Low-Level PGN Functions

For advanced use cases, you can use the low-level PGN parser and exporter:

```ts
import { parsePgn, exportPgn } from '@kaisukez/makruk-js'
import type { PgnGame } from '@kaisukez/makruk-js'

// Parse PGN to structured data
const game: PgnGame = parsePgn(pgnString, {
    includeComments: true,
    includeVariations: true,
    includeNags: true,
})

// Export structured data to PGN
const pgn = exportPgn(game, {
    maxLineWidth: 80,
    prettyPrint: false,
})
```

---

### AI

#### `findBestMove(state, depth)`

Find the best move using minimax algorithm with alpha-beta pruning.

**Parameters:**
- `state`: Current game state
- `depth`: Search depth (higher = stronger but slower). Typical values: 2-5

**Returns:** `MinimaxOutput` object with `bestMove` and `score`

**Example:**
```ts
import { findBestMove } from '@kaisukez/makruk-js'
import type { MinimaxOutput } from '@kaisukez/makruk-js'

const { bestMove, score }: MinimaxOutput = findBestMove(state, 3)

if (bestMove) {
    console.log(`Best move: ${bestMove.san}, Score: ${score}`)
    state = move(state, bestMove)
}
```

**Depth Guidelines:**
- Depth 2: Fast, beginner level
- Depth 3: Medium speed, intermediate level
- Depth 4: Slow, advanced level
- Depth 5+: Very slow, expert level

---

### Board Manipulation

These functions allow you to manually create custom positions.

#### `put(state, color, piece, square)`

Place a piece on the board.

```ts
import { put, Color, Piece, SquareIndex } from '@kaisukez/makruk-js'

state = put(state, Color.WHITE, Piece.RUA, SquareIndex.d4)
```

#### `remove(state, square)`

Remove a piece from the board.

```ts
import { remove, SquareIndex } from '@kaisukez/makruk-js'

state = remove(state, SquareIndex.d4)
```

#### `printBoard(state)`

**Note:** Currently not implemented in the bitboard version. Use the [0x88 implementation](./src/0x88/README.md) if you need ASCII board visualization.

---

## Examples

### Example 1: Play Until Game Ends

```ts
import {
    importFen,
    INITIAL_FEN,
    move,
    isGameOver,
    findBestMove,
} from '@kaisukez/makruk-js'

function runUntilGameFinished() {
    let state = importFen(INITIAL_FEN)
    let moveCount = 0

    while (!isGameOver(state)) {
        const { bestMove } = findBestMove(state, 3)
        if (!bestMove) break  // No legal moves

        state = move(state, bestMove)
        moveCount++

        console.log(`Move ${moveCount}: ${bestMove.san}`)
        console.log(`FEN: ${state.fen}`)
    }

    console.log('\nGame over!')
}

runUntilGameFinished()
```

### Example 2: Load and Save Games with PGN

```ts
import {
    importPgn,
    exportPgnFromHistory
} from '@kaisukez/makruk-js'

// Load a game from PGN
const pgnString = `[Event "Example Game"]
1. e4 e5 2. Nf3 Nc6 *`

const states = importPgn(pgnString)

// Play through the game
states.forEach((state, index) => {
    console.log(`Position after move ${index}: ${state.fen}`)
})

// Save the game back to PGN
const pgn = exportPgnFromHistory(states, {
    Event: 'My Game',
    White: 'Player 1',
    Black: 'Player 2',
    Result: '*'
})

console.log('\nPGN Output:')
console.log(pgn)
```

### Example 3: Custom Position Setup

```ts
import {
    importFen,
    EMPTY_FEN,
    put,
    Color,
    Piece,
    SquareIndex,
    isCheckmate
} from '@kaisukez/makruk-js'

// Start with empty board
let state = importFen(EMPTY_FEN)

// Place pieces manually
state = put(state, Color.WHITE, Piece.RUA, SquareIndex.a8)
state = put(state, Color.WHITE, Piece.RUA, SquareIndex.b7)
state = put(state, Color.BLACK, Piece.KHUN, SquareIndex.c8)

// Check if it's checkmate
console.log(isCheckmate(state))  // true
```

---

## TypeScript Types

The library provides full TypeScript support:

```ts
import type {
    State,
    MoveObject,
    MinimaxOutput,
    PgnGame,
    PgnMove
} from '@kaisukez/makruk-js'

import { Color, Piece, SquareIndex } from '@kaisukez/makruk-js'

// Type-safe usage
const state: State = importFen(INITIAL_FEN)
const moves: MoveObject[] = generateLegalMoves(state)
const result: MinimaxOutput = findBestMove(state, 3)
const game: PgnGame = parsePgn(pgnString)
```

**Common Types:**
- `State` - Complete game state
- `MoveObject` - Represents a single move
- `MinimaxOutput` - AI search result
- `PgnGame` - Parsed PGN game structure
- `PgnMove` - Single move in PGN

**Common Enums:**
- `Color.WHITE`, `Color.BLACK` - Player colors
- `Piece.KHUN`, `Piece.MET`, `Piece.RUA`, etc. - Piece types
- `SquareIndex` - Board squares (a1-h8)

---

## Piece Reference

### Piece Symbols

| Symbol | English Name    | Thai Name (ชื่อไทย) | Movement |
|--------|-----------------|-------------------|----------|
| K / k  | Khun (King)     | ขุน               | One square in any direction |
| E / e  | Met (Queen)     | เม็ด              | One square diagonally |
| R / r  | Rua (Rook)      | เรือ              | Any number of squares horizontally/vertically |
| M / m  | Ma (Knight)     | ม้า               | L-shape (like chess knight) |
| T / t  | Thon (Bishop)   | โคน               | One square diagonally forward |
| B / b  | Bia (Pawn)      | เบี้ยคว่ำ         | One square forward |
| F / f  | Flipped Bia     | เบี้ยหงาย          | One square forward or diagonally forward |

**Note:**
- **Capital letters** = White pieces (move first)
- **Lowercase letters** = Black pieces

### Piece Values

The AI uses these approximate values for piece evaluation:

| Piece | Value |
|-------|-------|
| Khun (King) | ∞ (invaluable) |
| Rua (Rook) | 5 |
| Ma (Knight) | 3 |
| Met (Queen) | 1.5 |
| Thon (Bishop) | 1.5 |
| Flipped Bia | 1.5 |
| Bia (Pawn) | 1 |

---

## Makruk Counting Rules

Makruk has special endgame rules called "counting rules":

- When one side has only the King left, the other side must deliver checkmate within a certain number of moves
- The countdown limit depends on the remaining pieces
- This library **automatically tracks and enforces** these rules

**Examples:**
- King + Rook vs King: Must checkmate in 8 moves
- King + 2 Flipped Bias vs King: Must checkmate in 16 moves

The `state.countdown` object tracks the current count. Use `isDraw(state)` to check if the count has expired.

---

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Build
pnpm build

# Type check
pnpm type-check
```

### Project Structure

```
src/
├── bitboard/       # Bitboard implementation (default)
│   ├── board/      # Bitboard state and operations
│   ├── moves/      # Move generation and execution
│   ├── rules/      # Game rules (attacks, status, countdown)
│   ├── fen/        # FEN import/export
│   └── ai/         # AI and evaluation
├── 0x88/           # 0x88 implementation (deprecated)
│   ├── board/      # Board state management
│   ├── moves/      # Move generation and execution
│   ├── rules/      # Game rules
│   ├── fen/        # FEN import/export
│   ├── pgn/        # PGN import/export (0x88 only)
│   ├── ai/         # AI and evaluation
│   └── utils/      # 0x88-specific utilities
└── config/         # Shared constants and enums
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test moves/generation.test.ts
```

---

## License

MIT

## Credits

Created by [@kaisukez](https://github.com/kaisukez)
