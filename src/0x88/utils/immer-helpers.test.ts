import { Color, CountType, Piece, SquareIndex } from "common/const"
import { importFen, INITIAL_FEN } from "0x88/fen/importer"

import { cloneCountdown, cloneSquareData, produceState } from "0x88/utils/immer-helpers"

describe("immer-helpers", () => {
    describe("produceState", () => {
        it("should return new state object", () => {
            const state = importFen(INITIAL_FEN)
            const newState = produceState(state, (draft) => {
                draft.moveNumber = 10
            })
            expect(newState).not.toBe(state)
        })

        it("should preserve original state", () => {
            const state = importFen(INITIAL_FEN)
            const originalMoveNumber = state.moveNumber
            produceState(state, (draft) => {
                draft.moveNumber = 10
            })
            expect(state.moveNumber).toBe(originalMoveNumber)
        })

        it("should apply simple field updates", () => {
            const state = importFen(INITIAL_FEN)
            const newState = produceState(state, (draft) => {
                draft.moveNumber = 10
            })
            expect(newState.moveNumber).toBe(10)
        })

        it("should apply color changes", () => {
            const state = importFen(INITIAL_FEN)
            const newState = produceState(state, (draft) => {
                draft.activeColor = Color.BLACK
            })
            expect(newState.activeColor).toBe(Color.BLACK)
            expect(state.activeColor).toBe(Color.WHITE)
        })

        it("should update nested boardState", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4K3 w 1")
            const newState = produceState(state, (draft) => {
                draft.boardState[SquareIndex.e4] = [Color.WHITE, Piece.KHUN]
            })
            expect(newState.boardState[SquareIndex.e4]).toEqual([Color.WHITE, Piece.KHUN])
            expect(state.boardState[SquareIndex.e4]).toBeNull()
        })

        it("should update countdown object", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4K2r w 1")
            const newState = produceState(state, (draft) => {
                draft.countdown = {
                    countColor: Color.WHITE,
                    countType: CountType.PIECE_POWER_COUNTDOWN,
                    count: 5,
                    countFrom: 1,
                    countTo: 16,
                }
            })
            expect(newState.countdown).toEqual({
                countColor: Color.WHITE,
                countType: CountType.PIECE_POWER_COUNTDOWN,
                count: 5,
                countFrom: 1,
                countTo: 16,
            })
            expect(state.countdown).toBeNull()
        })

        it("should update fenOccurrence", () => {
            const state = importFen(INITIAL_FEN)
            const fen = "test-fen"
            const newState = produceState(state, (draft) => {
                draft.fenOccurrence[fen] = 3
            })
            expect(newState.fenOccurrence[fen]).toBe(3)
            expect(state.fenOccurrence[fen]).toBeUndefined()
        })

        it("should handle multiple updates", () => {
            const state = importFen(INITIAL_FEN)
            const newState = produceState(state, (draft) => {
                draft.moveNumber = 10
                draft.activeColor = Color.BLACK
            })
            expect(newState.moveNumber).toBe(10)
            expect(newState.activeColor).toBe(Color.BLACK)
            expect(state.moveNumber).not.toBe(10)
        })

        it("should use structural sharing for unchanged parts", () => {
            const state = importFen(INITIAL_FEN)
            const newState = produceState(state, (draft) => {
                draft.moveNumber = 10
            })
            expect(newState.piecePositions).toBe(state.piecePositions)
        })

        it("should handle removing pieces", () => {
            const state = importFen(INITIAL_FEN)
            const newState = produceState(state, (draft) => {
                draft.boardState[SquareIndex.a1] = null
            })
            expect(newState.boardState[SquareIndex.a1]).toBeNull()
            expect(state.boardState[SquareIndex.a1]).not.toBeNull()
        })

        it("should allow chained updates", () => {
            const state = importFen("4k3/8/8/8/8/8/8/4K3 w 1")
            const state2 = produceState(state, (draft) => {
                draft.moveNumber = 2
            })
            const state3 = produceState(state2, (draft) => {
                draft.moveNumber = 3
            })
            expect(state.moveNumber).toBe(1)
            expect(state2.moveNumber).toBe(2)
            expect(state3.moveNumber).toBe(3)
        })
    })

    describe("cloneCountdown", () => {
        it("should return null for null input", () => {
            expect(cloneCountdown(null)).toBeNull()
        })

        it("should create new object", () => {
            const countdown = {
                countColor: Color.WHITE,
                countType: CountType.PIECE_POWER_COUNTDOWN,
                count: 5,
                countFrom: 1,
                countTo: 16,
            }
            const cloned = cloneCountdown(countdown)
            expect(cloned).not.toBe(countdown)
        })

        it("should have same values", () => {
            const countdown = {
                countColor: Color.WHITE,
                countType: CountType.PIECE_POWER_COUNTDOWN,
                count: 5,
                countFrom: 1,
                countTo: 16,
            }
            const cloned = cloneCountdown(countdown)
            expect(cloned).toEqual(countdown)
        })

        it("should create shallow copy", () => {
            const countdown = {
                countColor: Color.WHITE,
                countType: CountType.PIECE_POWER_COUNTDOWN,
                count: 5,
                countFrom: 1,
                countTo: 16,
            }
            const cloned = cloneCountdown(countdown)!
            cloned.count = 10
            expect(countdown.count).toBe(5)
        })

        it("should clone board power countdown", () => {
            const countdown = {
                countColor: Color.BLACK,
                countType: CountType.BOARD_POWER_COUNTDOWN,
                count: 10,
                countFrom: 4,
                countTo: 64,
            }
            const cloned = cloneCountdown(countdown)
            expect(cloned).toEqual(countdown)
            expect(cloned).not.toBe(countdown)
        })
    })

    describe("cloneSquareData", () => {
        it("should return null for null input", () => {
            expect(cloneSquareData(null)).toBeNull()
        })

        it("should create new tuple", () => {
            const square: [Color, Piece] = [Color.WHITE, Piece.KHUN]
            const cloned = cloneSquareData(square)
            expect(cloned).not.toBe(square)
        })

        it("should have same values", () => {
            const square: [Color, Piece] = [Color.WHITE, Piece.KHUN]
            const cloned = cloneSquareData(square)
            expect(cloned).toEqual(square)
        })

        it("should clone white pieces", () => {
            const square: [Color, Piece] = [Color.WHITE, Piece.RUA]
            const cloned = cloneSquareData(square)
            expect(cloned).toEqual([Color.WHITE, Piece.RUA])
            expect(cloned).not.toBe(square)
        })

        it("should clone black pieces", () => {
            const square: [Color, Piece] = [Color.BLACK, Piece.THON]
            const cloned = cloneSquareData(square)
            expect(cloned).toEqual([Color.BLACK, Piece.THON])
            expect(cloned).not.toBe(square)
        })

        it("should clone all piece types", () => {
            const pieces: Piece[] = [
                Piece.KHUN,
                Piece.RUA,
                Piece.THON,
                Piece.MA,
                Piece.MET,
                Piece.BIA,
                Piece.FLIPPED_BIA,
            ]

            pieces.forEach(piece => {
                const square: [Color, Piece] = [Color.WHITE, piece]
                const cloned = cloneSquareData(square)
                expect(cloned).toEqual(square)
                expect(cloned).not.toBe(square)
            })
        })

        it("should create independent copy", () => {
            const square: [Color, Piece] = [Color.WHITE, Piece.BIA]
            const cloned = cloneSquareData(square)!
            cloned[0] = Color.BLACK
            expect(square[0]).toBe(Color.WHITE)
        })
    })
})
