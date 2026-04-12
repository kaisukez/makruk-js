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
// In JavaScript BigInt, ~ produces a negative number, so we XOR with FULL_MASK instead
const FULL_MASK = 0xFFFF_FFFF_FFFF_FFFFn
const mask = 1n << 28n
bitboard &= (FULL_MASK ^ mask)

// Helper:
function clearBit(bb: Mask64, square: number): Mask64 {
    return bb & (FULL_MASK ^ (1n << BigInt(square)))
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
// NORTH: Up one rank (+8 squares). Mask with FULL_MASK to keep result in 64 bits.
function shiftNorth(bb: Mask64): Mask64 {
    return (bb << 8n) & FULL_MASK
}

// SOUTH: Down one rank (-8 squares)
function shiftSouth(bb: Mask64): Mask64 {
    return bb >> 8n
}

// EAST: Right one file (+1 square)
// Must mask off H-file to prevent wrapping to next rank.
// BigInt has no ~ operator that works like C, so use FULL_MASK ^ FILE_H.
function shiftEast(bb: Mask64): Mask64 {
    return (bb & (FULL_MASK ^ FILE_H)) << 1n
}

// WEST: Left one file (-1 square)
// Must mask off A-file to prevent wrapping to previous rank
function shiftWest(bb: Mask64): Mask64 {
    return (bb & (FULL_MASK ^ FILE_A)) >> 1n
}

// Diagonal shifts combine horizontal and vertical
function shiftNorthEast(bb: Mask64): Mask64 {
    return ((bb & (FULL_MASK ^ FILE_H)) << 9n) & FULL_MASK
}

function shiftNorthWest(bb: Mask64): Mask64 {
    return ((bb & (FULL_MASK ^ FILE_A)) << 7n) & FULL_MASK
}

function shiftSouthEast(bb: Mask64): Mask64 {
    return (bb & (FULL_MASK ^ FILE_H)) >> 7n
}

function shiftSouthWest(bb: Mask64): Mask64 {
    return (bb & (FULL_MASK ^ FILE_A)) >> 9n
}
```

**Why mask files for horizontal movement?**

Without masking, bits on h-file would wrap to a-file of next rank:
```
Before shift east (h1 piece):      After (WRONG without mask):
. . . . . . . 1                    1 . . . . . . .  ← Wrapped to a2!
. . . . . . . .                    . . . . . . . .
```

With mask `& (FULL_MASK ^ FILE_H)`:
```
Masked:                            After shift:
. . . . . . . 0  ← h1 bit cleared  . . . . . . . .  ← Correctly gone
```

**Note on BigInt and `~`:** In JavaScript, `~bigint` is not supported — it throws a TypeError. Use `FULL_MASK ^ bb` to invert all 64 bits.

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
    // Isolate the lowest set bit with (bb & -bb), then count its position
    // via binary string length. Fast for BigInt since no loop is needed.
    return (bb & -bb).toString(2).length - 1
}
```

### Pop LSB (Get and Remove)

```ts
function popLSB(bb: Mask64): { bb: Mask64; square: number } {
    const lsb = bb & -bb          // Isolate lowest set bit
    const square = lsb.toString(2).length - 1
    return { bb: bb ^ lsb, square }  // Clear the bit and return
}
```

**Usage for iterating over all pieces:**
```ts
let pieces = state.whiteRua
while (pieces !== EMPTY_MASK) {
    const { bb, square } = popLSB(pieces)
    pieces = bb
    // use square...
}
```

---

## Move Generation

### Pawn Moves (Bia)

Each pawn's forward move and diagonal attacks are pre-computed into lookup tables (`whitePawnMoves[sq]`, `blackPawnMoves[sq]`, `whitePawnAttacks[sq]`, `blackPawnAttacks[sq]`) at module load time. Move generation then just looks up and masks:

```ts
function generateBiaMoves(
    state: Board,
    color: Color,
    enemy: Mask64,
    moves: Move[],
    capturesOnly: boolean
): void {
    const isWhite = color === Color.WHITE
    let pawns = isWhite ? state.whiteBia : state.blackBia
    const promotionRank = isWhite ? RANK_6 : RANK_3

    while (pawns !== EMPTY_MASK) {
        const { bb, square } = popLSB(pawns)
        pawns = bb

        if (!capturesOnly) {
            // Forward non-capture moves (blocked by any piece)
            let pawnMoves = getPawnMoves(square, isWhite) & (FULL_MASK ^ state.allOccupancy)
            while (pawnMoves !== EMPTY_MASK) {
                // emit forward move, check promotion rank...
            }
        }

        // Diagonal captures onto enemy squares only
        let pawnAttacks = getPawnAttacks(square, isWhite) & enemy
        while (pawnAttacks !== EMPTY_MASK) {
            // emit capture move, check promotion rank...
        }
    }
}
```

**Note**: Makruk has no double-pawn-push rule. Bia always moves exactly one square forward.

### Stepping Pieces (Khun, Met, Thon, Ma)

Attack patterns are pre-computed at module load time into lookup tables. Move generation uses a `targetMask` — passing `FULL_MASK ^ friendly` generates all moves; passing just `enemy` generates captures only:

```ts
function generateKhunMoves(
    state: Board,
    color: Color,
    targetMask: Mask64,
    moves: Move[]
): void {
    const isWhite = color === Color.WHITE
    let kings = isWhite ? state.whiteKhun : state.blackKhun

    while (kings !== EMPTY_MASK) {
        const { bb, square } = popLSB(kings)
        kings = bb
        let attacks = getKingAttacks(square) & targetMask

        while (attacks !== EMPTY_MASK) {
            const { bb: remaining, square: toSquare } = popLSB(attacks)
            attacks = remaining
            moves.push({ from: square, to: toSquare, piece: Piece.KHUN, color,
                         captured: getPieceAt(state, toSquare)?.[1] })
        }
    }
}
```

All piece helpers (`generateFlippedBiaMoves`, `generateMaMoves`, `generateThonMoves`, `generateMetMoves`, `generateRuaMoves`, `generateKhunMoves`) share this same `targetMask` pattern, allowing `generatePseudoLegalMoves` and `generatePseudoLegalCaptures` to reuse them without any code duplication.

### Knight Move Table (Ma)

Pre-computed at startup using file-masked shifts:

```ts
// Example for one direction — "2 right, 1 up" = shift by +17, mask off H/G files
((bb & (FULL_MASK ^ FILE_G) & (FULL_MASK ^ FILE_H)) << 17n) & FULL_MASK
```

All 8 knight destinations are OR'd together for each square. The file masks prevent wrapping across the board boundary. The `FULL_MASK &` at the end keeps results within 64 bits for north shifts.

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
    state: Board,
    square: number,
    attackerColor: Color
): boolean {
    const isWhite = attackerColor === Color.WHITE

    // Pawn (Bia) attacks — reverse lookup:
    // "Could an attacker's pawn reach `square` diagonally?"
    // We ask: from `square`, what squares does the *defender's* pawn attack?
    // If an attacker's Bia is on any of those squares, it attacks `square`.
    const pawnAttackers = getPawnAttacks(square, !isWhite)
    const pawns = isWhite ? state.whiteBia : state.blackBia
    if ((pawns & pawnAttackers) !== EMPTY_MASK) return true

    // Knight (Ma) — symmetric, same attack mask works both ways
    const knightAttackers = getKnightAttacks(square)
    const knights = isWhite ? state.whiteMa : state.blackMa
    if ((knights & knightAttackers) !== EMPTY_MASK) return true

    // Diagonal pieces (FlippedBia, Thon, Met)
    const diagAttacks = getDiagonalAttacks(square)
    if ((isWhite ? state.whiteFlippedBia : state.blackFlippedBia) & diagAttacks) return true
    if ((isWhite ? state.whiteThon      : state.blackThon     ) & diagAttacks) return true
    if ((isWhite ? state.whiteMet       : state.blackMet      ) & diagAttacks) return true

    // Thon also attacks one square forward — check if an attacker's Thon is
    // one square *behind* `square` (i.e. in the direction it would move FROM)
    const thonForwardOffset = isWhite ? -8 : 8
    const thonAttackerSquare = square + thonForwardOffset
    if (thonAttackerSquare >= 0 && thonAttackerSquare < 64) {
        const thons = isWhite ? state.whiteThon : state.blackThon
        if ((thons & (1n << BigInt(thonAttackerSquare))) !== EMPTY_MASK) return true
    }

    // Rook (Rua) — sliding rays with occupancy
    const rookAttackers = getRookAttacks(square, state.allOccupancy)
    if ((isWhite ? state.whiteRua : state.blackRua) & rookAttackers) return true

    // King (Khun) — one square any direction
    if ((isWhite ? state.whiteKhun : state.blackKhun) & getKingAttacks(square)) return true

    return false
}
```

**Why "reverse attack" works:**

If we want to know if square X is attacked by a knight, we generate all squares a knight *on X* could reach. If any of those squares contains an enemy knight, that knight attacks X. This works because knight moves are symmetric. The same principle applies to all piece types.

---

## Check and Checkmate

```ts
// Is the Khun (king) of the given color currently in check?
function isKhunAttacked(state: Board, color: Color): boolean {
    const king = color === Color.WHITE ? state.whiteKhun : state.blackKhun
    if (king === EMPTY_MASK) return false
    const kingSquare = popLSB(king).square
    const enemyColor = swapColor(color)
    return isSquareAttacked(state, kingSquare, enemyColor)
}

