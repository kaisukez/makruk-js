const { describe, expect, test } = globalThis as any

import { Color, Piece, SquareIndex, BITS } from "../../config"
import { getBoardStateFromBoardString } from "./board"
import {
    getPiecePositions,
    forEachPiece,
    countPiece,
    updatePiecePositionDictionary,
    revertPiecePositionDictionary,
    removePiecePositionIfExists
} from "./pieces"

describe("getPiecePositions", () => {
    test("should create piece positions from initial board", () => {
        const boardString = "rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)

        expect(piecePositions[Color.WHITE][Piece.RUA]).toHaveLength(2)
        expect(piecePositions[Color.WHITE][Piece.BIA]).toHaveLength(8)
        expect(piecePositions[Color.BLACK][Piece.RUA]).toHaveLength(2)
        expect(piecePositions[Color.BLACK][Piece.BIA]).toHaveLength(8)
    })

    test("should return empty arrays for empty board", () => {
        const boardString = "8/8/8/8/8/8/8/8"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)

        Object.values(Color).forEach(color => {
            Object.values(Piece).forEach(piece => {
                expect(piecePositions[color][piece]).toEqual([])
            })
        })
    })

    test("should correctly map piece positions", () => {
        const boardString = "4k3/8/8/8/8/8/8/R3K3"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)

        expect(piecePositions[Color.WHITE][Piece.KHUN]).toEqual([SquareIndex.e1])
        expect(piecePositions[Color.WHITE][Piece.RUA]).toEqual([SquareIndex.a1])
        expect(piecePositions[Color.BLACK][Piece.KHUN]).toEqual([SquareIndex.e8])
    })

    test("should handle multiple pieces of same type", () => {
        const boardString = "8/8/8/8/8/8/BBBBBBBB/8"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)

        expect(piecePositions[Color.WHITE][Piece.BIA]).toHaveLength(8)
        expect(piecePositions[Color.WHITE][Piece.BIA]).toContain(SquareIndex.a2)
        expect(piecePositions[Color.WHITE][Piece.BIA]).toContain(SquareIndex.h2)
    })
})

describe("forEachPiece", () => {
    test("should iterate over all pieces in position dictionary", () => {
        const boardString = "4k3/8/8/8/8/8/8/R3K3"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)

        const results: Array<{color: Color, piece: Piece, index: number}> = []
        forEachPiece(piecePositions, (color, piece, index) => {
            results.push({ color, piece, index })
        })

        expect(results).toHaveLength(3)
    })

    test("should provide correct color, piece, and index", () => {
        const boardString = "4k3/8/8/8/8/8/8/R3K3"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)

        const results: Array<{color: Color, piece: Piece, index: number}> = []
        forEachPiece(piecePositions, (color, piece, index) => {
            results.push({ color, piece, index })
        })

        expect(results).toContainEqual({
            color: Color.WHITE,
            piece: Piece.RUA,
            index: SquareIndex.a1
        })
        expect(results).toContainEqual({
            color: Color.WHITE,
            piece: Piece.KHUN,
            index: SquareIndex.e1
        })
        expect(results).toContainEqual({
            color: Color.BLACK,
            piece: Piece.KHUN,
            index: SquareIndex.e8
        })
    })

    test("should not call callback for empty positions", () => {
        const boardString = "8/8/8/8/8/8/8/8"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)

        let callCount = 0
        forEachPiece(piecePositions, () => {
            callCount++
        })

        expect(callCount).toBe(0)
    })
})

