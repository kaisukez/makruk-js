import { parsePgn } from "common/pgn/parser"

const { describe, expect, test } = globalThis as any

// Sample PGN strings for testing
const SIMPLE_GAME = `[Event "Test"]
[Site "Online"]
[Date "2025.01.01"]
[Round "1"]
[White "Player1"]
[Black "Player2"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 1-0`

const GAME_WITH_COMMENTS = `[Event "Test"]
[Site "Online"]
[Date "2025.01.01"]
[Round "1"]
[White "Player1"]
[Black "Player2"]
[Result "*"]

1. e4 { King's pawn opening } e5 2. Nf3 { Developing knight } Nc6 *`

const GAME_WITH_VARIATIONS = `[Event "Test"]
[Site "Online"]
[Date "2025.01.01"]
[Round "1"]
[White "Player1"]
[Black "Player2"]
[Result "*"]

1. e4 e5 ( 1... c5 { Sicilian Defense } ) 2. Nf3 Nc6 *`

const GAME_WITH_NAGS = `[Event "Test"]
[Site "Online"]
[Date "2025.01.01"]
[Round "1"]
[White "Player1"]
[Black "Player2"]
[Result "*"]

1. e4! e5? 2. Nf3!! Nc6?? 3. Bb5!? a6?! *`

const GAME_WITH_NUMERIC_NAGS = `[Event "Test"]
[Site "Online"]
[Date "2025.01.01"]
[Round "1"]
[White "Player1"]
[Black "Player2"]
[Result "*"]

1. e4 $1 e5 $2 2. Nf3 $3 Nc6 $4 *`

describe("PGN Tag Parsing Tests", () => {
    test("parses standard seven tag roster", () => {
        const game = parsePgn(SIMPLE_GAME)

        expect(game.tags.Event).toBe("Test")
        expect(game.tags.Site).toBe("Online")
        expect(game.tags.Date).toBe("2025.01.01")
        expect(game.tags.Round).toBe("1")
        expect(game.tags.White).toBe("Player1")
        expect(game.tags.Black).toBe("Player2")
        expect(game.tags.Result).toBe("1-0")
    })

    test("parses additional custom tags", () => {
        const pgnWithCustomTags = `[Event "Test"]
[Site "Online"]
[Date "2025.01.01"]
[Round "1"]
[White "Player1"]
[Black "Player2"]
[Result "*"]
[WhiteElo "2500"]
[BlackElo "2400"]
[ECO "C00"]
[TimeControl "900+10"]

1. e4 e5 *`

        const game = parsePgn(pgnWithCustomTags)

        expect(game.tags.WhiteElo).toBe("2500")
        expect(game.tags.BlackElo).toBe("2400")
        expect(game.tags.ECO).toBe("C00")
        expect(game.tags.TimeControl).toBe("900+10")
    })

    test("parses empty tags section", () => {
        const pgnWithoutTags = `1. e4 e5 2. Nf3 *`

        const game = parsePgn(pgnWithoutTags)

        expect(Object.keys(game.tags).length).toBe(0)
        expect(game.moves.length).toBe(3)
    })

    test("parses tags with special characters in values", () => {
        const pgnWithSpecialChars = `[Event "Test: Special & Characters"]
[Site "Location, Country"]
[White "O'Connor"]
[Black "Smith-Jones"]
[Result "*"]

1. e4 *`

        const game = parsePgn(pgnWithSpecialChars)

        expect(game.tags.Event).toBe("Test: Special & Characters")
        expect(game.tags.Site).toBe("Location, Country")
        expect(game.tags.White).toBe("O'Connor")
        expect(game.tags.Black).toBe("Smith-Jones")
    })

    test("handles missing tags gracefully", () => {
        const pgnWithSomeTags = `[Event "Test"]
[White "Player1"]

1. e4 e5 *`

        const game = parsePgn(pgnWithSomeTags)

        expect(game.tags.Event).toBe("Test")
        expect(game.tags.White).toBe("Player1")
        expect(game.tags.Site).toBeUndefined()
        expect(game.tags.Date).toBeUndefined()
    })
})

