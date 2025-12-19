# Bitboard Representation

This document provides an in-depth explanation of the bitboard representation used in this chess engine implementation.

## Table of Contents

1. [Introduction](#introduction)
2. [What is a Bitboard?](#what-is-a-bitboard)
3. [Square Mapping](#square-mapping)
4. [Board State Structure](#board-state-structure)
5. [Fundamental Bit Operations](#fundamental-bit-operations)
6. [File and Rank Masks](#file-and-rank-masks)
7. [Shifting and Movement](#shifting-and-movement)
8. [Population Count and Bit Scanning](#population-count-and-bit-scanning)
9. [Move Generation](#move-generation)
10. [Attack Detection](#attack-detection)
11. [Check and Checkmate](#check-and-checkmate)
12. [FEN Parsing](#fen-parsing)
13. [State Management](#state-management)
14. [AI Search](#ai-search)
15. [Why Bitboards are Fast](#why-bitboards-are-fast)
16. [File Structure](#file-structure)

---

## Introduction

Bitboards are the most efficient known representation for chess positions. Instead of using arrays, we represent piece positions using 64-bit integers where each bit corresponds to one square on the 8×8 board.

This approach enables:
- **Parallel operations**: A single CPU instruction can affect all 64 squares
- **Efficient attack detection**: Bitwise AND/OR operations instead of loops
- **Compact representation**: 14 integers store the entire position
- **CPU optimization**: Modern CPUs have specialized bit manipulation instructions

---

## What is a Bitboard?

A bitboard is a 64-bit integer where each bit represents one square:

```
Bit 0  = a1    Bit 1  = b1    ...    Bit 7  = h1
Bit 8  = a2    Bit 9  = b2    ...    Bit 15 = h2
...
Bit 56 = a8    Bit 57 = b8    ...    Bit 63 = h8
```

A `1` bit means something is present at that square; `0` means empty.

**Example: All white pawns on starting squares (rank 3 in Makruk)**

```
Rank 8:  0 0 0 0 0 0 0 0  = 0x00
Rank 7:  0 0 0 0 0 0 0 0  = 0x00
Rank 6:  0 0 0 0 0 0 0 0  = 0x00
Rank 5:  0 0 0 0 0 0 0 0  = 0x00
Rank 4:  0 0 0 0 0 0 0 0  = 0x00
Rank 3:  1 1 1 1 1 1 1 1  = 0xFF  ← All 8 pawns
Rank 2:  0 0 0 0 0 0 0 0  = 0x00
Rank 1:  0 0 0 0 0 0 0 0  = 0x00
         a b c d e f g h

Combined: 0x0000_0000_00FF_0000 (bits 16-23 set)
```

---

## Square Mapping

We use "Little-Endian Rank-File Mapping" (LERF):

```
Visual Board:              Bit Indices:

8 | r m t e k t m r       56 57 58 59 60 61 62 63
7 | . . . . . . . .       48 49 50 51 52 53 54 55
6 | b b b b b b b b       40 41 42 43 44 45 46 47
5 | . . . . . . . .       32 33 34 35 36 37 38 39
4 | . . . . . . . .       24 25 26 27 28 29 30 31
3 | B B B B B B B B       16 17 18 19 20 21 22 23
2 | . . . . . . . .        8  9 10 11 12 13 14 15
1 | R M T E K T M R        0  1  2  3  4  5  6  7
  +----------------
    a b c d e f g h
```

**Square index formula:**
```ts
square = rank * 8 + file

// Where:
// rank = 0 (rank 1) to 7 (rank 8)
// file = 0 (a-file) to 7 (h-file)

// Examples:
// a1 = 0*8 + 0 = 0
// h1 = 0*8 + 7 = 7
// a8 = 7*8 + 0 = 56
// e4 = 3*8 + 4 = 28
```

**Reverse conversion:**
```ts
rank = Math.floor(square / 8)  // or: square >> 3
file = square % 8               // or: square & 7
```

---

## Board State Structure

We maintain 17 bitboards for the complete position:

```ts
type Mask64 = bigint  // 64-bit unsigned integer

interface BoardState {
    // 7 bitboards for white pieces
    whiteBia: Mask64         // White pawns
    whiteFlippedBia: Mask64  // White promoted pawns
    whiteMa: Mask64          // White knights
    whiteThon: Mask64        // White bishops
    whiteMet: Mask64         // White queen
    whiteRua: Mask64         // White rooks
    whiteKhun: Mask64        // White king

    // 7 bitboards for black pieces
    blackBia: Mask64
    blackFlippedBia: Mask64
    blackMa: Mask64
    blackThon: Mask64
    blackMet: Mask64
    blackRua: Mask64
    blackKhun: Mask64

    // 3 occupancy bitboards (derived, for faster lookup)
    whiteOccupancy: Mask64   // All white pieces OR'd together
    blackOccupancy: Mask64   // All black pieces OR'd together
    allOccupancy: Mask64     // All pieces OR'd together
}
```

**Why separate bitboards per piece type?**

1. **Fast piece lookup**: To find all rooks, just use `whiteRua | blackRua`
2. **Attack patterns differ**: Rooks and knights move differently
3. **Evaluation needs piece types**: Material counting, positional bonuses

**Occupancy bitboards:**
```ts
function updateOccupancy(state: BoardState): void {
    state.whiteOccupancy =
        state.whiteBia |
        state.whiteFlippedBia |
        state.whiteMa |
        state.whiteThon |
        state.whiteMet |
        state.whiteRua |
        state.whiteKhun

    state.blackOccupancy =
        state.blackBia |
        state.blackFlippedBia |
        state.blackMa |
        state.blackThon |
        state.blackMet |
        state.blackRua |
        state.blackKhun

    state.allOccupancy = state.whiteOccupancy | state.blackOccupancy
}
```

---

## Fundamental Bit Operations

### Setting a Bit (Place a Piece)

```ts
// Set bit at square 28 (e4)
bitboard |= (1n << 28n)

// Breakdown:
// 1n << 28n creates: 0x0000_0010_0000_0000
// The |= OR's this into the bitboard
```

### Clearing a Bit (Remove a Piece)

```ts
// In JavaScript BigInt, ~ creates negative numbers, so we use XOR with full mask
const ALL_BITS = 0xFFFF_FFFF_FFFF_FFFFn
const mask = 1n << 28n
bitboard &= (ALL_BITS ^ mask)

// Alternative using helper:
function clearBit(bb: Mask64, square: number): Mask64 {
    return bb & (ALL_BITS ^ (1n << BigInt(square)))
}
```

### Testing a Bit (Is Square Occupied?)

```ts
function getBit(bb: Mask64, square: number): boolean {
    return (bb & (1n << BigInt(square))) !== 0n
}

// Example: Is there a piece on e4?
const haspiece = (allOccupancy & (1n << 28n)) !== 0n
```

### Finding What Piece is on a Square

```ts
function getPieceAt(state: BoardState, square: number): [Color, Piece] | null {
    const bit = 1n << BigInt(square)

    // Check white pieces
    if (state.whiteBia & bit) return [Color.WHITE, Piece.BIA]
    if (state.whiteFlippedBia & bit) return [Color.WHITE, Piece.FLIPPED_BIA]
    if (state.whiteMa & bit) return [Color.WHITE, Piece.MA]
    if (state.whiteThon & bit) return [Color.WHITE, Piece.THON]
    if (state.whiteMet & bit) return [Color.WHITE, Piece.MET]
    if (state.whiteRua & bit) return [Color.WHITE, Piece.RUA]
    if (state.whiteKhun & bit) return [Color.WHITE, Piece.KHUN]

    // Check black pieces
    if (state.blackBia & bit) return [Color.BLACK, Piece.BIA]
    // ... etc

    return null
}
```

---

## File and Rank Masks

Pre-computed masks for common operations:

```ts
// File masks (vertical columns)
const FILE_A = 0x0101_0101_0101_0101n  // Bits: 0,8,16,24,32,40,48,56
const FILE_B = 0x0202_0202_0202_0202n
const FILE_C = 0x0404_0404_0404_0404n
const FILE_D = 0x0808_0808_0808_0808n
const FILE_E = 0x1010_1010_1010_1010n
const FILE_F = 0x2020_2020_2020_2020n
const FILE_G = 0x4040_4040_4040_4040n
const FILE_H = 0x8080_8080_8080_8080n

// Rank masks (horizontal rows)
const RANK_1 = 0x0000_0000_0000_00FFn  // Bits: 0-7
const RANK_2 = 0x0000_0000_0000_FF00n  // Bits: 8-15
const RANK_3 = 0x0000_0000_00FF_0000n  // Bits: 16-23
const RANK_4 = 0x0000_0000_FF00_0000n  // Bits: 24-31
const RANK_5 = 0x0000_00FF_0000_0000n  // Bits: 32-39
const RANK_6 = 0x0000_FF00_0000_0000n  // Bits: 40-47
const RANK_7 = 0x00FF_0000_0000_0000n  // Bits: 48-55
const RANK_8 = 0xFF00_0000_0000_0000n  // Bits: 56-63

// Visual of FILE_A:
// 8: 1 . . . . . . .
// 7: 1 . . . . . . .
// 6: 1 . . . . . . .
// 5: 1 . . . . . . .
// 4: 1 . . . . . . .
// 3: 1 . . . . . . .
// 2: 1 . . . . . . .
// 1: 1 . . . . . . .
//    a b c d e f g h
```

**Usage examples:**
```ts
// Get all pieces on the e-file
const piecesOnEFile = allOccupancy & FILE_E

// Get all white pieces on rank 1
const whitePiecesRank1 = whiteOccupancy & RANK_1

// Check if a piece is on the h-file (for east shift)
const isOnHFile = (piece & FILE_H) !== 0n
```

---

## Shifting and Movement

Shifting moves all bits in a direction simultaneously:

```ts
// NORTH: Up one rank (+8 squares)
function shiftNorth(bb: Mask64): Mask64 {
    return bb << 8n
}

// SOUTH: Down one rank (-8 squares)
function shiftSouth(bb: Mask64): Mask64 {
    return bb >> 8n
}

// EAST: Right one file (+1 square)
// Must mask off H-file to prevent wrapping to next rank
function shiftEast(bb: Mask64): Mask64 {
    return (bb & ~FILE_H) << 1n
}

// WEST: Left one file (-1 square)
// Must mask off A-file to prevent wrapping to previous rank
function shiftWest(bb: Mask64): Mask64 {
    return (bb & ~FILE_A) >> 1n
}

// Diagonal shifts combine horizontal and vertical
function shiftNorthEast(bb: Mask64): Mask64 {
    return (bb & ~FILE_H) << 9n  // +8 (north) + 1 (east) = +9
}

function shiftNorthWest(bb: Mask64): Mask64 {
    return (bb & ~FILE_A) << 7n  // +8 (north) - 1 (west) = +7
}

function shiftSouthEast(bb: Mask64): Mask64 {
    return (bb & ~FILE_H) >> 7n  // -8 (south) + 1 (east) = -7
}

function shiftSouthWest(bb: Mask64): Mask64 {
    return (bb & ~FILE_A) >> 9n  // -8 (south) - 1 (west) = -9
}
```

**Why mask files for horizontal movement?**

Without masking, bits on h-file would wrap to a-file of next rank:
```
Before shift east (h1 piece):      After (WRONG without mask):
. . . . . . . 1                    1 . . . . . . .  ← Wrapped to a2!
. . . . . . . .                    . . . . . . . .
```

With mask `& ~FILE_H`:
```
(bb & ~FILE_H):                    After shift:
. . . . . . . 0  ← h1 bit cleared  . . . . . . . .  ← Correctly gone
```

---

## Population Count and Bit Scanning

### Counting Set Bits (Population Count)

```ts
function popCount(bb: Mask64): number {
    let count = 0
    while (bb !== 0n) {
        count++
        bb &= bb - 1n  // Clear the least significant set bit
    }
    return count
}
```

**How `bb &= bb - 1n` works (Brian Kernighan's algorithm):**
```
bb     = 0b1010_1100
bb - 1 = 0b1010_1011  (borrows from rightmost 1)
bb & (bb-1) = 0b1010_1000  ← Rightmost 1 is cleared!

Repeat until bb = 0, counting iterations.
```

### Finding the Least Significant Bit (LSB)

```ts
function getLSB(bb: Mask64): number {
    if (bb === 0n) return -1

    let square = 0
    while ((bb & 1n) === 0n) {
        bb >>= 1n
        square++
    }
    return square
}
```

### Pop LSB (Get and Remove)

```ts
function popLSB(bb: Mask64): { newBb: Mask64; square: number } {
    const square = getLSB(bb)
    const newBb = bb & (bb - 1n)  // Clear LSB
    return { newBb, square }
}
```

**Usage for iterating over all pieces:**
```ts
function forEachPiece(bb: Mask64, callback: (square: number) => void): void {
    while (bb !== 0n) {
        const { newBb, square } = popLSB(bb)
        callback(square)
        bb = newBb
    }
}
```

---

## Move Generation

### Pawn Moves (Bia)

Bitboards enable parallel pawn move generation:

```ts
function generateBiaMoves(state: BoardState, color: Color): Move[] {
    const moves: Move[] = []
    const pawns = color === Color.WHITE ? state.whiteBia : state.blackBia
    const enemies = color === Color.WHITE ? state.blackOccupancy : state.whiteOccupancy
    const empty = ~state.allOccupancy

    if (color === Color.WHITE) {
        // Forward moves: shift north, mask with empty squares
        let pushes = shiftNorth(pawns) & empty

        // Iterate over each push destination
        while (pushes !== 0n) {
            const { newBb, square: to } = popLSB(pushes)
            const from = to - 8  // Source is one rank below
            moves.push(createMove(from, to, Piece.BIA, color))
            pushes = newBb
        }

        // Captures: diagonal shifts, mask with enemy pieces
        let capturesNE = shiftNorthEast(pawns) & enemies
        let capturesNW = shiftNorthWest(pawns) & enemies

        while (capturesNE !== 0n) {
            const { newBb, square: to } = popLSB(capturesNE)
            const from = to - 9
            const captured = findCapturedPiece(state, to)
            moves.push(createMove(from, to, Piece.BIA, color, captured))
            capturesNE = newBb
        }
        // Similar for NW captures...
    }
    // Similar for black (shift south instead)...

    return moves
}
```

### Stepping Pieces (Khun, Met, Thon)

Pre-compute attack patterns for each square:

```ts
// King attacks from each square (pre-computed)
const KING_ATTACKS: Mask64[] = new Array(64)

function initKingAttacks(): void {
    for (let sq = 0; sq < 64; sq++) {
        const bb = 1n << BigInt(sq)
        KING_ATTACKS[sq] =
            shiftNorth(bb) |
            shiftSouth(bb) |
            shiftEast(bb) |
            shiftWest(bb) |
            shiftNorthEast(bb) |
            shiftNorthWest(bb) |
            shiftSouthEast(bb) |
            shiftSouthWest(bb)
    }
}

function generateKhunMoves(state: BoardState, color: Color): Move[] {
    const moves: Move[] = []
    const king = color === Color.WHITE ? state.whiteKhun : state.blackKhun
    const friendly = color === Color.WHITE ? state.whiteOccupancy : state.blackOccupancy

    const kingSquare = getLSB(king)
    let attacks = KING_ATTACKS[kingSquare] & ~friendly  // Can't capture own pieces

    while (attacks !== 0n) {
        const { newBb, square: to } = popLSB(attacks)
        const captured = findCapturedPiece(state, to)
        moves.push(createMove(kingSquare, to, Piece.KHUN, color, captured))
        attacks = newBb
    }

    return moves
}
```

### Knight Moves (Ma)

Knights also use pre-computed attack tables:

```ts
const KNIGHT_ATTACKS: Mask64[] = new Array(64)

function initKnightAttacks(): void {
    for (let sq = 0; sq < 64; sq++) {
        const bb = 1n << BigInt(sq)
        KNIGHT_ATTACKS[sq] =
            ((bb & ~FILE_A & ~FILE_B) << 6n) |   // 2 left, 1 up
            ((bb & ~FILE_G & ~FILE_H) << 10n) |  // 2 right, 1 up
            ((bb & ~FILE_A) << 15n) |            // 1 left, 2 up
            ((bb & ~FILE_H) << 17n) |            // 1 right, 2 up
            ((bb & ~FILE_A) >> 17n) |            // 1 left, 2 down
            ((bb & ~FILE_H) >> 15n) |            // 1 right, 2 down
            ((bb & ~FILE_A & ~FILE_B) >> 10n) |  // 2 left, 1 down
            ((bb & ~FILE_G & ~FILE_H) >> 6n)     // 2 right, 1 down
    }
}
```

### Sliding Pieces (Rua/Rook)

Rooks require ray generation along files and ranks:

```ts
function generateRuaMoves(
    state: BoardState,
    color: Color
): Move[] {
    const moves: Move[] = []
    let rooks = color === Color.WHITE ? state.whiteRua : state.blackRua
    const friendly = color === Color.WHITE ? state.whiteOccupancy : state.blackOccupancy

    while (rooks !== 0n) {
        const { newBb, square: from } = popLSB(rooks)

        // Generate ray in each direction
        let attacks = 0n

        // North ray
        for (let sq = from + 8; sq < 64; sq += 8) {
            attacks |= (1n << BigInt(sq))
            if (state.allOccupancy & (1n << BigInt(sq))) break  // Blocked
        }

        // South ray
        for (let sq = from - 8; sq >= 0; sq -= 8) {
            attacks |= (1n << BigInt(sq))
            if (state.allOccupancy & (1n << BigInt(sq))) break
        }

        // East ray
        for (let sq = from + 1; (sq & 7) !== 0 && sq < 64; sq += 1) {
            attacks |= (1n << BigInt(sq))
            if (state.allOccupancy & (1n << BigInt(sq))) break
        }

        // West ray
        for (let sq = from - 1; (sq & 7) !== 7 && sq >= 0; sq -= 1) {
            attacks |= (1n << BigInt(sq))
            if (state.allOccupancy & (1n << BigInt(sq))) break
        }

        // Remove friendly pieces (can't capture own)
        attacks &= ~friendly

        // Convert attacks bitboard to move list
        while (attacks !== 0n) {
            const { newBb: newAttacks, square: to } = popLSB(attacks)
            const captured = findCapturedPiece(state, to)
            moves.push(createMove(from, to, Piece.RUA, color, captured))
            attacks = newAttacks
        }

        rooks = newBb
    }

    return moves
}
```

---

## Attack Detection

Bitboards excel at attack detection using a "reverse attack" technique:

```ts
function isSquareAttacked(
    state: BoardState,
    square: number,
    byColor: Color
): boolean {
    const enemies = byColor === Color.WHITE ? state : getBlackPieces(state)

    // Knight attacks: if a knight could attack FROM this square
    // and there's an enemy knight there, we're attacked
    if (KNIGHT_ATTACKS[square] & enemies.ma) return true

    // King attacks (one square any direction)
    if (KING_ATTACKS[square] & enemies.khun) return true

    // Pawn attacks (diagonal, direction depends on attacker color)
    const pawnAttackMask = byColor === Color.WHITE
        ? getPawnAttacksBlack(square)  // Black pawn attacks this square if...
        : getPawnAttacksWhite(square)
    if (pawnAttackMask & enemies.bia) return true

    // Rook attacks (rays)
    const rookAttacks = generateRuaAttacks(square, state.allOccupancy)
    if (rookAttacks & enemies.rua) return true

    // ... similar for other pieces

    return false
}

// Helper: Generate rook attack rays from a square
function generateRuaAttacks(square: number, occupancy: Mask64): Mask64 {
    let attacks = 0n

    // North
    for (let sq = square + 8; sq < 64; sq += 8) {
        attacks |= (1n << BigInt(sq))
        if (occupancy & (1n << BigInt(sq))) break
    }
    // South, East, West...

    return attacks
}
```

**Why "reverse attack" works:**

If we want to know if square X is attacked by a knight:
- Generate all squares a knight on X could attack
- If any of those squares has an enemy knight, that knight attacks X!

This works because knight moves are symmetric.

---

## Check and Checkmate

```ts
function isInCheck(state: BoardState, color: Color): boolean {
    const king = color === Color.WHITE ? state.whiteKhun : state.blackKhun
    const kingSquare = getLSB(king)
    const enemyColor = color === Color.WHITE ? Color.BLACK : Color.WHITE
    return isSquareAttacked(state, kingSquare, enemyColor)
}

function isCheckmate(state: BoardState, color: Color): boolean {
    if (!isInCheck(state, color)) return false

    const legalMoves = generateLegalMoves(state, color)
    return legalMoves.length === 0
}

function generateLegalMoves(state: BoardState, color: Color): Move[] {
    const pseudoLegalMoves = generateAllMoves(state, color)

    return pseudoLegalMoves.filter(move => {
        const newState = applyMove(state, move)
        return !isInCheck(newState, color)  // King not in check after move
    })
}
```

---

## FEN Parsing

```ts
function importFen(fen: string): { state: BoardState; turn: Color; moveNumber: number } {
    const [boardStr, turnStr, moveNumStr] = fen.split(' ')
    const state = createEmptyBoardState()

    // Parse board string (rank 8 to rank 1)
    let square = 56  // Start at a8

    for (const char of boardStr) {
        if (char === '/') {
            square -= 16  // Move to start of next rank down
            continue
        }

        if (/[1-8]/.test(char)) {
            square += parseInt(char)  // Skip empty squares
            continue
        }

        // Piece character
        const color = char === char.toUpperCase() ? Color.WHITE : Color.BLACK
        const piece = charToPiece(char.toLowerCase())

        // Set bit in appropriate bitboard
        setPiece(state, color, piece, square)
        square++
    }

    updateOccupancy(state)

    return {
        state,
        turn: turnStr === 'w' ? Color.WHITE : Color.BLACK,
        moveNumber: parseInt(moveNumStr)
    }
}

function exportFen(state: BoardState, turn: Color, moveNumber: number): string {
    let boardStr = ''

    for (let rank = 7; rank >= 0; rank--) {
        let emptyCount = 0

        for (let file = 0; file < 8; file++) {
            const square = rank * 8 + file
            const piece = getPieceAt(state, square)

            if (piece === null) {
                emptyCount++
            } else {
                if (emptyCount > 0) {
                    boardStr += emptyCount
                    emptyCount = 0
                }
                boardStr += pieceToChar(piece[0], piece[1])
            }
        }

        if (emptyCount > 0) boardStr += emptyCount
        if (rank > 0) boardStr += '/'
    }

    const turnChar = turn === Color.WHITE ? 'w' : 'b'
    return `${boardStr} ${turnChar} ${moveNumber}`
}
```

---

## State Management

We use immutable updates for move execution:

```ts
function applyMove(state: BoardState, move: Move): BoardState {
    // Clone all bitboards
    const newState: BoardState = { ...state }

    const fromBit = 1n << BigInt(move.from)
    const toBit = 1n << BigInt(move.to)
    const ALL_BITS = 0xFFFF_FFFF_FFFF_FFFFn

    // Remove piece from source square
    const clearFromMask = ALL_BITS ^ fromBit
    if (move.color === Color.WHITE) {
        switch (move.piece) {
            case Piece.BIA:
                newState.whiteBia &= clearFromMask
                break
            case Piece.RUA:
                newState.whiteRua &= clearFromMask
                break
            // ... other pieces
        }
    }
    // Similar for black...

    // Handle capture (remove enemy piece from destination)
    if (move.captured) {
        const clearToMask = ALL_BITS ^ toBit
        const enemyColor = move.color === Color.WHITE ? Color.BLACK : Color.WHITE
        // Clear captured piece from enemy bitboard...
    }

    // Place piece on destination (possibly promoted)
    const finalPiece = move.promotion || move.piece
    if (move.color === Color.WHITE) {
        switch (finalPiece) {
            case Piece.BIA:
                newState.whiteBia |= toBit
                break
            // ... other pieces
        }
    }

    // Update occupancy bitboards
    updateOccupancy(newState)

    return newState
}
```

---

## AI Search

Minimax with alpha-beta pruning and transposition table:

```ts
interface TranspositionEntry {
    depth: number
    score: number
    flag: 'exact' | 'lowerbound' | 'upperbound'
    bestMove: Move | null
}

const transpositionTable = new Map<string, TranspositionEntry>()

function minimax(
    state: BoardState,
    turn: Color,
    depth: number,
    alpha: number,
    beta: number
): { bestScore: number; bestMove: Move | null } {
    // Check transposition table
    const hash = hashState(state, turn)
    const cached = transpositionTable.get(hash)
    if (cached && cached.depth >= depth) {
        if (cached.flag === 'exact') {
            return { bestScore: cached.score, bestMove: cached.bestMove }
        }
        // Handle lowerbound/upperbound...
    }

    // Base case
    if (depth === 0) {
        return { bestScore: evaluate(state), bestMove: null }
    }

    const moves = generateLegalMoves(state, turn)
    if (moves.length === 0) {
        // Checkmate or stalemate
        return {
            bestScore: isInCheck(state, turn) ? -Infinity : 0,
            bestMove: null
        }
    }

    let bestMove: Move | null = null
    const isMaximizing = turn === Color.WHITE

    if (isMaximizing) {
        let bestScore = -Infinity
        for (const move of moves) {
            const newState = applyMove(state, move)
            const result = minimax(newState, Color.BLACK, depth - 1, alpha, beta)

            if (result.bestScore > bestScore) {
                bestScore = result.bestScore
                bestMove = move
            }
            alpha = Math.max(alpha, bestScore)
            if (beta <= alpha) break  // Prune
        }
        return { bestScore, bestMove }
    } else {
        // Minimizing...
    }
}

function evaluate(state: BoardState): number {
    let score = 0

    // Material using popCount
    score += popCount(state.whiteRua) * 500
    score -= popCount(state.blackRua) * 500
    score += popCount(state.whiteMa) * 300
    score -= popCount(state.blackMa) * 300
    // ... other pieces

    return score
}
```

---

## Why Bitboards are Fast

1. **Parallel Operations**
   - One `<<` shifts all 64 squares simultaneously
   - One `&` intersects all squares at once
   - No loops for many common operations

2. **CPU-Optimized**
   - Modern CPUs have dedicated bit manipulation instructions
   - POPCNT (population count) is a single instruction
   - BSF/BSR (bit scan forward/reverse) for LSB/MSB

3. **Cache-Friendly**
   - Entire board fits in 17 × 8 = 136 bytes
   - Fits in L1 cache
   - Minimal memory access during search

4. **Branch Reduction**
   - Many conditionals become bitwise operations
   - Better CPU branch prediction
   - Fewer pipeline stalls

See [benchmark/README.md](../../benchmark/README.md) for performance comparisons with 0x88.

---

## File Structure

```
src/bitboard/
├── board/
│   └── board.ts           # Mask64 type, BoardState, bit operations, masks
├── moves/
│   ├── generation.ts      # Move generation for all piece types
│   ├── execution.ts       # Apply moves, create new state
│   └── notation.ts        # SAN parsing (e.g., "Rxd4") and formatting
├── rules/
│   ├── attacks.ts         # Attack tables, isSquareAttacked
│   ├── status.ts          # isCheck, isCheckmate, isStalemate, isDraw
│   └── countdown.ts       # Makruk-specific counting rules
├── fen/
│   ├── importer.ts        # FEN string → BoardState
│   └── exporter.ts        # BoardState → FEN string
├── ai/
│   ├── search.ts          # Minimax, alpha-beta, transposition table
│   └── evaluation.ts      # Position evaluation function
├── utils/
│   └── board-utils.ts     # printBoard, debugging helpers
├── types.ts               # TypeScript interfaces and types
└── index.ts               # Public API exports
```
