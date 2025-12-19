# Benchmarks

Compares 0x88 vs Bitboard implementations.

## Usage

```bash
pnpm benchmark        # Run all
pnpm benchmark:fen    # FEN only
pnpm benchmark:moves  # Move generation only
pnpm benchmark:ai     # AI search only
```

## Results

Tested on Apple M1, Node v24.

### FEN Operations

| Operation | 0x88 | Bitboard | Winner |
|-----------|------|----------|--------|
| Import initial | 0.012 ms | 0.024 ms | 0x88 2x faster |
| Import middlegame | 0.006 ms | 0.007 ms | ~Equal |
| Import endgame | 0.005 ms | 0.002 ms | Bitboard 2x faster |
| Export initial | 0.004 ms | 0.00005 ms | Bitboard 80x faster |
| Export middlegame | 0.003 ms | 0.00004 ms | Bitboard 64x faster |
| Export endgame | 0.001 ms | 0.00004 ms | Bitboard 33x faster |

### Move Generation

| Position | 0x88 | Bitboard | Winner |
|----------|------|----------|--------|
| Initial | 0.73 ms | 0.34 ms | Bitboard 2x faster |
| Middlegame | 0.40 ms | 0.18 ms | Bitboard 2x faster |
| Endgame | 0.10 ms | 0.02 ms | Bitboard 6x faster |

### AI Search

| Position | Depth | 0x88 | Bitboard | Winner |
|----------|-------|------|----------|--------|
| Endgame | 1 | 5 ms | 0.012 ms | Bitboard 400x faster |
| Middlegame | 1 | 19 ms | 0.026 ms | Bitboard 750x faster |
| Endgame | 3 | 151 ms | 0.007 ms | Bitboard 22000x faster |
| Middlegame | 3 | 503 ms | 0.038 ms | Bitboard 13000x faster |
| Endgame | 5 | 1.8 s | 0.006 ms | Bitboard 300000x faster |
| Middlegame | 5 | 9.4 s | 0.029 ms | Bitboard 320000x faster |

The deeper the search, the more the transposition table and move ordering optimizations pay off - up to 320,000x speedup at depth 5.

## Files

- `utils.js` - Benchmark helper functions
- `fen-operations.js` - FEN import/export
- `move-generation.js` - Legal move generation
- `ai-search.js` - Minimax search at depths 1, 3, 5
