const {
    WHITE,
    BLACK,

    BIA,
    FLIPPED_BIA,
    MA,
    THON,
    MET,
    RUA,
    KHUN,

    INITIAL_FEN,

    BIA_MOVE_OFFSETS,
    BIA_ATTACK_OFFSETS,
    THON_MOVE_OFFSETS,
    THON_ATTACK_OFFSETS,
    PIECE_MOVE_OFFSETS,
    PIECE_ATTACK_OFFSETS,

    IS_SLIDING_PIECE,

    SQUARES,
    FIRST_SQUARE,
    LAST_SQUARE,

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
} = require('../src/constants')

const {
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
} = require('../src/utils')

const {
    extractInfoFromFen,
    getBoardStateFromBoardString,
    forEachPieceFromBoardState,
    getPiecePositions,
    forEachPiece,
    countPiece,
    evalulatePower,
    updatePiecePositionDictionary,
    importFen,
    exportFen
} = require('../src/state')




test('extractInfoFromFen (number of inputs should be 3 or 6)', () => {
    const validInputs = [
        'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 5 - - -',
        'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 5',
        '1 2 3 4 5 6',
        '1 2 3',
        '                    1    2      3 ',
        '   1 2      3        4      5   6        ',
    ]

    const invalidInputs = [
        'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 5 - -',
        'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w',
        '1',
        '1 2',
        '1 2 3 4',
        '1 2 3 4 5',
        '1 2 3 4 5 6 7',
        '1 2 3 4 5 6 7 8',
        '1      ',
        '       1 2',
        '1    2     3   4',
        '     1     2    3             4     5     ',
        '1         2  3 4        5 6 7                                 ',
        '               1  2 3         4 5     6 7 8',
    ]

    for (const validInput of validInputs) {
        expect(extractInfoFromFen(validInput)).not.toBeNull()
        expect(extractInfoFromFen(validInput)).toBeInstanceOf(Object)
        expect(extractInfoFromFen(validInput)).not.toBeInstanceOf(Array)
    }

    for (const invalidInput of invalidInputs) {
        expect(extractInfoFromFen(invalidInput)).toBeNull()
    }
})


test('getBoardStateFromBoardString', () => {
    const boardString = 'rmtektmr/8/bbfbbbbb/8/8/BBBBFBBB/8/RMTKETMR'
    const boardState = [
        [WHITE, RUA],
        [WHITE, MA],
        [WHITE, THON],
        [WHITE, KHUN],
        [WHITE, MET],
        [WHITE, THON],
        [WHITE, MA],
        [WHITE, RUA],
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,

        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,

        [WHITE, BIA],
        [WHITE, BIA],
        [WHITE, BIA],
        [WHITE, BIA],
        [WHITE, FLIPPED_BIA],
        [WHITE, BIA],
        [WHITE, BIA],
        [WHITE, BIA],
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,

        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,

        [BLACK, BIA],
        [BLACK, BIA],
        [BLACK, FLIPPED_BIA],
        [BLACK, BIA],
        [BLACK, BIA],
        [BLACK, BIA],
        [BLACK, BIA],
        [BLACK, BIA],
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,

        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,

        [BLACK, RUA],
        [BLACK, MA],
        [BLACK, THON],
        [BLACK, MET],
        [BLACK, KHUN],
        [BLACK, THON],
        [BLACK, MA],
        [BLACK, RUA],
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    ]

    expect(getBoardStateFromBoardString(boardString)).toEqual(boardState)
})


