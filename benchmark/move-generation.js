/**
 * Move generation performance benchmarks
 * Compares 0x88 vs Bitboard implementations
 */

const { benchmark, compare } = require('./utils')
const { importFen: importFen0x88, generateLegalMoves: generateMoves0x88 } = require('../dist/0x88.js')
const { importFen: importFenBitboard, generateLegalMoves: generateMovesBitboard } = require('../dist/bitboard.js')

const ITERATIONS = 100

// Test positions (reduced for faster benchmarks)
const positions = {
    initial: "rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1",
    middlegame: "4k3/4r3/2b2b2/8/8/2B2B2/4R3/4K3 w 1",
    endgame: "4k3/8/8/8/8/8/8/4K2r w 1",
}

function runMoveGenerationBenchmarks() {
    console.log('\n' + '='.repeat(60))
    console.log('MOVE GENERATION BENCHMARKS')
    console.log('='.repeat(60))

    for (const [posName, fen] of Object.entries(positions)) {
        console.log(`\n\n--- Position: ${posName} ---`)
        console.log(`FEN: ${fen}`)

        // 0x88 benchmark
        const state0x88 = importFen0x88(fen)
        const stats0x88 = benchmark(
            `0x88 - ${posName}`,
            () => generateMoves0x88(state0x88),
            ITERATIONS
        )

        // Bitboard benchmark
        const stateBitboard = importFenBitboard(fen)
        const statsBitboard = benchmark(
            `Bitboard - ${posName}`,
            () => generateMovesBitboard(stateBitboard),
            ITERATIONS
        )

        // Compare
        compare(stats0x88, statsBitboard)

        // Verify correctness
        const moves0x88 = generateMoves0x88(state0x88)
        const movesBitboard = generateMovesBitboard(stateBitboard)
        console.log(`\nMove count verification:`)
        console.log(`  0x88:     ${moves0x88.length} moves`)
        console.log(`  Bitboard: ${movesBitboard.length} moves`)
        if (moves0x88.length === movesBitboard.length) {
            console.log(`  ✓ Move counts match`)
        } else {
            console.log(`  ✗ Move counts differ!`)
        }
    }
}

module.exports = { runMoveGenerationBenchmarks }

// Run if called directly
if (require.main === module) {
    runMoveGenerationBenchmarks()
}
