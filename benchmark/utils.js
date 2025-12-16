/**
 * Benchmark utilities for performance testing
 */

/**
 * Run a benchmark function multiple times and return statistics
 * @param {string} name - Name of the benchmark
 * @param {Function} fn - Function to benchmark
 * @param {number} iterations - Number of iterations
 * @returns {Object} Statistics about the benchmark
 */
function benchmark(name, fn, iterations = 1000) {
    const times = []
    const warmupCount = Math.min(100, Math.ceil(iterations / 10))

    // Warmup
    process.stdout.write(`  Warming up (${warmupCount} iterations)...`)
    for (let i = 0; i < warmupCount; i++) {
        fn()
    }
    process.stdout.write(' done\n')

    // Actual benchmark
    process.stdout.write(`  Running benchmark (${iterations} iterations)...`)
    const startTime = Date.now()
    for (let i = 0; i < iterations; i++) {
        const start = process.hrtime.bigint()
        fn()
        const end = process.hrtime.bigint()
        times.push(Number(end - start) / 1000000) // Convert to milliseconds
    }
    const totalTime = Date.now() - startTime
    process.stdout.write(` done (${totalTime}ms)\n`)

    // Calculate statistics
    times.sort((a, b) => a - b)
    const sum = times.reduce((a, b) => a + b, 0)
    const mean = sum / times.length
    const median = times[Math.floor(times.length / 2)]
    const min = times[0]
    const max = times[times.length - 1]
    const p95 = times[Math.floor(times.length * 0.95)]
    const p99 = times[Math.floor(times.length * 0.99)]

    return {
        name,
        iterations,
        mean,
        median,
        min,
        max,
        p95,
        p99,
        total: sum
    }
}

/**
 * Format benchmark results
 * @param {Object} stats - Benchmark statistics
 * @returns {string} Formatted output
 */
function formatResults(stats) {
    return `
${stats.name}
  Iterations: ${stats.iterations}
  Mean:       ${stats.mean.toFixed(4)} ms
  Median:     ${stats.median.toFixed(4)} ms
  Min:        ${stats.min.toFixed(4)} ms
  Max:        ${stats.max.toFixed(4)} ms
  P95:        ${stats.p95.toFixed(4)} ms
  P99:        ${stats.p99.toFixed(4)} ms
  Total:      ${stats.total.toFixed(2)} ms
`
}

/**
 * Compare two benchmark results
 * @param {Object} baseline - Baseline benchmark stats
 * @param {Object} comparison - Comparison benchmark stats
 */
function compare(baseline, comparison) {
    const speedup = baseline.mean / comparison.mean
    const pctChange = ((comparison.mean - baseline.mean) / baseline.mean * 100)

    console.log(`\n${'='.repeat(60)}`)
    console.log(`Comparison: ${baseline.name} vs ${comparison.name}`)
    console.log('='.repeat(60))

    console.log(formatResults(baseline))
    console.log(formatResults(comparison))

    console.log('Summary:')
    if (speedup > 1) {
        console.log(`  ${comparison.name} is ${speedup.toFixed(2)}x FASTER`)
        console.log(`  ${Math.abs(pctChange).toFixed(2)}% improvement`)
    } else if (speedup < 1) {
        console.log(`  ${comparison.name} is ${(1/speedup).toFixed(2)}x SLOWER`)
        console.log(`  ${Math.abs(pctChange).toFixed(2)}% regression`)
    } else {
        console.log(`  Performance is roughly equal`)
    }
    console.log('='.repeat(60))
}

module.exports = {
    benchmark,
    formatResults,
    compare
}