describe("countPiece", () => {
    test("should count all pieces correctly", () => {
        const boardString = "rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)
        const count = countPiece(piecePositions)

        expect(count.all).toBe(32)
        expect(count.color[Color.WHITE]).toBe(16)
        expect(count.color[Color.BLACK]).toBe(16)
    })

    test("should count pieces by type", () => {
        const boardString = "rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)
        const count = countPiece(piecePositions)

        expect(count.piece[Piece.BIA]).toBe(16)
        expect(count.piece[Piece.RUA]).toBe(4)
        expect(count.piece[Piece.MA]).toBe(4)
        expect(count.piece[Piece.THON]).toBe(4)
        expect(count.piece[Piece.MET]).toBe(2)
        expect(count.piece[Piece.KHUN]).toBe(2)
    })

    test("should count pieces by color and type", () => {
        const boardString = "rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)
        const count = countPiece(piecePositions)

        expect(count[Color.WHITE][Piece.BIA]).toBe(8)
        expect(count[Color.BLACK][Piece.BIA]).toBe(8)
        expect(count[Color.WHITE][Piece.RUA]).toBe(2)
        expect(count[Color.BLACK][Piece.RUA]).toBe(2)
    })

    test("should return zero for empty board", () => {
        const boardString = "8/8/8/8/8/8/8/8"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)
        const count = countPiece(piecePositions)

        expect(count.all).toBe(0)
        expect(count.color[Color.WHITE]).toBe(0)
        expect(count.color[Color.BLACK]).toBe(0)
    })

    test("should handle asymmetric piece counts", () => {
        const boardString = "4k3/8/8/8/8/8/BBBBBBBB/RMTKETMR"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)
        const count = countPiece(piecePositions)

        expect(count.color[Color.WHITE]).toBe(16)
        expect(count.color[Color.BLACK]).toBe(1)
        expect(count.all).toBe(17)
    })
})

describe("updatePiecePositionDictionary", () => {
    test("should update piece position for normal move", () => {
        const boardString = "4k3/8/8/8/8/8/8/R3K3"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)

        const moveObject = {
            color: Color.WHITE,
            piece: Piece.RUA,
            from: SquareIndex.a1,
            to: SquareIndex.a2,
            flags: BITS.NORMAL
        }

        const delta = updatePiecePositionDictionary(piecePositions, moveObject)

        expect(piecePositions[Color.WHITE][Piece.RUA]).toContain(SquareIndex.a2)
        expect(piecePositions[Color.WHITE][Piece.RUA]).not.toContain(SquareIndex.a1)
        expect(delta.moved.from).toBe(SquareIndex.a1)
        expect(delta.moved.to).toBe(SquareIndex.a2)
    })

    test("should throw error when color is missing", () => {
        const boardString = "4k3/8/8/8/8/8/8/R3K3"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)

        const moveObject = {
            piece: Piece.RUA,
            from: SquareIndex.a1,
            to: SquareIndex.a2,
            flags: BITS.NORMAL
        } as any

        expect(() => updatePiecePositionDictionary(piecePositions, moveObject)).toThrow()
    })

    test("should throw error when piece is missing", () => {
        const boardString = "4k3/8/8/8/8/8/8/R3K3"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)

        const moveObject = {
            color: Color.WHITE,
            from: SquareIndex.a1,
            to: SquareIndex.a2,
            flags: BITS.NORMAL
        } as any

        expect(() => updatePiecePositionDictionary(piecePositions, moveObject)).toThrow()
    })

    test("should throw error when from is missing", () => {
        const boardString = "4k3/8/8/8/8/8/8/R3K3"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)

        const moveObject = {
            color: Color.WHITE,
            piece: Piece.RUA,
            to: SquareIndex.a2,
            flags: BITS.NORMAL
        } as any

        expect(() => updatePiecePositionDictionary(piecePositions, moveObject)).toThrow()
    })

    test("should throw error when to is missing", () => {
        const boardString = "4k3/8/8/8/8/8/8/R3K3"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)

        const moveObject = {
            color: Color.WHITE,
            piece: Piece.RUA,
            from: SquareIndex.a1,
            flags: BITS.NORMAL
        } as any

        expect(() => updatePiecePositionDictionary(piecePositions, moveObject)).toThrow()
    })

    test("should handle capture move", () => {
        const boardString = "4k3/8/8/8/8/8/r7/R3K3"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)

        const moveObject = {
            color: Color.WHITE,
            piece: Piece.RUA,
            from: SquareIndex.a1,
            to: SquareIndex.a2,
            flags: BITS.CAPTURE,
            captured: Piece.RUA
        }

        const delta = updatePiecePositionDictionary(piecePositions, moveObject)

        expect(piecePositions[Color.WHITE][Piece.RUA]).toContain(SquareIndex.a2)
        expect(piecePositions[Color.BLACK][Piece.RUA]).not.toContain(SquareIndex.a2)
        expect(delta.capture).toBeDefined()
        expect(delta.capture?.piece).toBe(Piece.RUA)
    })

    test("should handle promotion move", () => {
        const boardString = "4k3/B7/8/8/8/8/8/4K3"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)

        const moveObject = {
            color: Color.WHITE,
            piece: Piece.BIA,
            from: SquareIndex.a7,
            to: SquareIndex.a8,
            flags: BITS.PROMOTION,
            promotion: Piece.FLIPPED_BIA
        }

        const delta = updatePiecePositionDictionary(piecePositions, moveObject)

        expect(piecePositions[Color.WHITE][Piece.BIA]).not.toContain(SquareIndex.a8)
        expect(piecePositions[Color.WHITE][Piece.FLIPPED_BIA]).toContain(SquareIndex.a8)
        expect(delta.promotion).toBeDefined()
        expect(delta.promotion?.toPiece).toBe(Piece.FLIPPED_BIA)
    })

    test("should handle promotion with capture", () => {
        const boardString = "r3k3/B7/8/8/8/8/8/4K3"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)

        const moveObject = {
            color: Color.WHITE,
            piece: Piece.BIA,
            from: SquareIndex.a7,
            to: SquareIndex.a8,
            flags: BITS.PROMOTION | BITS.CAPTURE,
            promotion: Piece.FLIPPED_BIA,
            captured: Piece.RUA
        }

        const delta = updatePiecePositionDictionary(piecePositions, moveObject)

        expect(piecePositions[Color.WHITE][Piece.FLIPPED_BIA]).toContain(SquareIndex.a8)
        expect(piecePositions[Color.BLACK][Piece.RUA]).not.toContain(SquareIndex.a8)
        expect(delta.promotion).toBeDefined()
        expect(delta.capture).toBeDefined()
    })

    test("should throw error if piece not found at from position", () => {
        const boardString = "4k3/8/8/8/8/8/8/4K3"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)

        const moveObject = {
            color: Color.WHITE,
            piece: Piece.RUA,
            from: SquareIndex.a1,
            to: SquareIndex.a2,
            flags: BITS.NORMAL
        }

        expect(() => updatePiecePositionDictionary(piecePositions, moveObject)).toThrow()
    })

    test("should allow move from square index 0", () => {
        const boardString = "4k3/8/8/8/8/8/8/R3K3"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)

        const moveObject = {
            color: Color.WHITE,
            piece: Piece.RUA,
            from: SquareIndex.a1, // a1 = 0
            to: SquareIndex.a2,
            flags: BITS.NORMAL
        }

        const delta = updatePiecePositionDictionary(piecePositions, moveObject)

        expect(delta.moved.from).toBe(0)
        expect(piecePositions[Color.WHITE][Piece.RUA]).toContain(SquareIndex.a2)
    })
})

