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
| Endgame | 1 | 4.8 ms | 0.05 ms | Bitboard 96x faster |
| Middlegame | 1 | 19.4 ms | 0.24 ms | Bitboard 82x faster |
| Endgame | 2 | 55.6 ms | 0.009 ms | Bitboard 5866x faster |
| Middlegame | 2 | 69.9 ms | 0.19 ms | Bitboard 374x faster |

## Files

- `utils.js` - Benchmark helper functions
- `fen-operations.js` - FEN import/export
- `move-generation.js` - Legal move generation
- `ai-search.js` - Minimax search at depth 1-2