// Legal moves filter: apply each pseudo-legal move, keep it only if our king
// is not in check afterwards
function generateLegalMoves(state: Board, color: Color): Move[] {
    const pseudoLegal = generatePseudoLegalMoves(state, color)
    const isWhite = color === Color.WHITE
    const enemyColor = swapColor(color)

    return pseudoLegal.filter(move => {
        const newState = applyMove(state, move)
        const kingMask = isWhite ? newState.whiteKhun : newState.blackKhun
        if (kingMask === EMPTY_MASK) return false
        return !isSquareAttacked(newState, popLSB(kingMask).square, enemyColor)
    })
}
```

Checkmate and stalemate are detected inside the search by combining `generateLegalMoves` (returns empty) with `isKhunAttacked` (distinguishes the two cases).

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

We use immutable updates for move execution. The new board is created by manually copying every field (not spread `{ ...state }`, to keep it explicit and avoid accidental extra fields), then directly mutating the relevant bitboard fields:

```ts
function applyMove(state: Board, move: Move): Board {
    const fromBit = 1n << BigInt(move.from)
    const toBit = 1n << BigInt(move.to)
    const clearFromBit = FULL_MASK ^ fromBit
    const finalPiece = move.promotion || move.piece

    // Shallow copy of all 14 piece bitboards + 3 occupancy fields
    let newState: Board = { ...state, whiteOccupancy: EMPTY_MASK, blackOccupancy: EMPTY_MASK, allOccupancy: EMPTY_MASK }

    // 1. Remove captured piece (if any) — direct field mutation, no helper call needed
    if (move.captured !== undefined) {
        const clearToBit = FULL_MASK ^ toBit
        if (enemyIsWhite) {
            switch (move.captured) {
                case Piece.BIA: newState.whiteBia &= clearToBit; break
                // ... other pieces
            }
        }
    }

    // 2. Remove moving piece from source
    switch (move.piece) {
        case Piece.RUA: newState.whiteRua &= clearFromBit; break
        // ...
    }

    // 3. Place piece (or promoted piece) on destination
    switch (finalPiece) {
        case Piece.FLIPPED_BIA: newState.whiteFlippedBia |= toBit; break
        // ...
    }

    // 4. Recompute occupancy from scratch
    updateOccupancy(newState)
    return newState
}
```

The three-step pattern (remove capture → remove from source → place on destination) handles all cases including promotion correctly. `FULL_MASK ^ bit` is the BigInt-safe way to clear a bit (JavaScript's `~` does not work on `bigint`).

---

## AI Search

Minimax with alpha-beta pruning, transposition table, quiescence search, and iterative deepening. See [ai/README.md](ai/README.md) for full documentation.

The search operates on a `Game` object (board + turn + hash + countdown + positionOccurrence) rather than the board alone. A `SearchContext` threads shared mutable state through the recursion:

```ts
interface SearchContext {
    tt: TranspositionTable | null
    // Frequency map of position hashes on the current path — O(1) repetition check
    pathFreq: Map<bigint, number>
    nodes: number       // shared node counter
    stopTime?: number   // wall-clock deadline for time-limited search
    aborted: boolean    // set when stopTime is exceeded
}
```

The public entry points are:

```ts
// Fixed-depth search
findBestMove(game, depth, tt?)