describe("revertPiecePositionDictionary", () => {
    test("should revert normal move", () => {
        const boardString = "4k3/8/8/8/8/8/8/R3K3"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)

        const moveObject = {
            color: Color.WHITE,
            piece: Piece.RUA,
            from: SquareIndex.a1,
            to: SquareIndex.a2,
            flags: BITS.NORMAL
        }

        const delta = updatePiecePositionDictionary(piecePositions, moveObject)
        revertPiecePositionDictionary(piecePositions, delta)

        expect(piecePositions[Color.WHITE][Piece.RUA]).toContain(SquareIndex.a1)
        expect(piecePositions[Color.WHITE][Piece.RUA]).not.toContain(SquareIndex.a2)
    })

    test("should revert capture move", () => {
        const boardString = "4k3/8/8/8/8/8/r7/R3K3"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)

        const moveObject = {
            color: Color.WHITE,
            piece: Piece.RUA,
            from: SquareIndex.a1,
            to: SquareIndex.a2,
            flags: BITS.CAPTURE,
            captured: Piece.RUA
        }

        const delta = updatePiecePositionDictionary(piecePositions, moveObject)
        revertPiecePositionDictionary(piecePositions, delta)

        expect(piecePositions[Color.WHITE][Piece.RUA]).toContain(SquareIndex.a1)
        expect(piecePositions[Color.BLACK][Piece.RUA]).toContain(SquareIndex.a2)
    })

    test("should revert promotion move", () => {
        const boardString = "4k3/B7/8/8/8/8/8/4K3"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)

        const moveObject = {
            color: Color.WHITE,
            piece: Piece.BIA,
            from: SquareIndex.a7,
            to: SquareIndex.a8,
            flags: BITS.PROMOTION,
            promotion: Piece.FLIPPED_BIA
        }

        const delta = updatePiecePositionDictionary(piecePositions, moveObject)
        revertPiecePositionDictionary(piecePositions, delta)

        expect(piecePositions[Color.WHITE][Piece.BIA]).toContain(SquareIndex.a7)
        expect(piecePositions[Color.WHITE][Piece.FLIPPED_BIA]).not.toContain(SquareIndex.a8)
    })

    test("should revert promotion with capture", () => {
        const boardString = "r3k3/B7/8/8/8/8/8/4K3"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)

        const moveObject = {
            color: Color.WHITE,
            piece: Piece.BIA,
            from: SquareIndex.a7,
            to: SquareIndex.a8,
            flags: BITS.PROMOTION | BITS.CAPTURE,
            promotion: Piece.FLIPPED_BIA,
            captured: Piece.RUA
        }

        const delta = updatePiecePositionDictionary(piecePositions, moveObject)
        revertPiecePositionDictionary(piecePositions, delta)

        expect(piecePositions[Color.WHITE][Piece.BIA]).toContain(SquareIndex.a7)
        expect(piecePositions[Color.WHITE][Piece.FLIPPED_BIA]).not.toContain(SquareIndex.a8)
        expect(piecePositions[Color.BLACK][Piece.RUA]).toContain(SquareIndex.a8)
    })

    test("should maintain correct piece count after revert", () => {
        const boardString = "4k3/8/8/8/8/8/8/R3K3"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)

        const originalCount = countPiece(piecePositions)

        const moveObject = {
            color: Color.WHITE,
            piece: Piece.RUA,
            from: SquareIndex.a1,
            to: SquareIndex.a2,
            flags: BITS.NORMAL
        }

        const delta = updatePiecePositionDictionary(piecePositions, moveObject)
        revertPiecePositionDictionary(piecePositions, delta)

        const finalCount = countPiece(piecePositions)

        expect(finalCount.all).toBe(originalCount.all)
        expect(finalCount[Color.WHITE][Piece.RUA]).toBe(originalCount[Color.WHITE][Piece.RUA])
    })
})

