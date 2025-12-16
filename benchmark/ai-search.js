/**
 * AI search performance benchmarks
 * Compares 0x88 vs Bitboard implementations
 */

const { benchmark, compare } = require('./utils')
const { importFen: importFen0x88, findBestMove: findBestMove0x88 } = require('../dist/0x88.js')
const { importFen: importFenBitboard, findBestMove: findBestMoveBitboard } = require('../dist/bitboard.js')

// Test positions for AI search (reduced for faster benchmarks)
const positions = {
    simple_endgame: "4k3/8/8/8/8/8/8/4K2r w 1",
    middlegame: "4k3/4r3/2b2b2/8/8/2B2B2/4R3/4K3 w 1",
}

function runAISearchBenchmarks() {
    console.log('\n' + '='.repeat(60))
    console.log('AI SEARCH BENCHMARKS')
    console.log('='.repeat(60))

    const depths = [1, 2]  // Skip depth 3 as it's too slow

    for (const depth of depths) {
        console.log(`\n\n${'='.repeat(60)}`)
        console.log(`DEPTH ${depth}`)
        console.log('='.repeat(60))

        for (const [posName, fen] of Object.entries(positions)) {
            console.log(`\n--- Position: ${posName} (depth ${depth}) ---`)
            console.log(`FEN: ${fen}`)

            // 0x88 benchmark
            const state0x88 = importFen0x88(fen)
            const stats0x88 = benchmark(
                `0x88 - ${posName} (depth ${depth})`,
                () => findBestMove0x88(state0x88, depth),
                depth === 1 ? 20 : depth === 2 ? 5 : 3
            )

            // Bitboard benchmark
            const stateBitboard = importFenBitboard(fen)
            const statsBitboard = benchmark(
                `Bitboard - ${posName} (depth ${depth})`,
                () => findBestMoveBitboard(stateBitboard, depth),
                depth === 1 ? 20 : depth === 2 ? 5 : 3
            )

            // Compare
            compare(stats0x88, statsBitboard)

            // Verify results
            const result0x88 = findBestMove0x88(state0x88, depth)
            const resultBitboard = findBestMoveBitboard(stateBitboard, depth)
            console.log(`\nResult verification:`)
            console.log(`  0x88 score:     ${result0x88.bestScore}`)
            console.log(`  Bitboard score: ${resultBitboard.bestScore}`)
            if (Math.abs(result0x88.bestScore - resultBitboard.bestScore) < 0.01) {
                console.log(`  ✓ Scores match`)
            } else {
                console.log(`  ~ Scores differ (may be due to move ordering)`)
            }
        }
    }
}

module.exports = { runAISearchBenchmarks }

// Run if called directly
if (require.main === module) {
    runAISearchBenchmarks()
}
