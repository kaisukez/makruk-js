/**
 * FEN import/export performance benchmarks
 * Compares 0x88 vs Bitboard implementations
 */

const { benchmark, compare } = require('./utils')
const { importFen: importFen0x88, exportFen: exportFen0x88 } = require('../dist/0x88.js')
const { importFen: importFenBitboard, exportFen: exportFenBitboard } = require('../dist/bitboard.js')

const ITERATIONS = 100

// Test FEN strings (reduced for faster benchmarks)
const fens = {
    initial: "rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1",
    middlegame: "4k3/4r3/2b2b2/8/8/2B2B2/4R3/4K3 w 1",
    endgame: "4k3/8/8/8/8/8/8/4K2r w 1",
}

function runFENBenchmarks() {
    console.log('\n' + '='.repeat(60))
    console.log('FEN IMPORT/EXPORT BENCHMARKS')
    console.log('='.repeat(60))

    console.log('\n\n--- FEN IMPORT ---\n')

    for (const [name, fen] of Object.entries(fens)) {
        console.log(`\nPosition: ${name}`)
        console.log(`FEN: ${fen}`)

        // 0x88 import
        const stats0x88Import = benchmark(
            `0x88 Import - ${name}`,
            () => importFen0x88(fen),
            ITERATIONS
        )

        // Bitboard import
        const statsBitboardImport = benchmark(
            `Bitboard Import - ${name}`,
            () => importFenBitboard(fen),
            ITERATIONS
        )

        compare(stats0x88Import, statsBitboardImport)
    }

    console.log('\n\n--- FEN EXPORT ---\n')

    for (const [name, fen] of Object.entries(fens)) {
        console.log(`\nPosition: ${name}`)

        // Prepare states
        const state0x88 = importFen0x88(fen)
        const stateBitboard = importFenBitboard(fen)

        // 0x88 export
        const stats0x88Export = benchmark(
            `0x88 Export - ${name}`,
            () => exportFen0x88(state0x88),
            ITERATIONS
        )

        // Bitboard export
        const statsBitboardExport = benchmark(
            `Bitboard Export - ${name}`,
            () => exportFenBitboard(stateBitboard),
            ITERATIONS
        )

        compare(stats0x88Export, statsBitboardExport)

        // Verify correctness
        const exported0x88 = exportFen0x88(state0x88)
        const exportedBitboard = exportFenBitboard(stateBitboard)
        console.log(`\nExport verification:`)
        console.log(`  Original:  ${fen}`)
        console.log(`  0x88:      ${exported0x88}`)
        console.log(`  Bitboard:  ${exportedBitboard}`)
        if (exported0x88 === fen && exportedBitboard === fen) {
            console.log(`  ✓ Both match original`)
        } else if (exported0x88 === exportedBitboard) {
            console.log(`  ✓ Both implementations match each other`)
        } else {
            console.log(`  ✗ Exports differ!`)
        }
    }
}

module.exports = { runFENBenchmarks }

// Run if called directly
if (require.main === module) {
    runFENBenchmarks()
}
