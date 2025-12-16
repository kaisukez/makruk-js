import { importPgn, exportPgnFromHistory } from "bitboard/pgn"
import { importFen, exportFen, generateLegalMoves, move } from "bitboard/index"
import { INITIAL_FEN_BITBOARD } from "bitboard/fen"

const { describe, expect, test } = globalThis as any

const SIMPLE_MAKRUK_GAME = `[Event "Test Makruk Game"]
[Site "Online"]
[Date "2025.01.01"]
[Round "1"]
[White "Player1"]
[Black "Player2"]
[Result "*"]

1. b4 b5 2. Md2 Md7 3. Tc2 Tc7 *`

const MAKRUK_WITH_CAPTURES = `[Event "Capture Test"]
[Result "*"]

1. b4 b5 2. c4 c5 3. cxb5 *`

describe("Bitboard PGN Integration Tests", () => {
    test("importPgn creates array of states", () => {
        const states = importPgn(SIMPLE_MAKRUK_GAME)

        // Should have initial position + 6 moves = 7 states
        expect(states.length).toBe(7)

        // First state should be initial position
        expect(states[0].fen).toBe(INITIAL_FEN_BITBOARD)

        // Each state should have valid FEN
        states.forEach((state, index) => {
            expect(state.fen).toBeTruthy()
            expect(typeof state.fen).toBe('string')
        })
    })

    test("importPgn correctly applies moves to state", () => {
        const states = importPgn(SIMPLE_MAKRUK_GAME)

        // After first move (1. b3), white pawn should have moved
        expect(states[1].fen).not.toBe(INITIAL_FEN_BITBOARD)

        // Each subsequent state should be different
        for (let i = 1; i < states.length; i++) {
            expect(states[i].fen).not.toBe(states[i - 1].fen)
        }
    })

    test("importPgn with captures works correctly", () => {
        const states = importPgn(MAKRUK_WITH_CAPTURES)

        // Should successfully apply all moves including capture
        expect(states.length).toBeGreaterThan(0)

        // Each state should be valid
        states.forEach(state => {
            expect(state._bitboard).toBeDefined()
            expect(state._turn).toBeDefined()
        })
    })

    test("importPgn from non-standard starting position", () => {
        const customFen = "r2mk2r/8/bbbbbbbb/8/8/BBBBBBBB/8/R2MK2R w 1"
        const pgnWithFen = `[Event "Custom Start"]
[FEN "${customFen}"]
[Result "*"]

1. b4 b5 *`

        const states = importPgn(pgnWithFen)

        // First state should match custom FEN (move number might differ)
        const firstFen = states[0].fen
        expect(firstFen.split(' ')[0]).toBe(customFen.split(' ')[0])
    })

    test("importPgn handles empty game", () => {
        const emptyGame = `[Event "Empty"]
[Result "*"]

*`

        const states = importPgn(emptyGame)

        // Should have just the initial state
        expect(states.length).toBe(1)
        expect(states[0].fen).toBe(INITIAL_FEN_BITBOARD)
    })

    test("exportPgnFromHistory creates valid PGN structure", () => {
        const states = importPgn(SIMPLE_MAKRUK_GAME)

        const pgn = exportPgnFromHistory(states, {
            Event: "Test Export",
            White: "Alice",
            Black: "Bob",
            Result: "*"
        })

        // Should contain required tags
        expect(pgn).toContain('[Event "Test Export"]')
        expect(pgn).toContain('[White "Alice"]')
        expect(pgn).toContain('[Black "Bob"]')
        expect(pgn).toContain('[Result "*"]')

        // Should end with asterisk
        expect(pgn.trim()).toMatch(/\*\s*$/)
    })

    test("exportPgnFromHistory with default tags", () => {
        const initialState = importFen(INITIAL_FEN_BITBOARD)

        const pgn = exportPgnFromHistory([initialState])

        // Should have default tags
        expect(pgn).toContain('[Event "?"]')
        expect(pgn).toContain('[White "?"]')
        expect(pgn).toContain('[Black "?"]')
        expect(pgn).toContain('[Date "')
    })

    test.skip("round-trip: importPgn then exportPgnFromHistory", () => {
        // TODO: exportPgnFromHistory needs to be fully implemented
        // Currently it doesn't extract moves from state history
        const originalPgn = `[Event "Round Trip Test"]
[White "Player 1"]
[Black "Player 2"]
[Result "*"]

1. b4 b5 2. Md2 Md7 *`

        const states = importPgn(originalPgn)
        const exported = exportPgnFromHistory(states, {
            Event: "Round Trip Test",
            White: "Player 1",
            Black: "Player 2",
            Result: "*"
        })

        // Re-import to verify it works
        const reimported = importPgn(exported)

        // Should have same number of states
        expect(reimported.length).toBe(states.length)
    })

    test("importPgn validates moves are legal", () => {
        // This PGN has an illegal move after valid moves
        const invalidPgn = `[Event "Invalid"]
[Result "*"]

1. b4 b5 2. InvalidMove *`

        const states = importPgn(invalidPgn)

        // Should stop after the legal moves (1. b4 b5)
        // So we get: initial + b4 + b5 = 3 states
        expect(states.length).toBe(3)
    })

    test("states from importPgn are valid game states", () => {
        const states = importPgn(SIMPLE_MAKRUK_GAME)

        states.forEach(state => {
            // Should be able to generate moves from each state
            const moves = generateLegalMoves(state)
            expect(Array.isArray(moves)).toBe(true)

            // Should be able to export to FEN
            const fen = exportFen(state)
            expect(typeof fen).toBe('string')
            expect(fen.length).toBeGreaterThan(0)
        })
    })

    test("importPgn with comments (comments should be parsed)", () => {
        const pgnWithComments = `[Event "Commented Game"]
[Result "*"]

1. b4 { Opening move } b5 { Response } *`

        // Comments are parsed by the parser but not stored in State
        // This just verifies the import doesn't crash
        const states = importPgn(pgnWithComments)
        expect(states.length).toBe(3) // initial + 2 moves
    })

    test("importPgn with variations (should skip variations)", () => {
        const pgnWithVariations = `[Event "With Variations"]
[Result "*"]

1. b4 b5 ( 1... c5 2. c4 ) 2. c4 c5 *`

        // Variations are not applied to the main line
        const states = importPgn(pgnWithVariations)

        // Should follow main line only: 1. b4 b5 2. c4 c5
        expect(states.length).toBe(5) // initial + 4 moves
    })

    test("move function works with SAN strings", () => {
        let state = importFen(INITIAL_FEN_BITBOARD)

        // Test pawn move
        state = move(state, 'b4')
        expect(state.fen).not.toBe(INITIAL_FEN_BITBOARD)

        // Test knight move (Makruk uses M for knight/Ma)
        state = move(state, 'b5')
        state = move(state, 'Md2')

        // Should be able to generate more moves
        const moves = generateLegalMoves(state)
        expect(moves.length).toBeGreaterThan(0)
    })

    test("generated moves have SAN notation", () => {
        const state = importFen(INITIAL_FEN_BITBOARD)
        const moves = generateLegalMoves(state)

        // All moves should have SAN
        moves.forEach(move => {
            expect(move.san).toBeTruthy()
            expect(typeof move.san).toBe('string')
            expect(move.san.length).toBeGreaterThan(0)
        })
    })
})