describe("PGN Move Parsing Tests", () => {
    test("parses simple moves (pawn, knight, bishop, rook, queen, king)", () => {
        const pgnWithVariousMoves = `[Event "Test"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Bb4 4. Rg1 Rg8 5. Qe2 Qe7 6. Kd1 Kd8 *`

        const game = parsePgn(pgnWithVariousMoves)

        expect(game.moves[0].san).toBe("e4")      // pawn
        expect(game.moves[1].san).toBe("e5")      // pawn
        expect(game.moves[2].san).toBe("Nf3")     // knight
        expect(game.moves[3].san).toBe("Nc6")     // knight
        expect(game.moves[4].san).toBe("Bb5")     // bishop
        expect(game.moves[5].san).toBe("Bb4")     // bishop
        expect(game.moves[6].san).toBe("Rg1")     // rook
        expect(game.moves[7].san).toBe("Rg8")     // rook
        expect(game.moves[8].san).toBe("Qe2")     // queen
        expect(game.moves[9].san).toBe("Qe7")     // queen
        expect(game.moves[10].san).toBe("Kd1")    // king
        expect(game.moves[11].san).toBe("Kd8")    // king
    })

    test("parses captures (x notation)", () => {
        const pgnWithCaptures = `[Event "Test"]
[Result "*"]

1. e4 d5 2. exd5 Qxd5 3. Nc3 Qxd1+ *`

        const game = parsePgn(pgnWithCaptures)

        expect(game.moves[2].san).toBe("exd5")
        expect(game.moves[3].san).toBe("Qxd5")
        expect(game.moves[5].san).toBe("Qxd1+")
    })

    test("parses promotions (= notation)", () => {
        const pgnWithPromotions = `[Event "Test"]
[Result "*"]

1. e4 e5 2. e8=Q e1=N 3. a8=R b1=B *`

        const game = parsePgn(pgnWithPromotions)

        expect(game.moves[2].san).toBe("e8=Q")
        expect(game.moves[3].san).toBe("e1=N")
        expect(game.moves[4].san).toBe("a8=R")
        expect(game.moves[5].san).toBe("b1=B")
    })

    test("parses castling (O-O and O-O-O)", () => {
        const pgnWithCastling = `[Event "Test"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Bb4 4. O-O O-O-O *`

        const game = parsePgn(pgnWithCastling)

        expect(game.moves[6].san).toBe("O-O")
        expect(game.moves[7].san).toBe("O-O-O")
    })

    test("parses check and checkmate symbols (+, #)", () => {
        const pgnWithCheckSymbols = `[Event "Test"]
[Result "*"]

1. e4 e5 2. Qh5+ Nc6 3. Qxf7# *`

        const game = parsePgn(pgnWithCheckSymbols)

        expect(game.moves[2].san).toBe("Qh5+")
        expect(game.moves[4].san).toBe("Qxf7#")
    })
})

describe("PGN Comment Parsing Tests", () => {
    test("parses single-line comments", () => {
        const game = parsePgn(GAME_WITH_COMMENTS)

        expect(game.moves[0].comment).toBe("King's pawn opening")
        expect(game.moves[2].comment).toBe("Developing knight")
    })

    test("parses multi-line comments", () => {
        const pgnWithMultilineComment = `[Event "Test"]
[Result "*"]

1. e4 { This is a
multi-line
comment } e5 *`

        const game = parsePgn(pgnWithMultilineComment)

        expect(game.moves[0].comment).toContain("This is a")
        expect(game.moves[0].comment).toContain("multi-line")
        expect(game.moves[0].comment).toContain("comment")
    })

    test("parses nested braces in comments", () => {
        const pgnWithNestedBraces = `[Event "Test"]
[Result "*"]

1. e4 { Comment with { nested } braces } e5 *`

        const game = parsePgn(pgnWithNestedBraces)

        expect(game.moves[0].comment).toContain("nested")
        expect(game.moves[0].comment).toContain("braces")
    })

    test("skips comments when option is false", () => {
        const game = parsePgn(GAME_WITH_COMMENTS, { includeComments: false })

        expect(game.moves[0].comment).toBeUndefined()
        expect(game.moves[2].comment).toBeUndefined()
    })
})

