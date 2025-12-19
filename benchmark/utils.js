/**
 * Simple benchmark utility
 */

function measure(fn, iterations = 100) {
    // Warmup
    for (let i = 0; i < 10; i++) fn()

    // Measure
    const start = process.hrtime.bigint()
    for (let i = 0; i < iterations; i++) fn()
    const elapsed = Number(process.hrtime.bigint() - start) / 1e6 // ms

    return {
        total: elapsed,
        avg: elapsed / iterations,
        ops: (iterations / elapsed) * 1000
    }
}

function compare(name, fn1, fn2, iterations = 100) {
    const r1 = measure(fn1, iterations)
    const r2 = measure(fn2, iterations)
    const ratio = r1.avg / r2.avg

    console.log(`${name}`)
    console.log(`  0x88:     ${r1.avg.toFixed(3)} ms  (${r1.ops.toFixed(0)} ops/s)`)
    console.log(`  Bitboard: ${r2.avg.toFixed(3)} ms  (${r2.ops.toFixed(0)} ops/s)`)
    console.log(`  ${ratio > 1 ? `Bitboard ${ratio.toFixed(1)}x faster` : ratio < 1 ? `0x88 ${(1/ratio).toFixed(1)}x faster` : 'Equal'}`)
    console.log()

    return { r1, r2, ratio }
}

module.exports = { measure, compare }
