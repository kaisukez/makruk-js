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

## API

```typescript
// Find best move at fixed depth
findBestMove(state, turn, depth, options?)

// Iterative deepening with time limit
iterativeDeepening(state, turn, maxDepth, timeLimitMs?)

// Low-level minimax (for testing)
minimax(state, turn, depth, alpha, beta, useTranspositionTable?)

// Evaluation functions
evaluateFast(state)        // Material + PST (fast)
evaluate(state, turn)      // With checkmate detection
evaluateWithMobility(...)  // Adds move count bonus
```