// Iterative deepening with optional time limit
iterativeDeepening(game, maxDepth, timeLimitMs?, tt?)

// Low-level (pass explicit alpha/beta)
minimax(game, depth, alpha, beta, tt?)
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
src/
├── common/
│   ├── const.ts           # Piece, Color enums, piece values, FEN constants
│   ├── fen.ts             # FEN string parsing (shared between 0x88 and bitboard)
│   └── utils.ts           # swapColor and other shared utilities
└── bitboard/
    ├── board/
    │   └── board.ts       # Mask64 type, Board interface, bit ops, file/rank masks
    ├── moves/
    │   ├── generation.ts  # Pseudo-legal + legal move generation for all piece types
    │   ├── execution.ts   # applyMove — immutable board update
    │   ├── notation.ts    # SAN parsing (e.g., "Rxd4") and formatting
    │   └── index.ts       # Public move API: move(), generateLegalMoves()
    ├── rules/
    │   ├── attacks.ts     # Pre-computed attack tables, getRookAttacks (hyperbola)
    │   ├── status.ts      # isKhunAttacked, isCheckmate, isInsufficientMaterial
    │   └── countdown.ts   # Makruk countdown rules (piece-power, board-power)
    ├── fen/
    │   ├── importer.ts    # FEN string → Game
    │   └── exporter.ts    # Game → FEN string
    ├── hash/
    │   └── zobrist.ts     # Zobrist hashing: computeHash, updateHashForMove
    ├── ai/
    │   ├── search.ts      # Minimax, alpha-beta, TT, quiescence, iterative deepening
    │   └── evaluation.ts  # evaluateFast: material + PST
    ├── types.ts           # Move, Game TypeScript interfaces
    └── index.ts           # Public API exports
```