describe("PGN NAG Parsing Tests", () => {
    test("parses numeric NAGs ($1, $2, etc.)", () => {
        const game = parsePgn(GAME_WITH_NUMERIC_NAGS)

        expect(game.moves[0].nags).toEqual([1])
        expect(game.moves[1].nags).toEqual([2])
        expect(game.moves[2].nags).toEqual([3])
        expect(game.moves[3].nags).toEqual([4])
    })

    test("parses symbolic NAGs (!, ?, !!, ??, !?, ?!)", () => {
        const game = parsePgn(GAME_WITH_NAGS)

        expect(game.moves[0].nags).toEqual([1])   // !
        expect(game.moves[1].nags).toEqual([2])   // ?
        expect(game.moves[2].nags).toEqual([3])   // !!
        expect(game.moves[3].nags).toEqual([4])   // ??
        expect(game.moves[4].nags).toEqual([5])   // !?
        expect(game.moves[5].nags).toEqual([6])   // ?!
    })

    test("parses multiple NAGs on same move", () => {
        const pgnWithMultipleNags = `[Event "Test"]
[Result "*"]

1. e4 $1 $10 $15 e5 *`

        const game = parsePgn(pgnWithMultipleNags)

        expect(game.moves[0].nags).toEqual([1, 10, 15])
    })

    test("skips NAGs when option is false", () => {
        const game = parsePgn(GAME_WITH_NAGS, { includeNags: false })

        expect(game.moves[0].nags).toBeUndefined()
        expect(game.moves[1].nags).toBeUndefined()
        expect(game.moves[2].nags).toBeUndefined()
    })
})

describe("PGN Variation Parsing Tests", () => {
    test("parses single variation", () => {
        const game = parsePgn(GAME_WITH_VARIATIONS)

        expect(game.moves[1].variations).toBeDefined()
        expect(game.moves[1].variations!.length).toBe(1)
        expect(game.moves[1].variations![0][0].san).toBe("c5")
        expect(game.moves[1].variations![0][0].comment).toBe("Sicilian Defense")
    })

    test("parses nested variations", () => {
        const pgnWithNestedVariations = `[Event "Test"]
[Result "*"]

1. e4 e5 ( 1... c5 2. Nf3 ( 2. Nc3 Nc6 ) d6 ) 2. Nf3 *`

        const game = parsePgn(pgnWithNestedVariations)

        expect(game.moves[1].variations).toBeDefined()
        expect(game.moves[1].variations!.length).toBe(1)
        expect(game.moves[1].variations![0].length).toBe(3)

        // Check nested variation
        const innerMove = game.moves[1].variations![0][1]
        expect(innerMove.san).toBe("Nf3")
        expect(innerMove.variations).toBeDefined()
        expect(innerMove.variations![0][0].san).toBe("Nc3")
    })

    test("parses multiple variations for same move", () => {
        const pgnWithMultipleVariations = `[Event "Test"]
[Result "*"]

1. e4 e5 ( 1... c5 ) ( 1... e6 ) ( 1... c6 ) 2. Nf3 *`

        const game = parsePgn(pgnWithMultipleVariations)

        expect(game.moves[1].variations).toBeDefined()
        expect(game.moves[1].variations!.length).toBe(3)
        expect(game.moves[1].variations![0][0].san).toBe("c5")
        expect(game.moves[1].variations![1][0].san).toBe("e6")
        expect(game.moves[1].variations![2][0].san).toBe("c6")
    })

    test("skips variations when option is false", () => {
        const game = parsePgn(GAME_WITH_VARIATIONS, { includeVariations: false })

        expect(game.moves[1].variations).toBeUndefined()
    })
})

