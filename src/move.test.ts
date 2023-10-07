import {
    Color,
    Piece,

    INITIAL_FEN,
    EMPTY_FEN,

    BIA_MOVE_OFFSETS,
    BIA_ATTACK_OFFSETS,
    THON_MOVE_OFFSETS,
    THON_ATTACK_OFFSETS,
    PIECE_MOVE_OFFSETS,
    PIECE_ATTACK_OFFSETS,

    IS_SLIDING_PIECE,

    PIECE_POWER,

    SquareIndex,

    FLAGS,
    BITS,

    RANK_1,
    RANK_2,
    RANK_3,
    RANK_4,
    RANK_5,
    RANK_6,
    RANK_7,
    RANK_8,

    FILE_A,
    FILE_B,
    FILE_C,
    FILE_D,
    FILE_E,
    FILE_F,
    FILE_G,
    FILE_H,

    CountType,
    // PIECE_POWER_COUNTDOWN,
    // BOARD_POWER_COUNTDOWN
} from './constants'

import {
    swapColor,
    getAttackOffsets,
    getMoveOffsets,
    rank,
    file,
    squareColor,
    algebraic,
    ascii,
    clone,
    compose,
    pipe
} from './utils'

import {
    extractInfoFromFen,
    getBoardStateFromBoardString,
    forEachPieceFromBoardState,
    getPiecePositions,
    forEachPiece,
    countPiece,
    updatePiecePositionDictionary,
    removePiecePositionIfExists,
    put,
    remove,
    importFen,
    exportFen
} from './state'

import {
    canThisColorAttackThisSquare,
    isKhunAttacked,
    inCheck,
    inCheckmate,
    inStalemate,
    inDraw,
    gameOver,
    calculateCountdown,

    changePiecePosition,
    step,
    stepCountdown,
    stepBackCountdown,
    makeMove,
    undoMove,
    nextMove,

    generateMoves,
    generateLegalMoves,
    move,
} from './move'

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
    a8, b8, c8, d8, e8, f8, g8, h8,
    a7, b7, c7, d7, e7, f7, g7, h7,
    a6, b6, c6, d6, e6, f6, g6, h6,
    a5, b5, c5, d5, e5, f5, g5, h5,
    a4, b4, c4, d4, e4, f4, g4, h4,
    a3, b3, c3, d3, e3, f3, g3, h3,
    a2, b2, c2, d2, e2, f2, g2, h2,
    a1, b1, c1, d1, e1, f1, g1, h1
} = SquareIndex
const {
    PIECE_POWER_COUNTDOWN,
    BOARD_POWER_COUNTDOWN,
} = CountType

describe('move', () => {
    describe('canThisColorAttackThisSquare', () => {
        // TODO
        const state = put(importFen(EMPTY_FEN), WHITE, BIA, c5)

        const tests = [
            {
                color: WHITE,
                piece: BIA,
                square: f5,
                canAttack: [e6, g6],
                cannotAttack: [f5, f6, e4, g4],
            },
            {
                color: BLACK,
                piece: BIA,
                square: f5,
                canAttack: [e4, g4],
                cannotAttack: [f5, f4, e6, g6],
            },
            {
                color: WHITE,
                piece: THON,
                square: f5,
                canAttack: [e6, f6, g6, e4, g4],
                cannotAttack: [e5, g5, f4],
            },
            {
                color: BLACK,
                piece: THON,
                square: f5,
                canAttack: [e4, f4, g4, e6, g6],
                cannotAttack: [e5, g5, f6],
            },

            {
                color: WHITE,
                piece: FLIPPED_BIA,
                square: f5,
                canAttack: [e6, g6, e4, g4],
                cannotAttack: [f6, e5, g5, f4],
            },
            {
                color: BLACK,
                piece: FLIPPED_BIA,
                square: f5,
                canAttack: [e6, g6, e4, g4],
                cannotAttack: [f6, e5, g5, f4],
            },
            {
                color: WHITE,
                piece: MET,
                square: f5,
                canAttack: [e6, g6, e4, g4],
                cannotAttack: [f6, e5, g5, f4],
            },
            {
                color: BLACK,
                piece: MET,
                square: f5,
                canAttack: [e6, g6, e4, g4],
                cannotAttack: [f6, e5, g5, f4],
            },

            {
                color: WHITE,
                piece: MA,
                square: f5,
                canAttack: [e7, g7, d6, h6, d4, h4, e3, g3],
                cannotAttack: [d7, f7, h7, e6, f6, g6, d5, e5, g5, h5, e4, f4, g4, d3, f3, h3],
            },
            {
                color: BLACK,
                piece: MA,
                square: f5,
                canAttack: [e7, g7, d6, h6, d4, h4, e3, g3],
                cannotAttack: [d7, f7, h7, e6, f6, g6, d5, e5, g5, h5, e4, f4, g4, d3, f3, h3],
            },

            {
                color: WHITE,
                piece: KHUN,
                square: f5,
                canAttack: [e6, f6, g6, e5, g5, e4, f4, g4],
                cannotAttack: [],
            },
            {
                color: BLACK,
                piece: KHUN,
                square: f5,
                canAttack: [e6, f6, g6, e5, g5, e4, f4, g4],
                cannotAttack: [],
            },

            {
                color: WHITE,
                piece: RUA,
                square: e4,
                canAttack: [e5, e6, e7, e8, f4, g4, h4, e3, e2, e1, d4, c4, b4, a4],
                cannotAttack: [],
            },
            {
                color: BLACK,
                piece: RUA,
                square: e4,
                canAttack: [e5, e6, e7, e8, f4, g4, h4, e3, e2, e1, d4, c4, b4, a4],
                cannotAttack: [],
            },
            {
                color: WHITE,
                piece: RUA,
                square: f5,
                canAttack: [f6, f7, f8, g5, h5, f4, f3, f2, f1, e5, d5, c5],
                cannotAttack: [b5, a5],
            },
            {
                color: BLACK,
                piece: RUA,
                square: f5,
                canAttack: [f6, f7, f8, g5, h5, f4, f3, f2, f1, e5, d5, c5],
                cannotAttack: [b5, a5],
            },
        ]

        test('can perform correctly', () => {
            for (const test of tests) {
                const {
                    color,
                    piece,
                    square,
                    canAttack,
                    cannotAttack,
                } = test

                const newState = put(state, color, piece, square)

                // const newState = pipe(
                //     put(state, color, piece, square),
                //     state => state
                // )(state)

                for (const square of canAttack) {
                    const result = canThisColorAttackThisSquare(newState.boardState, color, square)
                    if (result !== true) {
                        console.log('this test didn\'t pass', test)
                    }
                    expect(result).toBe(true)
                }
                for (const square of cannotAttack) {
                    const result = canThisColorAttackThisSquare(newState.boardState, color, square)
                    if (result !== false) {
                        console.log('this test didn\'t pass', test)
                    }
                    expect(result).toBe(false)
                }
            }

        })
    })
})