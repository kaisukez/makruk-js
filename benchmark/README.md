# Performance Benchmarks

This directory contains performance benchmarks comparing the **0x88** and **Bitboard** implementations of Makruk-JS.

## Running Benchmarks

### Run All Benchmarks
```bash
npm run benchmark
# or
node benchmark/index.js
```
**Est. total time**: ~5-8 seconds

### Run Specific Benchmarks
```bash
# FEN Import/Export only
npm run benchmark:fen
node benchmark/index.js fen

# Move Generation only
npm run benchmark:moves
node benchmark/index.js moves

# AI Search only
npm run benchmark:ai
node benchmark/index.js ai
```

## Benchmark Categories

### 1. FEN Operations (`fen-operations.js`)
Tests the performance of importing and exporting FEN strings:
- **Import**: Parse FEN string to internal state
- **Export**: Convert internal state to FEN string
- **100 iterations** per position (3 positions)
- **Est. time**: ~1 second

### 2. Move Generation (`move-generation.js`)
Tests the performance of generating all legal moves:
- Initial position (most pieces)
- Middlegame (moderate pieces)
- Endgame (few pieces)
- **100 iterations** per position (3 positions)
- **Est. time**: ~1-2 seconds

### 3. AI Search (`ai-search.js`)
Tests the performance of minimax search:
- Search depths: 1 and 2 (depth 3 skipped for speed)
- Different position types (2 positions)
- Includes alpha-beta pruning
- Tests move ordering efficiency
- **Iterations**: 20 (depth 1), 5 (depth 2)
- **Est. time**: ~2-4 seconds

## Metrics

For each benchmark, the following metrics are reported:

- **Mean**: Average execution time
- **Median**: Middle value (50th percentile)
- **Min**: Fastest execution time
- **Max**: Slowest execution time
- **P95**: 95th percentile (95% of executions are faster)
- **P99**: 99th percentile (99% of executions are faster)

## Implementation Comparison

### 0x88 Implementation
- Array-based board representation
- O(1) square access
- Simple and straightforward
- More memory overhead

### Bitboard Implementation
- Bitwise operations
- Parallel piece operations
- Potential for SIMD optimization
- More complex implementation

## Expected Results

The relative performance depends on the operation:

- **FEN Import**: Both should be similar (string parsing overhead)
- **FEN Export**: Bitboard may be slightly slower (need to iterate bits)
- **Move Generation**: Bitboard may be faster for sliding pieces
- **AI Search**: Performance depends on move ordering and evaluation

## Notes

- Benchmarks run against the **built** code in `dist/`
- Run `npm run build` before benchmarking
- Results vary based on hardware and Node.js version
- Includes warmup iterations to avoid JIT compilation effects
- Move count verification ensures correctness