describe("PGN Edge Cases Tests", () => {
    test("parses game with result", () => {
        const game = parsePgn(SIMPLE_GAME)

        expect(game.result).toBe("1-0")
    })

    test("parses incomplete game (*)", () => {
        const pgnIncomplete = `[Event "Test"]
[Result "*"]

1. e4 e5 2. Nf3 *`

        const game = parsePgn(pgnIncomplete)

        expect(game.result).toBe("*")
        expect(game.moves.length).toBe(3)
    })

    test("handles malformed input gracefully", () => {
        const malformedPgn = `[Event "Test"
1. e4 e5 2. Nf3`

        // Should not throw error
        expect(() => parsePgn(malformedPgn)).not.toThrow()

        const game = parsePgn(malformedPgn)
        expect(game.moves.length).toBeGreaterThan(0)
    })

    test("handles draw result (1/2-1/2)", () => {
        const pgnDraw = `[Event "Test"]
[Result "1/2-1/2"]

1. e4 e5 2. Nf3 Nc6 1/2-1/2`

        const game = parsePgn(pgnDraw)

        expect(game.result).toBe("1/2-1/2")
    })

    test("handles black win result (0-1)", () => {
        const pgnBlackWin = `[Event "Test"]
[Result "0-1"]

1. e4 e5 2. Nf3 Nc6 0-1`

        const game = parsePgn(pgnBlackWin)

        expect(game.result).toBe("0-1")
    })
})

describe("PGN Advanced Parsing Features", () => {
    test("parses game with disambiguation in moves", () => {
        const pgnWithDisambiguation = `[Event "Test"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 3. Nbd2 Nge7 4. Rfe1 Rad8 *`

        const game = parsePgn(pgnWithDisambiguation)

        expect(game.moves[4].san).toBe("Nbd2")
        expect(game.moves[5].san).toBe("Nge7")
        expect(game.moves[6].san).toBe("Rfe1")
        expect(game.moves[7].san).toBe("Rad8")
    })

    test("parses game with pawn captures including file", () => {
        const pgnWithPawnCaptures = `[Event "Test"]
[Result "*"]

1. e4 d5 2. exd5 c6 3. dxc6 *`

        const game = parsePgn(pgnWithPawnCaptures)

        expect(game.moves[2].san).toBe("exd5")
        expect(game.moves[4].san).toBe("dxc6")
    })

    test("parses NAGs within variations", () => {
        const pgnWithNagsInVariations = `[Event "Test"]
[Result "*"]

1. e4 e5 ( 1... c5! 2. Nf3? d6!! ) 2. Nf3 Nc6 *`

        const game = parsePgn(pgnWithNagsInVariations)

        expect(game.moves[1].variations).toBeDefined()
        const variation = game.moves[1].variations![0]
        expect(variation[0].nags).toEqual([1]) // !
        expect(variation[1].nags).toEqual([2]) // ?
        expect(variation[2].nags).toEqual([3]) // !!
    })

    test("parses comments within variations", () => {
        const pgnWithCommentsInVariations = `[Event "Test"]
[Result "*"]

1. e4 e5 ( 1... c5 { Best response } 2. Nf3 { Developing } ) 2. Nf3 Nc6 *`

        const game = parsePgn(pgnWithCommentsInVariations)

        const variation = game.moves[1].variations![0]
        expect(variation[0].comment).toBe("Best response")
        expect(variation[1].comment).toBe("Developing")
    })

    test("skips NAGs within variations when option is false", () => {
        const pgnWithNagsInVariations = `[Event "Test"]
[Result "*"]

1. e4 e5 ( 1... c5! ) 2. Nf3 Nc6 *`

        const game = parsePgn(pgnWithNagsInVariations, { includeNags: false })

        const variation = game.moves[1].variations![0]
        expect(variation[0].nags).toBeUndefined()
    })

    test("handles orphaned comments not attached to moves", () => {
        const pgnWithOrphanedComments = `[Event "Test"]
[Result "*"]

1. e4 { comment 1 } e5 ( { orphaned comment } 1... c5 ) *`

        // Should not throw
        expect(() => parsePgn(pgnWithOrphanedComments)).not.toThrow()

        const game = parsePgn(pgnWithOrphanedComments)
        expect(game.moves[0].comment).toBe("comment 1")
    })

    test("handles unclosed variations gracefully", () => {
        const pgnWithUnclosedVariation = `[Event "Test"]
[Result "*"]

1. e4 e5 ( 1... c5 2. Nf3 *`

        // Should not throw
        expect(() => parsePgn(pgnWithUnclosedVariation)).not.toThrow()

        const game = parsePgn(pgnWithUnclosedVariation)
        expect(game.moves[1].variations).toBeDefined()
    })
})