describe("removePiecePositionIfExists", () => {
    test("should remove piece position when piece exists", () => {
        const boardString = "4k3/8/8/8/8/8/8/R3K3"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)

        removePiecePositionIfExists(piecePositions, boardState, SquareIndex.a1)

        expect(piecePositions[Color.WHITE][Piece.RUA]).not.toContain(SquareIndex.a1)
    })

    test("should handle removing from empty square gracefully", () => {
        const boardString = "4k3/8/8/8/8/8/8/4K3"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)

        const originalCount = countPiece(piecePositions)

        removePiecePositionIfExists(piecePositions, boardState, SquareIndex.a1)

        const newCount = countPiece(piecePositions)
        expect(newCount.all).toBe(originalCount.all)
    })

    test("should remove black piece position", () => {
        const boardString = "r3k3/8/8/8/8/8/8/4K3"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)

        removePiecePositionIfExists(piecePositions, boardState, SquareIndex.a8)

        expect(piecePositions[Color.BLACK][Piece.RUA]).not.toContain(SquareIndex.a8)
    })

    test("should only remove specified piece position", () => {
        const boardString = "4k3/8/8/8/8/8/8/R3KR2"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)

        removePiecePositionIfExists(piecePositions, boardState, SquareIndex.a1)

        expect(piecePositions[Color.WHITE][Piece.RUA]).toHaveLength(1)
        expect(piecePositions[Color.WHITE][Piece.RUA]).toContain(SquareIndex.f1)
        expect(piecePositions[Color.WHITE][Piece.RUA]).not.toContain(SquareIndex.a1)
    })

    test("should handle all piece types", () => {
        const boardString = "4k3/8/8/8/8/8/8/BFMTER1K"
        const boardState = getBoardStateFromBoardString(boardString)
        const piecePositions = getPiecePositions(boardState)

        removePiecePositionIfExists(piecePositions, boardState, SquareIndex.a1)
        expect(piecePositions[Color.WHITE][Piece.BIA]).not.toContain(SquareIndex.a1)

        removePiecePositionIfExists(piecePositions, boardState, SquareIndex.b1)
        expect(piecePositions[Color.WHITE][Piece.FLIPPED_BIA]).not.toContain(SquareIndex.b1)

        removePiecePositionIfExists(piecePositions, boardState, SquareIndex.c1)
        expect(piecePositions[Color.WHITE][Piece.MA]).not.toContain(SquareIndex.c1)
    })
})
