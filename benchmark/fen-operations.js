/**
 * FEN import/export benchmarks
 */

const { bench } = require('./utils')
const bitboard = require('../dist/bitboard.js')

const FENS = {
    initial:    'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1',
    middlegame: '4k3/4r3/2b2b2/8/8/2B2B2/4R3/4K3 w 1',
    endgame:    '4k3/8/8/8/8/8/8/4K2r w 1',
}

function run() {
    console.log('=== FEN IMPORT ===\n')
    for (const [name, fen] of Object.entries(FENS)) {
        bench(`Import ${name}`, () => bitboard.createGameFromFen(fen))
    }

    console.log('=== FEN EXPORT ===\n')
    for (const [name, fen] of Object.entries(FENS)) {
        const game = bitboard.createGameFromFen(fen)
        bench(`Export ${name}`, () => bitboard.exportFen(game))
    }
}

module.exports = { run }
if (require.main === module) run()
