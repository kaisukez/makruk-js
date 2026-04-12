# Benchmarks

Bitboard implementation performance.

## Usage

```bash
pnpm benchmark          # Run all (fen + moves + ai)
pnpm benchmark:fen      # FEN only
pnpm benchmark:moves    # Move generation only
pnpm benchmark:ai       # AI search only
pnpm benchmark:parallel # Parallel search (separate, async)
```

## Results

Tested on Apple M4 Pro, Node v24.11.1.

### FEN Operations

| Operation | Time | Throughput |
|-----------|------|------------|
| Import initial | 0.016 ms | 64,000 ops/s |
| Import middlegame | 0.007 ms | 147,000 ops/s |
| Import endgame | 0.004 ms | 275,000 ops/s |
| Export initial | 0.016 ms | 63,000 ops/s |
| Export middlegame | 0.005 ms | 221,000 ops/s |
| Export endgame | 0.002 ms | 460,000 ops/s |

### Move Generation

| Position | Moves | Time | Throughput |
|----------|-------|------|------------|
| Initial | 23 | 0.020 ms | 50,000 ops/s |
| Middlegame | 11 | 0.016 ms | 62,000 ops/s |
| Endgame | 3 | 0.005 ms | 210,000 ops/s |

### AI Search

| Position | Depth 1 | Depth 3 | Depth 5 |
|----------|---------|---------|---------|
| Endgame | 0.073 ms | 1.9 ms | 27 ms |
| Middlegame | 0.216 ms | 0.9 ms | 5.2 ms |
| Opening | 0.414 ms | 17 ms | 683 ms |

Throughput: ~138,000–205,000 nodes/sec.

## Files

- `utils.js` - Benchmark helper (`measure`, `bench`)
- `fen-operations.js` - FEN import/export
- `move-generation.js` - Legal move generation
- `ai-search.js` - Minimax search at depths 1, 3, 5
- `parallel-search.js` - Single-thread vs parallel (Worker Threads)