test('forEachPieceFromBoardState', () => {
    const boardState = [
        [WHITE, RUA],
        [WHITE, MA],
        [WHITE, THON],
        [WHITE, KHUN],
        [WHITE, MET],
        [WHITE, THON],
        [WHITE, MA],
        [WHITE, RUA],
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,

        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,

        [WHITE, BIA],
        [WHITE, BIA],
        [WHITE, BIA],
        [WHITE, BIA],
        [WHITE, BIA],
        [WHITE, BIA],
        [WHITE, BIA],
        [WHITE, BIA],
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,

        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,

        [BLACK, BIA],
        [BLACK, BIA],
        [BLACK, BIA],
        [BLACK, BIA],
        [BLACK, BIA],
        [BLACK, BIA],
        [BLACK, BIA],
        [BLACK, BIA],
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,

        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,

        [BLACK, RUA],
        [BLACK, MA],
        [BLACK, THON],
        [BLACK, MET],
        [BLACK, KHUN],
        [BLACK, THON],
        [BLACK, MA],
        [BLACK, RUA],
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    ]

    let num = 0
    const colorNum = {
        [WHITE]: 0,
        [BLACK]: 0
    }
    const pieceNum = {
        [BIA]: 0,
        [FLIPPED_BIA]: 0,
        [MA]: 0,
        [THON]: 0,
        [MET]: 0,
        [RUA]: 0,
        [KHUN]: 0
    }
    const colorPieceNum = {
        [WHITE]: {
            [BIA]: 0,
            [FLIPPED_BIA]: 0,
            [MA]: 0,
            [THON]: 0,
            [MET]: 0,
            [RUA]: 0,
            [KHUN]: 0
        },
        [BLACK]: {
            [BIA]: 0,
            [FLIPPED_BIA]: 0,
            [MA]: 0,
            [THON]: 0,
            [MET]: 0,
            [RUA]: 0,
            [KHUN]: 0
        }
    }

    forEachPieceFromBoardState(boardState, ([color, piece]) => {
        num++
        colorNum[color]++
        pieceNum[piece]++
        colorPieceNum[color][piece]++
    })

    expect(num).toBe(32)

    expect(colorNum[WHITE]).toBe(16)
    expect(colorNum[BLACK]).toBe(16)

    expect(pieceNum[BIA]).toBe(16)
    expect(pieceNum[FLIPPED_BIA]).toBe(0)
    expect(pieceNum[MA]).toBe(4)
    expect(pieceNum[THON]).toBe(4)
    expect(pieceNum[MET]).toBe(2)
    expect(pieceNum[RUA]).toBe(4)
    expect(pieceNum[KHUN]).toBe(2)

    expect(colorPieceNum[WHITE][BIA]).toBe(8)
    expect(colorPieceNum[WHITE][FLIPPED_BIA]).toBe(0)
    expect(colorPieceNum[WHITE][MA]).toBe(2)
    expect(colorPieceNum[WHITE][THON]).toBe(2)
    expect(colorPieceNum[WHITE][MET]).toBe(1)
    expect(colorPieceNum[WHITE][RUA]).toBe(2)
    expect(colorPieceNum[WHITE][KHUN]).toBe(1)

    expect(colorPieceNum[BLACK][BIA]).toBe(8)
    expect(colorPieceNum[BLACK][FLIPPED_BIA]).toBe(0)
    expect(colorPieceNum[BLACK][MA]).toBe(2)
    expect(colorPieceNum[BLACK][THON]).toBe(2)
    expect(colorPieceNum[BLACK][MET]).toBe(1)
    expect(colorPieceNum[BLACK][RUA]).toBe(2)
    expect(colorPieceNum[BLACK][KHUN]).toBe(1)
})


test('getPiecePositions', () => {
    const boardState = [
        [WHITE, RUA],
        [WHITE, MA],
        [WHITE, THON],
        [WHITE, KHUN],
        [WHITE, MET],
        [WHITE, THON],
        [WHITE, MA],
        [WHITE, RUA],
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,

        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,

        [WHITE, BIA],
        [WHITE, BIA],
        [WHITE, BIA],
        [WHITE, BIA],
        [WHITE, BIA],
        [WHITE, BIA],
        [WHITE, BIA],
        [WHITE, BIA],
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,

        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,

        [BLACK, BIA],
        [BLACK, BIA],
        [BLACK, BIA],
        [BLACK, BIA],
        [BLACK, BIA],
        [BLACK, BIA],
        [BLACK, BIA],
        [BLACK, BIA],
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,

        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,

        [BLACK, RUA],
        [BLACK, MA],
        [BLACK, THON],
        [BLACK, MET],
        [BLACK, KHUN],
        [BLACK, THON],
        [BLACK, MA],
        [BLACK, RUA],
        undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    ]

    const piecePositions = {
        [WHITE]: {
            [BIA]: [
                SQUARES.a3, SQUARES.b3, SQUARES.c3, SQUARES.d3,
                SQUARES.e3, SQUARES.f3, SQUARES.g3, SQUARES.h3
            ],
            [FLIPPED_BIA]: [],
            [MA]: [ SQUARES.b1, SQUARES.g1 ],
            [THON]: [ SQUARES.c1, SQUARES.f1 ],
            [MET]: [ SQUARES.e1 ],
            [RUA]: [ SQUARES.a1, SQUARES.h1 ],
            [KHUN]: [ SQUARES.d1 ]
        },
        [BLACK]: {
            [BIA]: [
                SQUARES.a6, SQUARES.b6, SQUARES.c6, SQUARES.d6,
                SQUARES.e6, SQUARES.f6, SQUARES.g6, SQUARES.h6
            ],
            [FLIPPED_BIA]: [],
            [MA]: [ SQUARES.b8, SQUARES.g8 ],
            [THON]: [ SQUARES.c8, SQUARES.f8 ],
            [MET]: [ SQUARES.d8 ],
            [RUA]: [ SQUARES.a8, SQUARES.h8 ],
            [KHUN]: [ SQUARES.e8 ]
        }
    }

    expect(getPiecePositions(boardState)).toEqual(piecePositions)
})


