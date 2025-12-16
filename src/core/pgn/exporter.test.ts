import { exportPgn } from "./exporter"
import { PgnGame } from "./types"

const { describe, expect, test } = globalThis as any

describe("PGN Export Tests", () => {
    test("exports tags in correct order", () => {
        const game: PgnGame = {
            tags: {
                Result: "1-0",
                White: "Player1",
                Event: "Test",
                Black: "Player2",
                Date: "2025.01.01",
                Site: "Online",
                Round: "1",
            },
            moves: [],
        }

        const exported = exportPgn(game)
        const lines = exported.split('\n')

        // Check standard seven tag roster order
        expect(lines[0]).toBe('[Event "Test"]')
        expect(lines[1]).toBe('[Site "Online"]')
        expect(lines[2]).toBe('[Date "2025.01.01"]')
        expect(lines[3]).toBe('[Round "1"]')
        expect(lines[4]).toBe('[White "Player1"]')
        expect(lines[5]).toBe('[Black "Player2"]')
        expect(lines[6]).toBe('[Result "1-0"]')
    })

    test("exports moves with proper formatting", () => {
        const game: PgnGame = {
            tags: { Event: "Test" },
            moves: [
                { moveNumber: 1, san: "e4" },
                { san: "e5" },
                { moveNumber: 2, san: "Nf3" },
                { san: "Nc6" },
            ],
            result: "*",
        }

        const exported = exportPgn(game)

        expect(exported).toContain("1. e4 e5 2. Nf3 Nc6")
    })

    test("exports with comments", () => {
        const game: PgnGame = {
            tags: { Event: "Test" },
            moves: [
                { moveNumber: 1, san: "e4", comment: "King's pawn opening" },
                { san: "e5" },
            ],
            result: "*",
        }

        const exported = exportPgn(game)

        expect(exported).toContain("{ King's pawn opening }")
    })

    test("exports with variations", () => {
        const game: PgnGame = {
            tags: { Event: "Test" },
            moves: [
                { moveNumber: 1, san: "e4" },
                {
                    san: "e5",
                    variations: [
                        [{ san: "c5", comment: "Sicilian" }]
                    ]
                },
            ],
            result: "*",
        }

        const exported = exportPgn(game)

        expect(exported).toContain("( c5 { Sicilian } )")
    })

    test("exports with NAGs as symbols", () => {
        const game: PgnGame = {
            tags: { Event: "Test" },
            moves: [
                { moveNumber: 1, san: "e4", nags: [1] },
                { san: "e5", nags: [2] },
                { moveNumber: 2, san: "Nf3", nags: [3] },
                { san: "Nc6", nags: [4] },
            ],
            result: "*",
        }

        const exported = exportPgn(game)

        expect(exported).toContain("e4!")
        expect(exported).toContain("e5?")
        expect(exported).toContain("Nf3!!")
        expect(exported).toContain("Nc6??")
    })

    test("exports with NAGs as numeric codes for non-standard NAGs", () => {
        const game: PgnGame = {
            tags: { Event: "Test" },
            moves: [
                { moveNumber: 1, san: "e4", nags: [10] },
                { san: "e5", nags: [15] },
            ],
            result: "*",
        }

        const exported = exportPgn(game)

        expect(exported).toContain("$10")
        expect(exported).toContain("$15")
    })

    test("exports custom tags in alphabetical order after standard tags", () => {
        const game: PgnGame = {
            tags: {
                Event: "Test",
                Site: "Online",
                Date: "2025.01.01",
                Round: "1",
                White: "Player1",
                Black: "Player2",
                Result: "*",
                WhiteElo: "2500",
                BlackElo: "2400",
                ECO: "C00",
            },
            moves: [],
        }

        const exported = exportPgn(game)
        const lines = exported.split('\n')

        // Standard tags come first
        expect(lines[0]).toContain('[Event')
        expect(lines[6]).toContain('[Result')

        // Custom tags should be alphabetically ordered after standard tags
        const customTagsStart = 7
        expect(lines[customTagsStart]).toContain('[BlackElo')
        expect(lines[customTagsStart + 1]).toContain('[ECO')
        expect(lines[customTagsStart + 2]).toContain('[WhiteElo')
    })

    test("exports with line wrapping at maxLineWidth", () => {
        const game: PgnGame = {
            tags: { Event: "Test" },
            moves: Array.from({ length: 20 }, (_, i) => [
                { moveNumber: i + 1, san: "Nf3" },
                { san: "Nc6" },
            ]).flat(),
            result: "*",
        }

        const exported = exportPgn(game, { maxLineWidth: 40 })
        const lines = exported.split('\n')

        // Find the movetext section (after tags and empty line)
        const movetextLines = lines.filter(line =>
            line.includes('Nf3') || line.includes('Nc6')
        )

        // Should have multiple lines due to wrapping
        expect(movetextLines.length).toBeGreaterThan(1)

        // Each line should be within the limit (with some tolerance for word boundaries)
        for (const line of movetextLines) {
            if (!line.includes('*')) {
                expect(line.length).toBeLessThanOrEqual(50) // Some tolerance
            }
        }
    })

    test("exports without comments when option is false", () => {
        const game: PgnGame = {
            tags: { Event: "Test" },
            moves: [
                { moveNumber: 1, san: "e4", comment: "This comment should not appear" },
                { san: "e5" },
            ],
            result: "*",
        }

        const exported = exportPgn(game, { includeComments: false })

        expect(exported).not.toContain("This comment should not appear")
        expect(exported).not.toContain("{")
    })

    test("exports without variations when option is false", () => {
        const game: PgnGame = {
            tags: { Event: "Test" },
            moves: [
                { moveNumber: 1, san: "e4" },
                {
                    san: "e5",
                    variations: [
                        [{ san: "c5" }]
                    ]
                },
            ],
            result: "*",
        }

        const exported = exportPgn(game, { includeVariations: false })

        expect(exported).not.toContain("c5")
        expect(exported).not.toContain("(")
    })

    test("exports empty game with only tags", () => {
        const game: PgnGame = {
            tags: { Event: "Test", Result: "*" },
            moves: [],
        }

        const exported = exportPgn(game)

        expect(exported).toContain('[Event "Test"]')
        expect(exported).toContain('[Result "*"]')
        expect(exported).toContain('*')
    })

    test("exports game result from tags when no explicit result", () => {
        const game: PgnGame = {
            tags: { Event: "Test", Result: "1-0" },
            moves: [
                { moveNumber: 1, san: "e4" },
                { san: "e5" },
            ],
        }

        const exported = exportPgn(game)

        expect(exported).toContain('1-0')
    })

    test("exports with multiple NAGs on same move", () => {
        const game: PgnGame = {
            tags: { Event: "Test" },
            moves: [
                { moveNumber: 1, san: "e4", nags: [1, 5] },
                { san: "e5" },
            ],
            result: "*",
        }

        const exported = exportPgn(game)

        expect(exported).toContain("e4!!?")
    })

    test("exports nested variations correctly", () => {
        const game: PgnGame = {
            tags: { Event: "Test" },
            moves: [
                { moveNumber: 1, san: "e4" },
                {
                    san: "e5",
                    variations: [
                        [
                            { san: "c5" },
                            {
                                san: "Nf3",
                                variations: [
                                    [{ san: "Nc3" }]
                                ]
                            }
                        ]
                    ]
                },
            ],
            result: "*",
        }

        const exported = exportPgn(game)

        expect(exported).toContain("( c5")
        expect(exported).toContain("Nf3")
        expect(exported).toContain("( Nc3 )")
    })

    test("exports with prettyPrint option", () => {
        const game: PgnGame = {
            tags: { Event: "Test" },
            moves: [
                { moveNumber: 1, san: "e4" },
                { san: "e5" },
                { moveNumber: 2, san: "Nf3" },
                { san: "Nc6" },
            ],
            result: "*",
        }

        const exported = exportPgn(game, { prettyPrint: true })

        // With prettyPrint, each move should be on a new line
        expect(exported).toContain("\ne5")
        expect(exported).toContain("\n2.")
    })

    test("exports without line wrapping when maxLineWidth is 0", () => {
        const game: PgnGame = {
            tags: { Event: "Test" },
            moves: Array.from({ length: 20 }, (_, i) => [
                { moveNumber: i + 1, san: "Nf3" },
                { san: "Nc6" },
            ]).flat(),
            result: "*",
        }

        const exported = exportPgn(game, { maxLineWidth: 0 })
        const lines = exported.split('\n')

        // Find the movetext section (after tags and empty line)
        const movetextLines = lines.filter(line =>
            line.includes('Nf3') || line.includes('Nc6')
        )

        // Should be on a single line when maxLineWidth is 0
        expect(movetextLines.length).toBe(1)
    })

    test("exports empty variations correctly", () => {
        const game: PgnGame = {
            tags: { Event: "Test" },
            moves: [
                { moveNumber: 1, san: "e4" },
                {
                    san: "e5",
                    variations: [[]] // Empty variation
                },
            ],
            result: "*",
        }

        const exported = exportPgn(game)

        // Empty variation should export as "(  )" with two spaces
        expect(exported).toContain("(  )")
    })

    test("exports without NAGs when option is false", () => {
        const game: PgnGame = {
            tags: { Event: "Test" },
            moves: [
                { moveNumber: 1, san: "e4", nags: [1] },
                { san: "e5", nags: [2] },
            ],
            result: "*",
        }

        const exported = exportPgn(game, { includeNags: false })

        expect(exported).not.toContain("!")
        expect(exported).not.toContain("?")
        expect(exported).toContain("e4")
        expect(exported).toContain("e5")
    })
})
