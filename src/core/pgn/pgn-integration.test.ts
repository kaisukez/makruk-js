import { parsePgn } from "./parser"
import { exportPgn } from "./exporter"

const { describe, expect, test } = globalThis as any

const SIMPLE_GAME = `[Event "Test"]
[Site "Online"]
[Date "2025.01.01"]
[Round "1"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 1-0`

describe("PGN Integration Tests", () => {
    test("round-trip test (parse then export should match)", () => {
        const original = parsePgn(SIMPLE_GAME)
        const exported = exportPgn(original)
        const reparsed = parsePgn(exported)

        // Check tags
        expect(reparsed.tags.Event).toBe(original.tags.Event)
        expect(reparsed.tags.White).toBe(original.tags.White)
        expect(reparsed.tags.Black).toBe(original.tags.Black)

        // Check moves
        expect(reparsed.moves.length).toBe(original.moves.length)
        for (let i = 0; i < original.moves.length; i++) {
            expect(reparsed.moves[i].san).toBe(original.moves[i].san)
            expect(reparsed.moves[i].moveNumber).toBe(original.moves[i].moveNumber)
        }

        // Check result
        expect(reparsed.result).toBe(original.result)
    })

    test("round-trip with comments preserved", () => {
        const pgnWithComments = `[Event "Test"]
[Result "*"]

1. e4 { Excellent! } e5 { Solid } *`

        const original = parsePgn(pgnWithComments)
        const exported = exportPgn(original)
        const reparsed = parsePgn(exported)

        expect(reparsed.moves[0].comment).toBe("Excellent!")
        expect(reparsed.moves[1].comment).toBe("Solid")
    })

    test("round-trip with NAGs preserved", () => {
        const pgnWithNags = `[Event "Test"]
[Result "*"]

1. e4! e5? 2. Nf3!! Nc6?? *`

        const original = parsePgn(pgnWithNags)
        const exported = exportPgn(original)
        const reparsed = parsePgn(exported)

        expect(reparsed.moves[0].nags).toEqual([1])
        expect(reparsed.moves[1].nags).toEqual([2])
        expect(reparsed.moves[2].nags).toEqual([3])
        expect(reparsed.moves[3].nags).toEqual([4])
    })

    test("round-trip with variations preserved", () => {
        const pgnWithVariations = `[Event "Test"]
[Result "*"]

1. e4 e5 ( 1... c5 2. Nf3 d6 ) 2. Nf3 Nc6 *`

        const original = parsePgn(pgnWithVariations)
        const exported = exportPgn(original)
        const reparsed = parsePgn(exported)

        expect(reparsed.moves[1].variations).toBeDefined()
        expect(reparsed.moves[1].variations!.length).toBe(1)
        expect(reparsed.moves[1].variations![0][0].san).toBe("c5")
        expect(reparsed.moves[1].variations![0][1].san).toBe("Nf3")
    })

    test("round-trip with complex game", () => {
        const complexPgn = `[Event "World Championship"]
[Site "New York"]
[Date "1972.07.11"]
[Round "6"]
[White "Fischer, Robert J."]
[Black "Spassky, Boris V."]
[Result "1-0"]
[WhiteElo "2785"]
[BlackElo "2660"]

1. e4! { King's pawn opening } e5 ( 1... c5 { Sicilian Defense } 2. Nf3 )
2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O 1-0`

        const original = parsePgn(complexPgn)
        const exported = exportPgn(original)
        const reparsed = parsePgn(exported)

        // Verify all tags
        expect(reparsed.tags.Event).toBe("World Championship")
        expect(reparsed.tags.White).toBe("Fischer, Robert J.")
        expect(reparsed.tags.WhiteElo).toBe("2785")

        // Verify moves with annotations
        expect(reparsed.moves[0].nags).toEqual([1])
        expect(reparsed.moves[0].comment).toBe("King's pawn opening")

        // Verify variations
        expect(reparsed.moves[1].variations).toBeDefined()
        expect(reparsed.moves[1].variations![0][0].san).toBe("c5")

        // Verify result
        expect(reparsed.result).toBe("1-0")
    })

    test("export and re-import maintains move sequence", () => {
        const pgnLongGame = `[Event "Test"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7
6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 *`

        const game = parsePgn(pgnLongGame)
        expect(game.moves.length).toBe(20)

        const exported = exportPgn(game)
        const reparsed = parsePgn(exported)

        expect(reparsed.moves.length).toBe(20)
        expect(reparsed.moves[0].san).toBe("e4")
        expect(reparsed.moves[19].san).toBe("c5")
    })
})
