# 0x88 AI

Basic AI engine for Makruk using 0x88 board representation.

> **Note**: This is a simpler implementation for reference. For production use, prefer the [bitboard AI](../../bitboard/ai/README.md). See [benchmark/README.md](../../../benchmark/README.md) for performance comparisons.

## Architecture

```
evaluation.ts  - Position scoring
search.ts      - Alpha-beta minimax
```

## Search Algorithm

### Alpha-Beta Minimax

Standard minimax with alpha-beta pruning:

```
minimax(state, depth, alpha, beta):
    if draw: return 0
    if checkmate: return ±Infinity
    if depth == 0: return evaluate(state)

    if white (maximizing):
        for each move:
            score = minimax(child, depth-1, alpha, beta)
            max = max(max, score)
            alpha = max(alpha, max)
            if beta <= alpha: break  // Beta cutoff
        return max

    else (minimizing):
        for each move:
            score = minimax(child, depth-1, alpha, beta)
            min = min(min, score)
            beta = min(beta, min)
            if beta <= alpha: break  // Alpha cutoff
        return min
```

### Limitations

Unlike the bitboard AI, this implementation lacks:
- **Transposition table** - Recalculates duplicate positions
- **Move ordering** - No MVV-LVA, searches in generation order
- **Quiescence search** - Stops at fixed depth (horizon effect)
- **Iterative deepening** - Fixed depth only

These missing features explain the significant performance gap (see [benchmarks](../../../benchmark/README.md)).

## Evaluation

### Components

1. **Material**: Sum of piece values
2. **Center Control**: Position bonus from center score table
3. **Mobility**: +0.02 per legal move

```
score = Σ(material + center_score + 0.02 × moves)
```

White pieces add to score, black pieces subtract.

### Center Score Table

```
S1=0.00  S2=0.16  S3=0.32  S4=0.48

S1 S1 S1 S1 S1 S1 S1 S1   (rank 8)
S1 S2 S2 S2 S2 S2 S2 S1
S1 S2 S3 S3 S3 S3 S2 S1
S1 S2 S3 S4 S4 S3 S2 S1   (center)
S1 S2 S3 S4 S4 S3 S2 S1   (center)
S1 S2 S3 S3 S3 S3 S2 S1
S1 S2 S2 S2 S2 S2 S2 S1
S1 S1 S1 S1 S1 S1 S1 S1   (rank 1)
```

### Material Values

```
Bia (Pawn)     = 1.0
Flipped Bia    = 1.7
Met (Queen)    = 1.7
Thon (Bishop)  = 2.6
Ma (Knight)    = 3.0
Rua (Rook)     = 5.0
```

## API

```typescript
// Find best move
findBestMove(state, depth): { bestScore, bestMove }

// Low-level minimax
minimax(state, depth, alpha, beta): { bestScore, bestMove }

// Position evaluation
evaluate(state): number
```

## Example

```typescript
import { findBestMove } from '0x88/ai'
import { createInitialState } from '0x88/fen/importer'

const state = createInitialState()
const { bestMove, bestScore } = findBestMove(state, 3)
```

## Why Use This?

- **Simplicity**: Easier to understand and modify
- **Educational**: Clear implementation of classic algorithms
- **Debugging**: Slower but easier to trace

For actual gameplay, use the bitboard AI instead.
