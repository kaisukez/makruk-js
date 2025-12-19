/**
 * AI search benchmarks
 */

const { compare } = require('./utils')
const ox88 = require('../dist/0x88.js')
const bitboard = require('../dist/bitboard.js')

const FENS = {
    endgame: '4k3/8/8/8/8/8/8/4K2r w 1',
    middlegame: '4k3/4r3/2b2b2/8/8/2B2B2/4R3/4K3 w 1',
}

function run() {
    console.log('=== AI SEARCH ===\n')

    for (const depth of [1, 2]) {
        console.log(`--- Depth ${depth} ---\n`)

        for (const [name, fen] of Object.entries(FENS)) {
            const s1 = ox88.importFen(fen)
            const s2 = bitboard.importFen(fen)
            const iterations = depth === 1 ? 20 : 5

            compare(
                `Search ${name}`,
                () => ox88.findBestMove(s1, depth),
                () => bitboard.findBestMove(s2, depth),
                iterations
            )
        }
    }
}

module.exports = { run }
if (require.main === module) run()
