import {
    ATTACK_OFFSETS,
    BITS,
    Color,
    IS_SLIDING_PIECE,
    MOVE_OFFSETS,
    Piece,
    RANK_3,
    RANK_6,
    SquareIndex,
} from "common/const"
import { isKhunAttacked } from "0x88/rules/status"
import { MoveObject, State } from "0x88/types"
import { getRank, swapColor } from "0x88/utils/board-utils"

import { applyMove } from "0x88/moves/execution"

export type GenerateMovesForOneSquareOptions = {
    forColor?: Color;
    legal?: boolean;
};

export function generateMovesForOneSquare(
    state: State,
    squareIndex: SquareIndex,
    options: GenerateMovesForOneSquareOptions = {},
): MoveObject[] {
    const { boardState } = state
    const moves: MoveObject[] = []

    // if the square is off the board
    if (squareIndex & 0x88) {
        return moves
    }

    const squareData = boardState[squareIndex]

    // if the square is empty
    if (!squareData) {
        return moves
    }

    const { forColor, legal } = options
    const [color, piece] = squareData

    let squarePointer = squareIndex

    if (forColor && forColor !== color) {
        return moves
    }

    const attackOffsets = (ATTACK_OFFSETS as any)[color][piece] as number[]
    for (const offset of attackOffsets) {
        squarePointer = squareIndex
        while (true) {
            squarePointer += offset
            const targetSquare = boardState[squarePointer]

            // if the square is off the board
            if (squarePointer & 0x88) {
                break
            }

            // if it's a opponent piece
            if (targetSquare) {
                if (targetSquare[0] !== color) {
                    const move: MoveObject = {
                        color,
                        piece,
                        from: squareIndex,
                        to: squarePointer,
                        flags: BITS.CAPTURE,
                        captured: targetSquare[1],
                    }
                    if (
                        piece === Piece.BIA &&
                        (getRank(squarePointer) === RANK_3 || getRank(squarePointer) === RANK_6)
                    ) {
                        move.promotion = Piece.FLIPPED_BIA
                        move.flags |= BITS.PROMOTION
                    }
                    moves.push(move)
                }
                break
            }

            if (!IS_SLIDING_PIECE[piece as keyof typeof IS_SLIDING_PIECE]) {
                break
            }
        }
    }

    const moveOffsets = (MOVE_OFFSETS as any)[color][piece] as number[]
    for (const offset of moveOffsets) {
        squarePointer = squareIndex
        while (true) {
            squarePointer += offset
            const targetSquare = boardState[squarePointer]

            // if the square is off the board
            if (squarePointer & 0x88) {
                break
            }

            // if it's a empty square
            if (!targetSquare) {
                const move: MoveObject = {
                    color,
                    piece,
                    from: squareIndex,
                    to: squarePointer,
                    flags: BITS.NORMAL,
                }
                if (
                    piece === Piece.BIA &&
                    (getRank(squarePointer) === RANK_3 || getRank(squarePointer) === RANK_6)
                ) {
                    move.promotion = Piece.FLIPPED_BIA
                    move.flags |= BITS.PROMOTION
                }
                moves.push(move)
            } else {
                break
            }

            if (!IS_SLIDING_PIECE[piece as keyof typeof IS_SLIDING_PIECE]) {
                break
            }
        }
    }

    if (!legal) {
        return moves
    }

    const legalMoves: MoveObject[] = []
    for (const candidate of moves) {
        const { newState } = applyMove(state, candidate, {
            trackUndo: false,
            updateFen: false,
        })
        const moverColor = swapColor(newState.turn)
        const legalMove = !isKhunAttacked(newState, moverColor)

        if (legalMove) {
            legalMoves.push(candidate)
        }
    }

    return legalMoves
}

export function generateMoves(
    state: State,
    options: GenerateMovesForOneSquareOptions,
): MoveObject[] {
    const moves: MoveObject[] = []
    state.boardState.forEach((_, index) => {
        moves.push(...generateMovesForOneSquare(state, index, options))
    })
    return moves
}

export function generateLegalMoves(state: State) {
    return generateMoves(state, {
        forColor: state.turn,
        legal: true,
    })
}

export function makeMove(
    state: State,
    moveObject: MoveObject,
    optional = {},
): State {
    const { newState } = applyMove(state, moveObject, {
        optional,
        trackUndo: false,
        updateFen: true,
    })
    return newState
}
