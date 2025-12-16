import { BITS, Color, Piece, SquareIndex } from "config"
import { MoveObject, PieceCount, State } from "core/types"
import { swapColor } from "utils/board-utils"

export type PiecePositionDelta = {
    moved: {
        color: Color;
        piece: Piece;
        index: number;
        from: SquareIndex;
        to: SquareIndex;
    };
    capture?: {
        color: Color;
        piece: Piece;
        index: number;
        square: SquareIndex;
    };
    promotion?: {
        toPiece: Piece;
        addedIndex: number;
        removedIndex: number;
    };
};

export function getPiecePositions(
    boardState: State["boardState"],
): State["piecePositions"] {
    const piecePositions: State["piecePositions"] = {
        [Color.WHITE]: {
            [Piece.BIA]: [],
            [Piece.FLIPPED_BIA]: [],
            [Piece.MA]: [],
            [Piece.THON]: [],
            [Piece.MET]: [],
            [Piece.RUA]: [],
            [Piece.KHUN]: [],
        },
        [Color.BLACK]: {
            [Piece.BIA]: [],
            [Piece.FLIPPED_BIA]: [],
            [Piece.MA]: [],
            [Piece.THON]: [],
            [Piece.MET]: [],
            [Piece.RUA]: [],
            [Piece.KHUN]: [],
        },
    }

    for (let i = SquareIndex.a1; i <= SquareIndex.h8; i++) {
        if (i & 0x88) {
            i += 7
            continue
        }

        const squareData = boardState[i]
        if (squareData) {
            const [color, piece] = squareData
            piecePositions[color][piece].push(i)
        }
    }

    return piecePositions
}

export function forEachPiece(
    piecePositions: State["piecePositions"],
    callback: (color: Color, piece: Piece, index: SquareIndex) => void,
) {
    for (const color of [Color.WHITE, Color.BLACK]) {
        for (const piece of Object.values(Piece)) {
            for (const index of piecePositions[color][piece]) {
                callback(color, piece, index)
            }
        }
    }
}

export function countPiece(
    piecePositions: State["piecePositions"],
): PieceCount {
    const pieceCount = {
        all: 0,

        color: {
            [Color.WHITE]: 0,
            [Color.BLACK]: 0,
        },
        piece: {
            [Piece.BIA]: 0,
            [Piece.FLIPPED_BIA]: 0,
            [Piece.MA]: 0,
            [Piece.THON]: 0,
            [Piece.MET]: 0,
            [Piece.RUA]: 0,
            [Piece.KHUN]: 0,
        },

        [Color.WHITE]: {
            [Piece.BIA]: 0,
            [Piece.FLIPPED_BIA]: 0,
            [Piece.MA]: 0,
            [Piece.THON]: 0,
            [Piece.MET]: 0,
            [Piece.RUA]: 0,
            [Piece.KHUN]: 0,
        },
        [Color.BLACK]: {
            [Piece.BIA]: 0,
            [Piece.FLIPPED_BIA]: 0,
            [Piece.MA]: 0,
            [Piece.THON]: 0,
            [Piece.MET]: 0,
            [Piece.RUA]: 0,
            [Piece.KHUN]: 0,
        },
    }

    forEachPiece(piecePositions, (color: Color, piece: Piece) => {
        pieceCount.all++
        pieceCount.color[color]++
        pieceCount.piece[piece]++
        pieceCount[color][piece]++
    })

    return pieceCount
}

/**
 * moveObject = { from: 21, to: 22 }
 * piecePositions = [5, 21, 49]
 *
 * updatePiecePositionDictionary(piecePositions, moveObject)
 * newPiecePosition = [5, 22, 49]
 */
export function updatePiecePositionDictionary(
    piecePositions: State["piecePositions"],
    moveObject: MoveObject,
): PiecePositionDelta {
    const { color, piece, from, to, flags, promotion, captured } = moveObject

    if (
        !color ||
        !piece ||
        (!from && from !== 0) ||
        (!to && to !== 0) ||
        (flags & BITS.PROMOTION && !promotion) ||
        (flags & BITS.CAPTURE && !captured)
    ) {
        const requireMoreInput = []

        if (!color) {
            requireMoreInput.push("color")
        }
        if (!piece) {
            requireMoreInput.push("piece")
        }
        if (!from && from !== 0) {
            requireMoreInput.push("from")
        }
        if (!to && to !== 0) {
            requireMoreInput.push("to")
        }
        if (flags & BITS.PROMOTION && !promotion) {
            requireMoreInput.push("promotion")
        }
        if (flags & BITS.CAPTURE && !captured) {
            requireMoreInput.push("captured")
        }

        throw {
            code: "NOT_ENOUGH_INPUT",
            message:
                `Please provide ${requireMoreInput.join(", ")} ` +
                "in addition to your current input!",
        }
    }

    const container = piecePositions[color][piece]
    const index = container.indexOf(from)

    if (index === -1) {
        throw {
            code: "PIECE_POSITION_NOT_FOUND",
            message: "cannot locate piece position for update",
        }
    }

    container[index] = to

    const delta: PiecePositionDelta = {
        moved: {
            color,
            piece,
            index,
            from,
            to,
        },
    }

    if (flags & BITS.PROMOTION && promotion) {
        const removedIndex = index
        container.splice(index, 1)
        piecePositions[color][promotion].push(to)
        const addedIndex = piecePositions[color][promotion].length - 1

        delta.promotion = {
            toPiece: promotion,
            addedIndex,
            removedIndex,
        }
    }

    if (flags & BITS.CAPTURE && captured) {
        const opponentColor: Color = swapColor(color)
        const opponentList = piecePositions[opponentColor][captured]
        const captureIndex = opponentList.indexOf(to)
        if (captureIndex !== -1) {
            opponentList.splice(captureIndex, 1)
            delta.capture = {
                color: opponentColor,
                piece: captured,
                index: captureIndex,
                square: to,
            }
        }
    }

    return delta
}

export function revertPiecePositionDictionary(
    piecePositions: State["piecePositions"],
    delta: PiecePositionDelta,
) {
    const { moved, promotion, capture } = delta

    if (promotion) {
        const promotedList = piecePositions[moved.color][promotion.toPiece]
        promotedList.splice(promotion.addedIndex, 1)
        piecePositions[moved.color][moved.piece].splice(promotion.removedIndex, 0, moved.from)
    } else {
        piecePositions[moved.color][moved.piece][moved.index] = moved.from
    }

    if (capture) {
        piecePositions[capture.color][capture.piece].splice(
            capture.index,
            0,
            capture.square,
        )
    }
}

export function removePiecePositionIfExists(
    piecePositions: State["piecePositions"],
    boardState: State["boardState"],
    squareIndex: SquareIndex,
) {
    const squareData = boardState[squareIndex]
    if (squareData) {
        const [color, piece] = squareData
        const toDeleteIndex = piecePositions[color][piece].indexOf(squareIndex)
        if (toDeleteIndex !== -1) {
            piecePositions[color][piece].splice(toDeleteIndex, 1)
        }
    }
}
