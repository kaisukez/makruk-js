/**
 * FEN import/export benchmarks
 */

const { compare } = require('./utils')
const ox88 = require('../dist/0x88.js')
const bitboard = require('../dist/bitboard.js')

const FENS = {
    initial: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1',
    middlegame: '4k3/4r3/2b2b2/8/8/2B2B2/4R3/4K3 w 1',
    endgame: '4k3/8/8/8/8/8/8/4K2r w 1',
}

function run() {
    console.log('=== FEN IMPORT ===\n')
    for (const [name, fen] of Object.entries(FENS)) {
        compare(
            `Import ${name}`,
            () => ox88.createGameFromFen(fen),
            () => bitboard.createGameFromFen(fen)
        )
    }

    console.log('=== FEN EXPORT ===\n')
    for (const [name, fen] of Object.entries(FENS)) {
        const s1 = ox88.createGameFromFen(fen)
        const s2 = bitboard.createGameFromFen(fen)
        compare(
            `Export ${name}`,
            () => ox88.exportFen(s1),
            () => bitboard.exportFen(s2)
        )
    }
}

module.exports = { run }
if (require.main === module) run()