describe('forEachPiece', () => {
    const piecePositions = {
        [WHITE]: {
            [BIA]: [
                SQUARES.a3, SQUARES.b3, SQUARES.c3, SQUARES.d3,
                SQUARES.e3, SQUARES.f3, SQUARES.g3, SQUARES.h3
            ],
            [FLIPPED_BIA]: [],
            [MA]: [ SQUARES.b1, SQUARES.g1 ],
            [THON]: [ SQUARES.c1, SQUARES.f1 ],
            [MET]: [ SQUARES.e1 ],
            [RUA]: [ SQUARES.a1, SQUARES.h1 ],
            [KHUN]: [ SQUARES.d1 ]
        },
        [BLACK]: {
            [BIA]: [
                SQUARES.a6, SQUARES.b6, SQUARES.c6, SQUARES.d6,
                SQUARES.e6, SQUARES.f6, SQUARES.g6, SQUARES.h6
            ],
            [FLIPPED_BIA]: [],
            [MA]: [ SQUARES.b8, SQUARES.g8 ],
            [THON]: [ SQUARES.c8, SQUARES.f8 ],
            [MET]: [ SQUARES.d8 ],
            [RUA]: [ SQUARES.a8, SQUARES.h8 ],
            [KHUN]: [ SQUARES.e8 ]
        }
    }

    test('piece count must be the same', () => {
    
        let num = 0
        const colorNum = {
            [WHITE]: 0,
            [BLACK]: 0
        }
        const pieceNum = {
            [BIA]: 0,
            [FLIPPED_BIA]: 0,
            [MA]: 0,
            [THON]: 0,
            [MET]: 0,
            [RUA]: 0,
            [KHUN]: 0
        }
        const colorPieceNum = {
            [WHITE]: {
                [BIA]: 0,
                [FLIPPED_BIA]: 0,
                [MA]: 0,
                [THON]: 0,
                [MET]: 0,
                [RUA]: 0,
                [KHUN]: 0
            },
            [BLACK]: {
                [BIA]: 0,
                [FLIPPED_BIA]: 0,
                [MA]: 0,
                [THON]: 0,
                [MET]: 0,
                [RUA]: 0,
                [KHUN]: 0
            }
        }
    
        forEachPiece(piecePositions, (color, piece) => {
            num++
            colorNum[color]++
            pieceNum[piece]++
            colorPieceNum[color][piece]++
        })
    
        expect(num).toBe(32)
    
        expect(colorNum[WHITE]).toBe(16)
        expect(colorNum[BLACK]).toBe(16)
    
        expect(pieceNum[BIA]).toBe(16)
        expect(pieceNum[FLIPPED_BIA]).toBe(0)
        expect(pieceNum[MA]).toBe(4)
        expect(pieceNum[THON]).toBe(4)
        expect(pieceNum[MET]).toBe(2)
        expect(pieceNum[RUA]).toBe(4)
        expect(pieceNum[KHUN]).toBe(2)
    
        expect(colorPieceNum[WHITE][BIA]).toBe(8)
        expect(colorPieceNum[WHITE][FLIPPED_BIA]).toBe(0)
        expect(colorPieceNum[WHITE][MA]).toBe(2)
        expect(colorPieceNum[WHITE][THON]).toBe(2)
        expect(colorPieceNum[WHITE][MET]).toBe(1)
        expect(colorPieceNum[WHITE][RUA]).toBe(2)
        expect(colorPieceNum[WHITE][KHUN]).toBe(1)
    
        expect(colorPieceNum[BLACK][BIA]).toBe(8)
        expect(colorPieceNum[BLACK][FLIPPED_BIA]).toBe(0)
        expect(colorPieceNum[BLACK][MA]).toBe(2)
        expect(colorPieceNum[BLACK][THON]).toBe(2)
        expect(colorPieceNum[BLACK][MET]).toBe(1)
        expect(colorPieceNum[BLACK][RUA]).toBe(2)
        expect(colorPieceNum[BLACK][KHUN]).toBe(1)
    })


    test('piece position must be the same', () => {
        const newPiecePositions = {
            [WHITE]: {
                [BIA]: [],
                [FLIPPED_BIA]: [],
                [MA]: [],
                [THON]: [],
                [MET]: [],
                [RUA]: [],
                [KHUN]: []
            },
            [BLACK]: {
                [BIA]: [],
                [FLIPPED_BIA]: [],
                [MA]: [],
                [THON]: [],
                [MET]: [],
                [RUA]: [],
                [KHUN]: []
            }
        }

        forEachPiece(piecePositions, (color, piece, position) => {
            newPiecePositions[color][piece].push(position)
        })

        expect(newPiecePositions).toEqual(piecePositions)
    })
})