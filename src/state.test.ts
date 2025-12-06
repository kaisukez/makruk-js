import {
    BITS,
    Color,
    CountType,
    EMPTY_FEN,
    INITIAL_FEN,
    Piece,
    SquareIndex,
} from "./constants"
import {
    countPiece,
    exportFen,
    extractInfoFromFen,
    forEachPiece,
    forEachPieceFromBoardState,
    getBoardStateFromBoardString,
    getPiecePositions,
    importFen,
    put,
    remove,
    removePiecePositionIfExists,
    revertPiecePositionDictionary,
    updatePiecePositionDictionary,
} from "./state"
import { MoveObject, State } from "./types"

const { describe, expect, it, test } = globalThis as any

const { WHITE, BLACK } = Color
const {
    BIA,
    FLIPPED_BIA,
    MA,
    THON,
    MET,
    RUA,
    KHUN,
} = Piece
const {
    a3,
    b3,
    c3,
    d3,
    e3,
    f3,
    g3,
    h3,
    e6,
    f5,
    f6,
    g4,
    g5,
    h5,
    d1,
    e8,
} = SquareIndex

const SAMPLE_FEN = "rmtektmr/8/bbfbbbbb/8/8/BBBBFBBB/8/RMTKETMR w 5"

function expectFenError(fen: string, code: string) {
    try {
        extractInfoFromFen(fen)
        throw new Error(`expected ${code}`)
    } catch (error: any) {
        expect(error.code).toBe(code)
    }
}

function createEmptyState(): State {
    return importFen(EMPTY_FEN)
}

function createPiecePositionsFixture() {
    const state = createEmptyState()
    put(state, WHITE, BIA, f5)
    put(state, WHITE, BIA, g4)
    put(state, BLACK, BIA, e6)
    put(state, BLACK, BIA, h5)
    put(state, WHITE, KHUN, d1)
    put(state, BLACK, KHUN, e8)
    return state.piecePositions
}

