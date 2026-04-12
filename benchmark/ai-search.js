/**
 * AI search benchmarks
 */

const { bench } = require('./utils')
const bitboard = require('../dist/bitboard.js')

const FENS = {
    endgame:    '4k3/8/8/8/8/8/8/4K2r w 1',
    middlegame: '4k3/4r3/2b2b2/8/8/2B2B2/4R3/4K3 w 1',
    opening:    'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1',
}

function run() {
    console.log('=== AI SEARCH ===\n')

    for (const depth of [1, 3, 5]) {
        console.log(`--- Depth ${depth} ---\n`)
        const iterations = depth === 1 ? 20 : depth === 3 ? 5 : 2

        for (const [name, fen] of Object.entries(FENS)) {
            const game = bitboard.createGameFromFen(fen)
            // Fresh TT per run to get consistent measurements
            const result = bench(
                `Search ${name}`,
                () => bitboard.findBestMove(game, depth),
                iterations
            )
        }
    }
}

module.exports = { run }
if (require.main === module) run()
