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

function bench(name, fn, iterations = 100) {
    const r = measure(fn, iterations)
    console.log(`${name}`)
    console.log(`  ${r.avg.toFixed(3)} ms  (${r.ops.toFixed(0)} ops/s)`)
    console.log()
    return r
}

module.exports = { measure, bench }
