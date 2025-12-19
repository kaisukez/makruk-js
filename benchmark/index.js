#!/usr/bin/env node
/**
 * Benchmark runner - compares 0x88 vs Bitboard implementations
 */

const fen = require('./fen-operations')
const moves = require('./move-generation')
const ai = require('./ai-search')

const benchmarks = { fen, moves, ai }

function printHeader() {
    console.log('\n' + '='.repeat(50))
    console.log('MAKRUK-JS BENCHMARKS: 0x88 vs Bitboard')
    console.log('='.repeat(50))
    console.log(`Node ${process.version} | ${process.platform} ${process.arch}`)
    console.log('='.repeat(50) + '\n')
}

const arg = process.argv[2]

printHeader()

if (!arg || arg === 'all') {
    fen.run()
    moves.run()
    ai.run()
} else if (benchmarks[arg]) {
    benchmarks[arg].run()
} else {
    console.log(`Usage: node benchmark/index.js [all|fen|moves|ai]`)
    process.exit(1)
}
