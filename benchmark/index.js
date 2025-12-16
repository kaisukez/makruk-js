#!/usr/bin/env node
/**
 * Main benchmark runner
 * Runs all performance benchmarks comparing 0x88 vs Bitboard implementations
 */

const { runMoveGenerationBenchmarks } = require('./move-generation')
const { runAISearchBenchmarks } = require('./ai-search')
const { runFENBenchmarks } = require('./fen-operations')

function printHeader() {
    console.log('\n' + '='.repeat(60))
    console.log('MAKRUK-JS PERFORMANCE BENCHMARKS')
    console.log('Comparing 0x88 vs Bitboard Implementations')
    console.log('='.repeat(60))
    console.log(`Node version: ${process.version}`)
    console.log(`Platform: ${process.platform} ${process.arch}`)
    console.log(`Date: ${new Date().toISOString()}`)
    console.log('='.repeat(60))
}

function printSummary() {
    console.log('\n\n' + '='.repeat(60))
    console.log('BENCHMARK SUMMARY')
    console.log('='.repeat(60))
    console.log(`
Key Findings:
- Move Generation: Compare move generation speed across different positions
- AI Search: Compare minimax search performance at various depths
- FEN Operations: Compare FEN import/export speed

Performance Characteristics:
- 0x88: Array-based representation with O(1) board access
- Bitboard: Bitwise operations with potential for SIMD optimization
- Both implementations should have similar algorithmic complexity
- Differences indicate implementation efficiency

Notes:
- Lower times (ms) are better
- Speedup > 1.0x means the second implementation is faster
- Results may vary based on hardware and Node.js version
    `)
    console.log('='.repeat(60))
}

async function runAllBenchmarks() {
    printHeader()

    const args = process.argv.slice(2)
    const selectedBenchmark = args[0]

    if (!selectedBenchmark || selectedBenchmark === 'all') {
        console.log('\nRunning all benchmarks...\n')
        runFENBenchmarks()
        runMoveGenerationBenchmarks()
        runAISearchBenchmarks()
        printSummary()
    } else if (selectedBenchmark === 'fen') {
        console.log('\nRunning FEN benchmarks only...\n')
        runFENBenchmarks()
    } else if (selectedBenchmark === 'moves') {
        console.log('\nRunning move generation benchmarks only...\n')
        runMoveGenerationBenchmarks()
    } else if (selectedBenchmark === 'ai') {
        console.log('\nRunning AI search benchmarks only...\n')
        runAISearchBenchmarks()
    } else {
        console.error(`\nUnknown benchmark: ${selectedBenchmark}`)
        console.log(`\nUsage: node benchmark/index.js [all|fen|moves|ai]`)
        console.log(`  all   - Run all benchmarks (default)`)
        console.log(`  fen   - Run only FEN import/export benchmarks`)
        console.log(`  moves - Run only move generation benchmarks`)
        console.log(`  ai    - Run only AI search benchmarks`)
        process.exit(1)
    }
}

// Run benchmarks
runAllBenchmarks().catch(error => {
    console.error('Benchmark error:', error)
    process.exit(1)
})
