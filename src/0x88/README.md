# Makruk JS - 0x88 Implementation

> ⚠️ **DEPRECATED:** This implementation is maintained for backward compatibility only. For new projects, please use the [bitboard implementation](../../README.md) which is 20-400x faster.

## Overview

The 0x88 implementation uses an array-based board representation. It's the original implementation of this library and includes ASCII board visualization for debugging.

## When to Use This

Use the 0x88 version if you need:
- **ASCII Board Visualization** - `printBoard()` function for debugging
- **Backward Compatibility** - Existing code that depends on the 0x88 API

For everything else, **use the bitboard version** for significantly better performance. Note that PGN support is now available in both implementations.

## Installation

```bash
npm install @kaisukez/makruk-js
```

## Usage

Import from the 0x88 subdirectory:

```ts
// Import the 0x88 implementation
import {
    importFen,
    INITIAL_FEN,
    move,
    isGameOver,
    generateLegalMoves,
    // PGN support (0x88 only)
    importPgn,
    exportPgnFromHistory,
    parsePgn,
    exportPgn,
    // Board visualization (0x88 only)
    printBoard
} from '@kaisukez/makruk-js/0x88'

// Use it
let state = importFen(INITIAL_FEN)
state = move(state, 'Me2')
console.log(printBoard(state.boardState))
```

## API Reference

### Core Functions

All core game functions are available:
- `move(state, move)` - Make a move
- `generateLegalMoves(state)` - Get legal moves
- `importFen(fen)` / `exportFen(state)` - FEN support
- `isGameOver(state)`, `isCheck(state)`, `isCheckmate(state)`, etc. - Status checking
- `findBestMove(state, depth)` - AI search
- `put(state, color, piece, square)` / `remove(state, square)` - Board manipulation

### PGN Support

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
import { importPgn } from '@kaisukez/makruk-js/0x88'

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
import { exportPgnFromHistory } from '@kaisukez/makruk-js/0x88'

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

For advanced use cases:

```ts
import { parsePgn, exportPgn } from '@kaisukez/makruk-js/0x88'
import type { PgnGame } from '@kaisukez/makruk-js/0x88'

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

### Board Visualization

#### `printBoard(boardState)`

Print the board as ASCII art (useful for debugging).

```ts
import { printBoard } from '@kaisukez/makruk-js/0x88'

console.log(printBoard(state.boardState))
// Outputs:
//      +------------------------+
//  8  | r  n  s  m  k  s  n  r |
//  7  | .  .  .  .  .  .  .  . |
//  6  | b  b  b  b  b  b  b  b |
//  5  | .  .  .  .  .  .  .  . |
//  4  | .  .  .  .  .  .  .  . |
//  3  | B  B  B  B  B  B  B  B |
//  2  | .  .  .  .  .  .  .  . |
//  1  | R  N  S  M  K  S  N  R |
//      +------------------------+
//        a  b  c  d  e  f  g  h
```

## State Object

The 0x88 State object contains:
- `boardState`: Array-based piece positions (0x88 representation)
- `activeColor`: Whose turn it is (Color.WHITE or Color.BLACK)
- `moveNumber`: Current move number
- `piecePositions`: Map of piece locations
- `countdown`: Makruk counting rule state
- `fenOccurrence`: Position repetition tracking

## Examples

### Example: Load and Save Games with PGN

```ts
import {
    importPgn,
    exportPgnFromHistory,
    printBoard
} from '@kaisukez/makruk-js/0x88'

// Load a game from PGN
const pgnString = `[Event "Example Game"]
1. e4 e5 2. Nf3 Nc6 *`

const states = importPgn(pgnString)

// Play through the game
states.forEach((state, index) => {
    console.log(`\nPosition after move ${index}:`)
    console.log(printBoard(state.boardState))
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

### Example: AI Game with Visualization

```ts
import {
    importFen,
    INITIAL_FEN,
    move,
    isGameOver,
    findBestMove,
    printBoard,
} from '@kaisukez/makruk-js/0x88'

function runUntilGameFinished() {
    let state = importFen(INITIAL_FEN)
    let moveCount = 0

    while (!isGameOver(state)) {
        const { bestMove } = findBestMove(state, 3)
        if (!bestMove) break

        state = move(state, bestMove)
        moveCount++

        console.log(`\nMove ${moveCount}: ${bestMove.san}`)
        console.log(printBoard(state.boardState))
    }

    console.log('\nGame over!')
}

runUntilGameFinished()
```

## Migration to Bitboard

If you're using the 0x88 version and want to migrate to the faster bitboard implementation:

### What Works the Same
- Core API: `move()`, `generateLegalMoves()`, `isGameOver()`, etc.
- FEN import/export
- PGN import/export
- AI functions
- All constants and enums

### What's Different
- No `printBoard()` function (use FEN instead for visualization)
- Different internal state structure
- State is simpler (no direct access to `boardState`)

### Migration Example

**Before (0x88):**
```ts
import { importFen, move, printBoard } from '@kaisukez/makruk-js/0x88'

let state = importFen(INITIAL_FEN)
state = move(state, 'Me2')
console.log(printBoard(state.boardState))
```

**After (Bitboard):**
```ts
import { importFen, move } from '@kaisukez/makruk-js'

let state = importFen(INITIAL_FEN)
state = move(state, 'Me2')
console.log(state.fen)  // Use FEN instead of ASCII visualization
```

## Performance Comparison

The bitboard version is significantly faster:

| Operation | 0x88 | Bitboard | Speedup |
|-----------|------|----------|---------|
| FEN Import (initial position) | 0.0139 ms | 0.0234 ms | 0.59x |
| FEN Export (initial position) | 0.0041 ms | 0.0001 ms | **41x faster** |
| Move Generation (initial) | 0.7441 ms | 0.0258 ms | **29x faster** |
| AI Search (depth 1) | 20.56 ms | 0.29 ms | **71x faster** |
| AI Search (depth 2) | 72.34 ms | 0.18 ms | **402x faster** |

**Recommendation:** Use bitboard for any performance-critical applications. Use 0x88 only if you need PGN support or board visualization.

## TypeScript Types

```ts
import type {
    State,
    MoveObject,
    MinimaxOutput,
    PgnGame,
    PgnMove,
    PgnExportOptions,
    PgnParseOptions
} from '@kaisukez/makruk-js/0x88'
```

## See Also

- [Main README (Bitboard)](../../README.md) - The recommended implementation
- [Benchmark Results](../../benchmark/README.md) - Detailed performance comparison

## License

MIT
