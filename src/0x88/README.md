# 0x88 Board Representation

This document provides an in-depth explanation of the 0x88 board representation algorithm used in this chess engine implementation.

## Table of Contents

1. [Introduction](#introduction)
2. [The Problem with Standard Arrays](#the-problem-with-standard-arrays)
3. [The 0x88 Solution](#the-0x88-solution)
4. [Binary Deep Dive](#binary-deep-dive)
5. [Board State Structure](#board-state-structure)
6. [Square Indexing](#square-indexing)
7. [Direction Offsets](#direction-offsets)
8. [Move Generation](#move-generation)
9. [Attack Detection](#attack-detection)
10. [Check and Checkmate](#check-and-checkmate)
11. [FEN Parsing](#fen-parsing)
12. [State Management](#state-management)
13. [AI Search](#ai-search)
14. [File Structure](#file-structure)

---

## Introduction

The 0x88 representation is a board indexing scheme invented in the 1970s for chess programming. It uses a 128-element array (16 columns × 8 rows) instead of the intuitive 64-element array (8×8). This seemingly wasteful approach provides elegant solutions to common chess programming problems.

---

## The Problem with Standard Arrays

With a standard 8×8 array, move generation requires boundary checking:

```ts
// Standard 8x8 representation
const board = new Array(64)

function moveNorth(square: number): number | null {
    const newSquare = square + 8
    if (newSquare >= 64) return null  // Off the top
    return newSquare
}

function moveEast(square: number): number | null {
    if ((square % 8) === 7) return null  // Already on H file
    return square + 1
}

function moveNorthEast(square: number): number | null {
    if ((square % 8) === 7) return null  // H file check
    const newSquare = square + 9
    if (newSquare >= 64) return null     // Top edge check
    return newSquare
}
```

Each direction requires different boundary checks. Knight moves are even worse—8 different landing squares, each needing multiple condition checks.

---

## The 0x88 Solution

The 0x88 representation doubles the board width to 16 columns:

```
Array Layout (decimal indices):

     a    b    c    d    e    f    g    h   |  off-board area
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
8  | 112| 113| 114| 115| 116| 117| 118| 119| 120| 121| 122| 123| 124| 125| 126| 127|
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
7  |  96|  97|  98|  99| 100| 101| 102| 103| 104| 105| 106| 107| 108| 109| 110| 111|
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
6  |  80|  81|  82|  83|  84|  85|  86|  87|  88|  89|  90|  91|  92|  93|  94|  95|
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
5  |  64|  65|  66|  67|  68|  69|  70|  71|  72|  73|  74|  75|  76|  77|  78|  79|
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
4  |  48|  49|  50|  51|  52|  53|  54|  55|  56|  57|  58|  59|  60|  61|  62|  63|
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
3  |  32|  33|  34|  35|  36|  37|  38|  39|  40|  41|  42|  43|  44|  45|  46|  47|
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
2  |  16|  17|  18|  19|  20|  21|  22|  23|  24|  25|  26|  27|  28|  29|  30|  31|
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
1  |   0|   1|   2|   3|   4|   5|   6|   7|   8|   9|  10|  11|  12|  13|  14|  15|
   +----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+----+
```

The left 8 columns (files a-h) are the actual board. The right 8 columns are an "off-board" buffer zone.

---

## Binary Deep Dive

The magic is in the binary representation. Each square index can be split into:

```
Index = (rank × 16) + file

Bit layout of a square index:
  Bit:  7  6  5  4  3  2  1  0
        ├──────────┤  ├──────┤
           rank        file
        (0-7)         (0-15)
```

For **valid** squares (files 0-7):
- Bits 0-2 represent the file (0-7)
- Bit 3 is always 0 (since file < 8)
- Bits 4-6 represent the rank (0-7)
- Bit 7 is always 0 (since rank < 8)

For **invalid** squares (files 8-15 or rank overflow):
- Bit 3 is set (file ≥ 8), OR
- Bit 7 is set (rank overflow from addition)

The value `0x88` in binary is `10001000`:
```
0x88 = 128 + 8 = 136

Binary: 1 0 0 0 1 0 0 0
        │       │
        │       └─ Bit 3: file overflow detector
        └───────── Bit 7: rank overflow detector
```

**The 0x88 test:**
```ts
function isOnBoard(index: number): boolean {
    return (index & 0x88) === 0
}
```

This single operation checks BOTH:
1. File is in range 0-7 (bit 3 not set)
2. Rank is in range 0-7 (bit 7 not set)

**Examples with binary breakdown:**

```
Square a1 (index 0):
  Binary: 00000000
  0x88:   10001000
  AND:    00000000 = 0 ✓ Valid

Square h1 (index 7):
  Binary: 00000111
  0x88:   10001000
  AND:    00000000 = 0 ✓ Valid

Square "i1" (index 8, off-board):
  Binary: 00001000
  0x88:   10001000
  AND:    00001000 = 8 ✗ Invalid (bit 3 set)

Square h8 (index 119):
  Binary: 01110111
  0x88:   10001000
  AND:    00000000 = 0 ✓ Valid

Square "h9" (index 135, off-board):
  Binary: 10000111
  0x88:   10001000
  AND:    10000000 = 128 ✗ Invalid (bit 7 set)

Knight from h1 to "j2" (7 + 18 = 25):
  Index 25 binary: 00011001
  0x88:            10001000
  AND:             00001000 = 8 ✗ Invalid

Knight from a1 to b3 (0 + 33 = 33):
  Index 33 binary: 00100001
  0x88:            10001000
  AND:             00000000 = 0 ✓ Valid
```

---

## Board State Structure

The complete game state:

```ts
interface State {
    // The 128-element board array
    // Each element is either null (empty) or [Color, Piece]
    boardState: (SquareData | null)[]

    // Whose turn to move
    activeColor: Color  // Color.WHITE or Color.BLACK

    // Full move number (increments after Black moves)
    moveNumber: number

    // Quick lookup: which squares have which pieces
    piecePositions: {
        [Color.WHITE]: {
            [Piece.KHUN]: SquareIndex[]    // King positions
            [Piece.MET]: SquareIndex[]     // Queen positions
            [Piece.RUA]: SquareIndex[]     // Rook positions
            [Piece.MA]: SquareIndex[]      // Knight positions
            [Piece.THON]: SquareIndex[]    // Bishop positions
            [Piece.BIA]: SquareIndex[]     // Pawn positions
            [Piece.FLIPPED_BIA]: SquareIndex[]  // Promoted pawn
        }
        [Color.BLACK]: { /* same structure */ }
    }

    // Makruk counting rules state
    countdown: Countdown | null

    // Position occurrence count for threefold repetition
    fenOccurrence: Record<string, number>
}

type SquareData = [Color, Piece]  // e.g., [Color.WHITE, Piece.RUA]
```

**Why piecePositions?**

Without it, finding the king requires scanning all 64 squares:
```ts
// Slow: O(64)
function findKing(boardState, color) {
    for (let i = 0; i < 128; i++) {
        if (i & 0x88) continue
        if (boardState[i]?.[0] === color && boardState[i]?.[1] === Piece.KHUN) {
            return i
        }
    }
}
```

With piecePositions:
```ts
// Fast: O(1)
function findKing(state, color) {
    return state.piecePositions[color][Piece.KHUN][0]
}
```

---

## Square Indexing

Converting between representations:

```ts
// Rank (0-7) and File (0-7) to 0x88 index
function toIndex(rank: number, file: number): number {
    return rank * 16 + file
}

// 0x88 index to rank and file
function fromIndex(index: number): { rank: number; file: number } {
    return {
        rank: index >> 4,      // Divide by 16 (shift right 4 bits)
        file: index & 0x0F     // Modulo 16 (mask lower 4 bits)
    }
}

// Algebraic notation (e.g., "e4") to 0x88 index
function algebraicToIndex(notation: string): number {
    const file = notation.charCodeAt(0) - 'a'.charCodeAt(0)  // 0-7
    const rank = parseInt(notation[1]) - 1                    // 0-7
    return rank * 16 + file
}

// 0x88 index to algebraic notation
function indexToAlgebraic(index: number): string {
    const file = String.fromCharCode('a'.charCodeAt(0) + (index & 0x0F))
    const rank = (index >> 4) + 1
    return file + rank
}
```

**SquareIndex enum:**

For type safety, we define all valid squares:
```ts
enum SquareIndex {
    a1 = 0,   b1 = 1,   c1 = 2,   d1 = 3,   e1 = 4,   f1 = 5,   g1 = 6,   h1 = 7,
    a2 = 16,  b2 = 17,  c2 = 18,  d2 = 19,  e2 = 20,  f2 = 21,  g2 = 22,  h2 = 23,
    a3 = 32,  b3 = 33,  c3 = 34,  d3 = 35,  e3 = 36,  f3 = 37,  g3 = 38,  h3 = 39,
    a4 = 48,  b4 = 49,  c4 = 50,  d4 = 51,  e4 = 52,  f4 = 53,  g4 = 54,  h4 = 55,
    a5 = 64,  b5 = 65,  c5 = 66,  d5 = 67,  e5 = 68,  f5 = 69,  g5 = 70,  h5 = 71,
    a6 = 80,  b6 = 81,  c6 = 82,  d6 = 83,  e6 = 84,  f6 = 85,  g6 = 86,  h6 = 87,
    a7 = 96,  b7 = 97,  c7 = 98,  d7 = 99,  e7 = 100, f7 = 101, g7 = 102, h7 = 103,
    a8 = 112, b8 = 113, c8 = 114, d8 = 115, e8 = 116, f8 = 117, g8 = 118, h8 = 119,
}
```

---

## Direction Offsets

Moving in any direction is simple addition:

```ts
const Direction = {
    NORTH:      16,   // Up one rank
    SOUTH:     -16,   // Down one rank
    EAST:        1,   // Right one file
    WEST:       -1,   // Left one file
    NORTH_EAST: 17,   // Up-right diagonal
    NORTH_WEST: 15,   // Up-left diagonal
    SOUTH_EAST: -15,  // Down-right diagonal
    SOUTH_WEST: -17,  // Down-left diagonal
}
```

**Why these values work:**

```
Moving from e4 (index 52) to e5 (index 68):
  52 + 16 = 68 ✓

Moving from e4 (index 52) to f5 (index 69):
  52 + 17 = 69 ✓

Moving from e4 (index 52) to d3 (index 35):
  52 - 17 = 35 ✓
```

**Knight offsets:**

```ts
const KnightOffsets = [
    33,   // 2 up, 1 right:   +32 + 1 = +33
    31,   // 2 up, 1 left:    +32 - 1 = +31
    18,   // 1 up, 2 right:   +16 + 2 = +18
    14,   // 1 up, 2 left:    +16 - 2 = +14
    -14,  // 1 down, 2 right: -16 + 2 = -14
    -18,  // 1 down, 2 left:  -16 - 2 = -18
    -31,  // 2 down, 1 right: -32 + 1 = -31
    -33,  // 2 down, 1 left:  -32 - 1 = -33
]
```

---

## Move Generation

### Sliding Pieces (Rua/Rook)

Rooks slide horizontally and vertically until blocked:

```ts
function generateRuaMoves(
    from: SquareIndex,
    boardState: State['boardState'],
    color: Color
): Move[] {
    const moves: Move[] = []
    const directions = [16, -16, 1, -1]  // N, S, E, W

    for (const direction of directions) {
        let to = from + direction

        // Keep moving until off-board or blocked
        while ((to & 0x88) === 0) {
            const target = boardState[to]

            if (target === null) {
                // Empty square - can move here
                moves.push({ from, to, piece: Piece.RUA, color })
            } else {
                // Occupied square
                const [targetColor] = target
                if (targetColor !== color) {
                    // Enemy piece - can capture
                    moves.push({
                        from, to,
                        piece: Piece.RUA,
                        color,
                        captured: target[1]
                    })
                }
                break  // Blocked, stop this direction
            }

            to += direction
        }
    }

    return moves
}
```

### Stepping Pieces (Khun/King, Met/Queen, Thon/Bishop)

These pieces move only one square:

```ts
function generateKhunMoves(
    from: SquareIndex,
    boardState: State['boardState'],
    color: Color
): Move[] {
    const moves: Move[] = []
    // King moves one square in all 8 directions
    const directions = [16, -16, 1, -1, 17, 15, -15, -17]

    for (const direction of directions) {
        const to = from + direction

        if ((to & 0x88) !== 0) continue  // Off board

        const target = boardState[to]
        if (target === null) {
            moves.push({ from, to, piece: Piece.KHUN, color })
        } else if (target[0] !== color) {
            moves.push({
                from, to,
                piece: Piece.KHUN,
                color,
                captured: target[1]
            })
        }
    }

    return moves
}

// Met (Queen in Makruk) - moves one square diagonally
function generateMetMoves(from, boardState, color) {
    const directions = [17, 15, -15, -17]  // Diagonals only
    // ... same pattern as Khun
}

// Thon (Bishop in Makruk) - moves one square diagonally forward
function generateThonMoves(from, boardState, color) {
    // White moves north, black moves south
    const directions = color === Color.WHITE
        ? [17, 15]     // NE, NW
        : [-15, -17]   // SE, SW
    // ... same pattern
}
```

### Knight (Ma)

```ts
function generateMaMoves(
    from: SquareIndex,
    boardState: State['boardState'],
    color: Color
): Move[] {
    const moves: Move[] = []
    const offsets = [33, 31, 18, 14, -14, -18, -31, -33]

    for (const offset of offsets) {
        const to = from + offset

        // Single check handles ALL edge cases!
        if ((to & 0x88) !== 0) continue

        const target = boardState[to]
        if (target === null || target[0] !== color) {
            moves.push({
                from, to,
                piece: Piece.MA,
                color,
                captured: target?.[1]
            })
        }
    }

    return moves
}
```

### Pawns (Bia)

Makruk pawns start on the 3rd rank (white) or 6th rank (black), and promote when reaching the opponent's 3rd rank:

```ts
function generateBiaMoves(
    from: SquareIndex,
    boardState: State['boardState'],
    color: Color
): Move[] {
    const moves: Move[] = []
    const direction = color === Color.WHITE ? 16 : -16
    const promotionRank = color === Color.WHITE ? 5 : 2  // 0-indexed

    // Forward move (non-capture)
    const forward = from + direction
    if ((forward & 0x88) === 0 && boardState[forward] === null) {
        const rank = forward >> 4
        if (rank === promotionRank) {
            // Promote to Flipped Bia
            moves.push({
                from, to: forward,
                piece: Piece.BIA,
                color,
                promotion: Piece.FLIPPED_BIA
            })
        } else {
            moves.push({ from, to: forward, piece: Piece.BIA, color })
        }
    }

    // Diagonal captures
    const captureDirections = color === Color.WHITE ? [17, 15] : [-15, -17]
    for (const dir of captureDirections) {
        const to = from + dir
        if ((to & 0x88) !== 0) continue

        const target = boardState[to]
        if (target && target[0] !== color) {
            const rank = to >> 4
            if (rank === promotionRank) {
                moves.push({
                    from, to,
                    piece: Piece.BIA,
                    color,
                    captured: target[1],
                    promotion: Piece.FLIPPED_BIA
                })
            } else {
                moves.push({
                    from, to,
                    piece: Piece.BIA,
                    color,
                    captured: target[1]
                })
            }
        }
    }

    return moves
}
```

---

## Attack Detection

To determine if a square is attacked, we check if any enemy piece can reach it:

```ts
function isSquareAttacked(
    square: SquareIndex,
    byColor: Color,
    state: State
): boolean {
    const { boardState, piecePositions } = state

    // Check knight attacks
    for (const knightSquare of piecePositions[byColor][Piece.MA]) {
        for (const offset of [33, 31, 18, 14, -14, -18, -31, -33]) {
            if (knightSquare + offset === square) return true
        }
    }

    // Check rook attacks (horizontal/vertical rays)
    for (const rookSquare of piecePositions[byColor][Piece.RUA]) {
        if (isOnSameRankOrFile(rookSquare, square)) {
            if (hasLineOfSight(rookSquare, square, boardState)) return true
        }
    }

    // Check king attacks (one square any direction)
    const kingSquare = piecePositions[byColor][Piece.KHUN][0]
    for (const dir of [16, -16, 1, -1, 17, 15, -15, -17]) {
        if (kingSquare + dir === square) return true
    }

    // Check pawn attacks (diagonal)
    const pawnDir = byColor === Color.WHITE ? -16 : 16  // Opposite of move direction
    for (const pawnSquare of piecePositions[byColor][Piece.BIA]) {
        if (pawnSquare + pawnDir + 1 === square) return true
        if (pawnSquare + pawnDir - 1 === square) return true
    }

    // ... check other pieces

    return false
}

function hasLineOfSight(from: number, to: number, boardState): boolean {
    const direction = getDirection(from, to)
    let current = from + direction

    while (current !== to) {
        if ((current & 0x88) !== 0) return false  // Should never happen
        if (boardState[current] !== null) return false  // Blocked
        current += direction
    }

    return true
}
```

---

## Check and Checkmate

```ts
function isInCheck(state: State, color: Color): boolean {
    const kingSquare = state.piecePositions[color][Piece.KHUN][0]
    const enemyColor = color === Color.WHITE ? Color.BLACK : Color.WHITE
    return isSquareAttacked(kingSquare, enemyColor, state)
}

function isCheckmate(state: State, color: Color): boolean {
    if (!isInCheck(state, color)) return false

    // Try all legal moves - if any escapes check, not checkmate
    const legalMoves = generateLegalMoves(state)
    return legalMoves.length === 0
}

function generateLegalMoves(state: State): Move[] {
    const pseudoLegalMoves = generateAllMoves(state)

    return pseudoLegalMoves.filter(move => {
        // Apply the move
        const newState = applyMove(state, move)
        // Check if our king is in check after the move
        return !isInCheck(newState, state.activeColor)
    })
}
```

---

## FEN Parsing

FEN (Forsyth-Edwards Notation) describes a board position:

```
rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTEKTMR w 1
└──────────────────────────────────────┘ │ │
              Board layout              Turn Move#
```

```ts
function importFen(fen: string): State {
    const [boardStr, turn, moveNum] = fen.split(' ')
    const boardState = new Array(128).fill(null)
    const piecePositions = createEmptyPiecePositions()

    // Parse board string (rank 8 to rank 1, left to right)
    let square = 112  // Start at a8
    for (const char of boardStr) {
        if (char === '/') {
            square -= 24  // Move to next rank: -16 (next rank) + 8 (already moved)
            continue
        }

        if (/[1-8]/.test(char)) {
            square += parseInt(char)  // Skip empty squares
            continue
        }

        // Piece character
        const color = char === char.toUpperCase() ? Color.WHITE : Color.BLACK
        const piece = charToPiece(char.toLowerCase())

        boardState[square] = [color, piece]
        piecePositions[color][piece].push(square)
        square++
    }

    return {
        boardState,
        activeColor: turn === 'w' ? Color.WHITE : Color.BLACK,
        moveNumber: parseInt(moveNum),
        piecePositions,
        countdown: null,
        fenOccurrence: {}
    }
}
```

---

## State Management

We use immutable state updates for move execution:

```ts
function applyMove(state: State, move: Move): State {
    // Create new state (immutable)
    const newBoardState = [...state.boardState]
    const newPiecePositions = clonePiecePositions(state.piecePositions)

    // Remove piece from source square
    newBoardState[move.from] = null
    removeFromPiecePositions(newPiecePositions, move.color, move.piece, move.from)

    // Handle capture
    if (move.captured) {
        const enemyColor = move.color === Color.WHITE ? Color.BLACK : Color.WHITE
        removeFromPiecePositions(newPiecePositions, enemyColor, move.captured, move.to)
    }

    // Place piece on destination (possibly promoted)
    const finalPiece = move.promotion || move.piece
    newBoardState[move.to] = [move.color, finalPiece]
    addToPiecePositions(newPiecePositions, move.color, finalPiece, move.to)

    // Update turn and move number
    const newTurn = move.color === Color.WHITE ? Color.BLACK : Color.WHITE
    const newMoveNumber = state.moveNumber + (newTurn === Color.WHITE ? 1 : 0)

    return {
        boardState: newBoardState,
        activeColor: newTurn,
        moveNumber: newMoveNumber,
        piecePositions: newPiecePositions,
        countdown: updateCountdown(state, move),
        fenOccurrence: updateFenOccurrence(state, newBoardState, newTurn)
    }
}
```

---

## AI Search

The AI uses minimax with alpha-beta pruning:

```ts
function minimax(
    state: State,
    depth: number,
    alpha: number,
    beta: number,
    maximizingPlayer: boolean
): { score: number; bestMove: Move | null } {
    // Base case: evaluate position
    if (depth === 0 || isGameOver(state)) {
        return { score: evaluate(state), bestMove: null }
    }

    const moves = generateLegalMoves(state)
    let bestMove: Move | null = null

    if (maximizingPlayer) {
        let maxScore = -Infinity

        for (const move of moves) {
            const newState = applyMove(state, move)
            const result = minimax(newState, depth - 1, alpha, beta, false)

            if (result.score > maxScore) {
                maxScore = result.score
                bestMove = move
            }

            alpha = Math.max(alpha, maxScore)
            if (beta <= alpha) break  // Prune
        }

        return { score: maxScore, bestMove }
    } else {
        let minScore = Infinity

        for (const move of moves) {
            const newState = applyMove(state, move)
            const result = minimax(newState, depth - 1, alpha, beta, true)

            if (result.score < minScore) {
                minScore = result.score
                bestMove = move
            }

            beta = Math.min(beta, minScore)
            if (beta <= alpha) break  // Prune
        }

        return { score: minScore, bestMove }
    }
}

function evaluate(state: State): number {
    let score = 0

    // Material count
    const pieceValues = {
        [Piece.KHUN]: 10000,
        [Piece.RUA]: 500,
        [Piece.MA]: 300,
        [Piece.MET]: 150,
        [Piece.THON]: 150,
        [Piece.FLIPPED_BIA]: 150,
        [Piece.BIA]: 100,
    }

    for (const piece of Object.keys(pieceValues)) {
        score += state.piecePositions[Color.WHITE][piece].length * pieceValues[piece]
        score -= state.piecePositions[Color.BLACK][piece].length * pieceValues[piece]
    }

    // Add positional bonuses, mobility, etc.
    // ...

    return score
}
```

---

## File Structure

```
src/0x88/
├── board/
│   └── board.ts           # Board state manipulation, put/remove pieces
├── moves/
│   ├── generation.ts      # Move generation for all piece types
│   ├── execution.ts       # Apply moves, create new state
│   └── notation.ts        # SAN parsing (e.g., "Rxd4") and formatting
├── rules/
│   ├── attacks.ts         # Attack detection, isSquareAttacked
│   ├── status.ts          # isCheck, isCheckmate, isStalemate, isDraw
│   └── countdown.ts       # Makruk-specific counting rules
├── fen/
│   ├── importer.ts        # FEN string → State
│   └── exporter.ts        # State → FEN string
├── ai/
│   ├── search.ts          # Minimax with alpha-beta pruning
│   └── evaluation.ts      # Position evaluation function
├── utils/
│   ├── board-utils.ts     # printBoard, debugging helpers
│   └── immer-helpers.ts   # Immutable state update utilities
├── types.ts               # TypeScript interfaces and types
└── index.ts               # Public API exports
```

---

## Note

This implementation is deprecated. The [bitboard implementation](../bitboard/README.md) is 2-100x faster for most operations due to parallel bit operations and is recommended for all new projects.
