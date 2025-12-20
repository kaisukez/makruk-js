# Makruk Web

A showcase web app for the makruk-js library.

## Features

- **Play vs Bot** - Adjustable AI difficulty (depth 1-7)

## Development

```bash
# From root directory
pnpm web:dev     # Start dev server
pnpm web:build   # Build for production
pnpm web:preview # Preview production build

# Or from web directory
cd web
pnpm dev
pnpm build
pnpm preview
```

## Bot Implementation

The AI uses parallel search with Web Workers for better performance.

### Architecture

```
Main Thread                    Workers (1 per CPU core - 1)
───────────                    ─────────────────────────────
1. Generate legal moves
2. Distribute moves            → Worker 1: search moves [0-5]
                               → Worker 2: search moves [6-10]
                               → Worker 3: search moves [11-15]
3. Wait for results            ← All workers return best move + score
4. Combine results
5. Return best move
```

### Shared Bounds (Optional Optimization)

When `SharedArrayBuffer` is available (requires COOP/COEP headers), workers share alpha-beta bounds. When one worker finds a good move, others can prune more aggressively, reducing overall search time.

Each worker maintains its own local transposition table to cache positions it evaluates.

### Fallback Mode

Without `SharedArrayBuffer`, workers operate independently without shared bounds. Each worker still uses its own transposition table for caching.

## Tech Stack

- React + TypeScript
- Vite
- TailwindCSS
- WebRTC (native browser API)
