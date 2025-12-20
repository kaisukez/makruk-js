# Zobrist Hashing

Zobrist hashing is the standard technique used by chess engines to compute a unique hash for each board position. It enables O(1) incremental updates when making moves.

## Why Use It

### Repetition Detection

In Makruk, a position occurring three times is a draw (threefold repetition). Without Zobrist hashing, you'd need to compare the entire board state for every previous position — O(n × board_size) per move.

With Zobrist hashing, each position has a 64-bit hash. Checking for repetition becomes a simple hash table lookup — O(1).

### Transposition Tables

During search, the engine often reaches the same position through different move orders:
- 1.Bc3 Bc6 2.Md2 Md7
- 1.Md2 Md7 2.Bc3 Bc6

Both lead to the same position. A transposition table caches evaluation results keyed by position hash, avoiding redundant computation.

## How It Works

### The Core Insight: XOR Properties

The algorithm relies on two properties of XOR:

```
a ^ a = 0          XORing with itself cancels out
a ^ b ^ a = b      XOR is its own inverse
```

This means **adding and removing a piece use the exact same operation**. To add a white Rua on a1, XOR the hash with `key[WHITE_RUA][a1]`. To remove it, XOR with the same key again.

### Pre-computed Random Keys

At initialization, we generate random 64-bit numbers for every possible (piece, color, square) combination:

```
7 piece types × 2 colors × 64 squares = 896 random keys
```

Plus one additional key for "side to move" (XORed when it's black's turn).

These are generated with a **fixed seed** (`0x12345678ABCDEFn`) so the same keys are produced every time the program runs. This ensures hash consistency across sessions.

### Computing the Full Hash

To hash a position from scratch, XOR together the keys for all pieces on the board:

```typescript
let hash = 0n

// XOR key for each piece on the board
for (const [color, piece, square] of allPiecesOnBoard) {
    hash ^= KEYS[color][piece][square]
}

// XOR side-to-move key if black to play
if (turn === Color.BLACK) {
    hash ^= SIDE_KEY
}
```

### Incremental Updates

When making a move, instead of recomputing the full hash, we update it incrementally:

```typescript
// 1. Remove piece from source square
hash ^= KEYS[color][piece][from]

// 2. Remove captured piece (if any)
if (captured) {
    hash ^= KEYS[opponentColor][captured][to]
}

// 3. Add piece to destination (or promoted piece)
hash ^= KEYS[color][destPiece][to]

// 4. Toggle side to move
hash ^= SIDE_KEY
```

This is **O(1)** regardless of how many pieces are on the board. Each move requires only 2-4 XOR operations.

## Implementation Details

### Piece-Color Indexing

Internally, pieces are indexed as: `pieceType * 2 + colorOffset`

- White pieces: offset 0 (indices 0, 2, 4, 6, 8, 10, 12)
- Black pieces: offset 1 (indices 1, 3, 5, 7, 9, 11, 13)

This gives 14 unique indices for all piece-color combinations.

### Random Number Generation

We use xorshift64* algorithm for generating random numbers:

```typescript
function xorshift64(state: bigint): bigint {
    state ^= state >> 12n
    state ^= state << 25n
    state ^= state >> 27n
    return state * 0x2545F4914F6CDD1Dn
}
```

The multiplier ensures good statistical properties for the generated numbers.

### Collision Probability

With 64-bit hashes, the probability of two different positions having the same hash is extremely low. For N unique positions, the collision probability is approximately:

```
P(collision) ≈ N² / 2^65
```

For 10 million positions, this is about 1 in 10 billion — negligible in practice.

## Usage

```typescript
import { computeHash, updateHashForMove } from 'bitboard/hash'

// Compute initial hash when creating game from FEN
const hash = computeHash(board, turn)

// Update hash incrementally after each move
const newHash = updateHashForMove(hash, move)
```

The `updateHashForMove` function handles all cases internally:
- Normal moves
- Captures
- Promotions (Bia → Flipped Bia)

## Performance Comparison

| Operation | Without Zobrist | With Zobrist |
|-----------|-----------------|--------------|
| Full hash | N/A | O(pieces) |
| Update hash | O(pieces) | O(1) |
| Check repetition | O(history × pieces) | O(1) |
| TT lookup | O(pieces) for key | O(1) |

For a typical midgame position with ~20 pieces and 50-move history, Zobrist hashing provides roughly 1000x speedup for repetition detection.

## References

- [Zobrist Hashing - Chess Programming Wiki](https://www.chessprogramming.org/Zobrist_Hashing)
- Zobrist, A. L. (1970). "A New Hashing Method with Application for Game Playing"