describe("state helpers", () => {
    describe("extractInfoFromFen", () => {
        it.each([
            INITIAL_FEN,
            "rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 5 w bp 3 2 16",
        ])("parses valid fen %s", (fen: string) => {
            expect(extractInfoFromFen(fen)).toMatchObject({
                boardString: expect.any(String),
            })
        })

        it("throws descriptive errors for invalid inputs", () => {
            expectFenError("rmtektmr/8/8 w 1", "WRONG_BOARD_STRING_NUMBER_OF_RANKS")
            expectFenError("rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR x 1", "WRONG_ACTIVE_COLOR")
            expectFenError("rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w -1", "WRONG_MOVE_NUMBER")
            expectFenError(
                "rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 w bp - 1 16",
                "WRONG_COUNTDOWN",
            )
        })
    })

    describe("board helpers", () => {
        test("getBoardStateFromBoardString populates correct squares", () => {
            const { boardString } = extractInfoFromFen(SAMPLE_FEN)
            const boardState = getBoardStateFromBoardString(boardString)
            expect(boardState[SquareIndex.a1]).toEqual([WHITE, RUA])
            expect(boardState[SquareIndex.h8]).toEqual([BLACK, RUA])
            expect(boardState.filter(Boolean).length).toBe(32)
        })

        test("forEachPieceFromBoardState iterates once per piece", () => {
            const state = importFen(INITIAL_FEN)
            let iterations = 0
            forEachPieceFromBoardState(state.boardState, () => {
                iterations++
            })
            expect(iterations).toBe(32)
        })
    })

    describe("piece position helpers", () => {
        test("getPiecePositions builds lookup tables", () => {
            const state = importFen(INITIAL_FEN)
            const piecePositions = getPiecePositions(state.boardState)
            expect(piecePositions[WHITE][KHUN]).toEqual([d1])
            expect(piecePositions[BLACK][KHUN]).toEqual([e8])
            expect(piecePositions[WHITE][BIA].sort()).toEqual(
                [a3, b3, c3, d3, e3, f3, g3, h3].sort(),
            )
        })

        test("forEachPiece iterates through lookup table", () => {
            const state = importFen(INITIAL_FEN)
            const visited: Array<{ color: Color; piece: Piece }> = []
            forEachPiece(state.piecePositions, (color, piece) => {
                visited.push({ color, piece })
            })
            expect(visited).toHaveLength(32)
            expect(visited.filter(({ color }) => color === WHITE)).toHaveLength(16)
        })

        test("countPiece summarizes totals", () => {
            const state = importFen(INITIAL_FEN)
            const summary = countPiece(state.piecePositions)
            expect(summary.all).toBe(32)
            expect(summary.color[WHITE]).toBe(16)
            expect(summary.color[BLACK]).toBe(16)
            expect(summary.piece[BIA]).toBe(16)
        })
    })

    describe("piece position dictionary updates", () => {
        test("moves track destination squares", () => {
            const piecePositions = createPiecePositionsFixture()
            const delta = updatePiecePositionDictionary(piecePositions, {
                color: WHITE,
                piece: BIA,
                from: g4,
                to: g5,
                flags: BITS.NORMAL,
            })
            expect(piecePositions[WHITE][BIA].sort()).toEqual([f5, g5].sort())
            revertPiecePositionDictionary(piecePositions, delta)
            expect(piecePositions[WHITE][BIA].sort()).toEqual([f5, g4].sort())
        })

        test("captures remove opponent entries", () => {
            const piecePositions = createPiecePositionsFixture()
            const delta = updatePiecePositionDictionary(piecePositions, {
                color: BLACK,
                piece: BIA,
                from: h5,
                to: g4,
                flags: BITS.CAPTURE,
                captured: BIA,
            })
            expect(piecePositions[WHITE][BIA]).toEqual([f5])
            revertPiecePositionDictionary(piecePositions, delta)
            expect(piecePositions[WHITE][BIA].sort()).toEqual([f5, g4].sort())
        })

        test("promotions move square between piece buckets", () => {
            const piecePositions = createPiecePositionsFixture()
            const delta = updatePiecePositionDictionary(piecePositions, {
                color: WHITE,
                piece: BIA,
                from: f5,
                to: f6,
                flags: BITS.PROMOTION,
                promotion: FLIPPED_BIA,
            })
            expect(piecePositions[WHITE][BIA]).toEqual([g4])
            expect(piecePositions[WHITE][FLIPPED_BIA]).toEqual([f6])
            revertPiecePositionDictionary(piecePositions, delta)
            expect(piecePositions[WHITE][BIA].sort()).toEqual([f5, g4].sort())
            expect(piecePositions[WHITE][FLIPPED_BIA]).toEqual([])
        })

        test("capture + promotion records both operations", () => {
            const piecePositions = createPiecePositionsFixture()
            const delta = updatePiecePositionDictionary(piecePositions, {
                color: WHITE,
                piece: BIA,
                from: f5,
                to: e6,
                flags: BITS.CAPTURE | BITS.PROMOTION,
                captured: BIA,
                promotion: FLIPPED_BIA,
            })
            expect(piecePositions[WHITE][BIA]).toEqual([g4])
            expect(piecePositions[WHITE][FLIPPED_BIA]).toEqual([e6])
            expect(piecePositions[BLACK][BIA]).toEqual([h5])
            revertPiecePositionDictionary(piecePositions, delta)
            expect(piecePositions[WHITE][BIA].sort()).toEqual([f5, g4].sort())
            expect(piecePositions[WHITE][FLIPPED_BIA]).toEqual([])
            expect(piecePositions[BLACK][BIA].sort()).toEqual([e6, h5].sort())
        })

        test("validates required move information", () => {
            const piecePositions = createPiecePositionsFixture()
            const move: Partial<MoveObject> = {
                color: WHITE,
                piece: BIA,
                to: g5,
            }
            try {
                updatePiecePositionDictionary(
                    piecePositions,
                    move as MoveObject,
                )
                throw new Error("expected NOT_ENOUGH_INPUT")
            } catch (error: any) {
                expect(error.code).toBe("NOT_ENOUGH_INPUT")
            }
        })
    })

    describe("board mutations", () => {
        test("put writes new piece and removes existing occupant", () => {
            const state = createEmptyState()
            put(state, WHITE, BIA, a3)
            put(state, BLACK, MA, a3)
            expect(state.boardState[a3]).toEqual([BLACK, MA])
            expect(state.piecePositions[WHITE][BIA]).toEqual([])
            expect(state.piecePositions[BLACK][MA]).toEqual([a3])
        })

        test("remove clears piece and lookup table", () => {
            const state = createEmptyState()
            put(state, WHITE, BIA, a3)
            remove(state, a3)
            expect(state.boardState[a3]).toBeNull()
            expect(state.piecePositions[WHITE][BIA]).toEqual([])
        })

        test("removePiecePositionIfExists is a no-op on empty squares", () => {
            const state = importFen(INITIAL_FEN)
            removePiecePositionIfExists(state.piecePositions, state.boardState, SquareIndex.a4)
            expect(state.piecePositions[WHITE][BIA].length).toBe(8)
        })
    })

    describe("fen import/export", () => {
        test("round trips initial position", () => {
            const state = importFen(INITIAL_FEN)
            expect(exportFen(state)).toBe(INITIAL_FEN)
        })

        test("imports countdown metadata", () => {
            const fen = "rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 w bp 3 2 16"
            const state = importFen(fen)
            expect(state.countdown).toEqual({
                countColor: WHITE,
                countType: CountType.BOARD_POWER_COUNTDOWN,
                count: 3,
                countFrom: 2,
                countTo: 16,
            })
        })

        test("exports countdown metadata when present", () => {
            const state = importFen(INITIAL_FEN)
            state.countdown = {
                countColor: BLACK,
                countType: CountType.PIECE_POWER_COUNTDOWN,
                count: 4,
                countFrom: 1,
                countTo: 16,
            }
            expect(exportFen(state)).toBe(
                `${INITIAL_FEN} b pp 4 1 16`,
            )
            state.countdown = null
            expect(exportFen(state)).toBe(INITIAL_FEN)
        })
    })
})

