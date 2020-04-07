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

    PIECE_POWER,

    SQUARES,
    FIRST_SQUARE,
    LAST_SQUARE,

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

    PIECE_POWER_COUNTDOWN,
    BOARD_POWER_COUNTDOWN
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




describe('extractInfoFromFen', () => {
    test('number of inputs should be 3 or 6 only', () => {
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
})


describe('getBoardStateFromBoardString', () => {
    test('should transform board string to board state correctly', () => {
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
})


describe('forEachPieceFromBoardState', () => {
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

    test('number of iteration should equal to number of piece', () => {
        let num = 0

        forEachPieceFromBoardState(boardState, ([color, piece]) => {
            num++
        })

        expect(num).toBe(32)
    })

    test('piece count should be correct', () => {
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
            colorNum[color]++
            pieceNum[piece]++
            colorPieceNum[color][piece]++
        })
    
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
})


describe('getPiecePositions', () => {
    test('piecePositions should be correct', () => {
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


describe('countPiece', () => {
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

    const pieceCount = {
        all: 32,

        color: {
            [WHITE]: 16,
            [BLACK]: 16
        },
        piece: {
            [BIA]: 16,
            [FLIPPED_BIA]: 0,
            [MA]: 4,
            [THON]: 4,
            [MET]: 2,
            [RUA]: 4,
            [KHUN]: 2,
        },
        
        [WHITE]: {
            [BIA]: 8,
            [FLIPPED_BIA]: 0,
            [MA]: 2,
            [THON]: 2,
            [MET]: 1,
            [RUA]: 2,
            [KHUN]: 1,
        },
        [BLACK]: {
            [BIA]: 8,
            [FLIPPED_BIA]: 0,
            [MA]: 2,
            [THON]: 2,
            [MET]: 1,
            [RUA]: 2,
            [KHUN]: 1,
        }
    }

    test('should count piece correctly', () => {
        const pieceCountResult = countPiece(piecePositions)        
        expect(pieceCountResult).toEqual(pieceCount)
    })
})


describe('evalulatePower', () => {
    const pieceCount = {
        all: 32,

        color: {
            [WHITE]: 16,
            [BLACK]: 16
        },
        piece: {
            [BIA]: 16,
            [FLIPPED_BIA]: 0,
            [MA]: 4,
            [THON]: 4,
            [MET]: 2,
            [RUA]: 4,
            [KHUN]: 2,
        },
        
        [WHITE]: {
            [BIA]: 8,
            [FLIPPED_BIA]: 0,
            [MA]: 2,
            [THON]: 2,
            [MET]: 1,
            [RUA]: 2,
            [KHUN]: 1,
        },
        [BLACK]: {
            [BIA]: 8,
            [FLIPPED_BIA]: 0,
            [MA]: 2,
            [THON]: 2,
            [MET]: 1,
            [RUA]: 2,
            [KHUN]: 1,
        }
    }

    const expectedResult = {
        [WHITE]: 0,
        [BLACK]: 0
    }

    for (const piece in pieceCount[WHITE]) {
        expectedResult[WHITE] += pieceCount[WHITE][piece] * PIECE_POWER[piece]
    }

    for (const piece in pieceCount[BLACK]) {
        expectedResult[BLACK] += pieceCount[BLACK][piece] * PIECE_POWER[piece]
    }

    test('should evaluate power correctly', () => {
        expect(evalulatePower(pieceCount)).toEqual(expectedResult)
    })
})


describe('updatePiecePositionDictionary', () => {
    const piecePositions = {
        [WHITE]: {
            [BIA]: [ SQUARES.f5, SQUARES.g4 ],
            [FLIPPED_BIA]: [],
            [MA]: [],
            [THON]: [],
            [MET]: [],
            [RUA]: [],
            [KHUN]: [ SQUARES.d1 ]
        },
        [BLACK]: {
            [BIA]: [ SQUARES.e6, SQUARES.h5 ],
            [FLIPPED_BIA]: [],
            [MA]: [],
            [THON]: [],
            [MET]: [],
            [RUA]: [],
            [KHUN]: [ SQUARES.e8 ]
        }
    }

    test('should move correctly', () => {
        const moveObject = {
            piece: BIA,
            color: WHITE,
            from: SQUARES.g4,
            to: SQUARES.g5
        }
        const result = updatePiecePositionDictionary(piecePositions, moveObject)
        expect(result[WHITE][BIA].slice().sort()).toEqual([ SQUARES.f5, SQUARES.g5 ].sort())
    })

    test('should capture correctly', () => {
        const moveObject = {
            piece: BIA,
            color: BLACK,
            from: SQUARES.h5,
            to: SQUARES.g4,
            flags: BITS.CAPTURE,
            captured: BIA
        }
        const result = updatePiecePositionDictionary(piecePositions, moveObject)
        expect(result[BLACK][BIA].slice().sort()).toEqual([ SQUARES.e6, SQUARES.g4 ].sort())
        expect(result[WHITE][BIA].slice().sort()).toEqual([ SQUARES.f5 ].sort())
    })

    test('should promote correctly', () => {
        const moveObject = {
            piece: BIA,
            color: WHITE,
            from: SQUARES.f5,
            to: SQUARES.f6,
            flags: BITS.PROMOTION,
            promotion: FLIPPED_BIA
        }
        const result = updatePiecePositionDictionary(piecePositions, moveObject)
        expect(result[WHITE][BIA].slice().sort()).toEqual([ SQUARES.g4 ].sort())
        expect(result[WHITE][FLIPPED_BIA].slice().sort()).toEqual([ SQUARES.f6 ].sort())
    })

    test('should capture and promote at the same time correctly', () => {
        const moveObject = {
            piece: BIA,
            color: WHITE,
            from: SQUARES.f5,
            to: SQUARES.e6,
            flags: BITS.CAPTURE | BITS.PROMOTION,
            captured: BIA,
            promotion: FLIPPED_BIA
        }
        const result = updatePiecePositionDictionary(piecePositions, moveObject)
        expect(result[WHITE][BIA].slice().sort()).toEqual([ SQUARES.g4 ].sort())
        expect(result[WHITE][FLIPPED_BIA].slice().sort()).toEqual([ SQUARES.e6 ].sort())
        expect(result[BLACK][BIA].slice().sort()).toEqual([ SQUARES.h5 ].sort())
    })

    describe('should throw error if not enough input', () => {
        test('not enough color', () => {
            expect.assertions(3)
            try {
                updatePiecePositionDictionary(piecePositions, {
                    piece: BIA,
                    from: SQUARES.f5,
                    to: SQUARES.e6,
                })
            } catch (error) {
                expect(error.code).toBe('NOT_ENOUGH_INPUT')
                expect(error.requireMoreInput).toBeInstanceOf(Array)
                expect(error.requireMoreInput.slice().sort()).toEqual(['color'])
            }
        })
        
        test('not enough piece', () => {
            expect.assertions(3)
            try {
                updatePiecePositionDictionary(piecePositions, {
                    color: WHITE,
                    from: SQUARES.f5,
                    to: SQUARES.e6,
                })
            } catch (error) {
                expect(error.code).toBe('NOT_ENOUGH_INPUT')
                expect(error.requireMoreInput).toBeInstanceOf(Array)
                expect(error.requireMoreInput.slice().sort()).toEqual(['piece'])
            }
        })

        test('not enough from', () => {
            expect.assertions(3)
            try {
                updatePiecePositionDictionary(piecePositions, {
                    piece: BIA,
                    color: WHITE,
                    to: SQUARES.e6,
                })
            } catch (error) {
                expect(error.code).toBe('NOT_ENOUGH_INPUT')
                expect(error.requireMoreInput).toBeInstanceOf(Array)
                expect(error.requireMoreInput.slice().sort()).toEqual(['from'])
            }
        })

        test('not enough to', () => {
            expect.assertions(3)
            try {
                updatePiecePositionDictionary(piecePositions, {
                    piece: BIA,
                    color: WHITE,
                    from: SQUARES.f5,
                })
            } catch (error) {
                expect(error.code).toBe('NOT_ENOUGH_INPUT')
                expect(error.requireMoreInput).toBeInstanceOf(Array)
                expect(error.requireMoreInput.slice().sort()).toEqual(['to'])
            }
        })

        test('not enough everything', () => {
            expect.assertions(3)
            try {
                updatePiecePositionDictionary(piecePositions, {})
            } catch (error) {
                expect(error.code).toBe('NOT_ENOUGH_INPUT')
                expect(error.requireMoreInput).toBeInstanceOf(Array)
                expect(error.requireMoreInput.slice().sort()).toEqual(['color', 'piece', 'from', 'to'].sort())
            }
        })

        test("if there's promotion flag then throw error if no 'promotion' exists in moveObject", () => {
            expect.assertions(3)
            try {
                updatePiecePositionDictionary(piecePositions, {
                    piece: BIA,
                    color: WHITE,
                    from: SQUARES.f5,
                    to: SQUARES.e6,
                    flags: BITS.PROMOTION,
                })
            } catch (error) {
                expect(error.code).toBe('NOT_ENOUGH_INPUT')
                expect(error.requireMoreInput).toBeInstanceOf(Array)
                expect(error.requireMoreInput.slice().sort()).toEqual(['promotion'].sort())
            }
        })

        test("if there's capture flag then throw error if no 'captured' exists in moveObject", () => {
            expect.assertions(3)
            try {
                updatePiecePositionDictionary(piecePositions, {
                    piece: BIA,
                    color: WHITE,
                    from: SQUARES.f5,
                    to: SQUARES.e6,
                    flags: BITS.CAPTURE,
                })
            } catch (error) {
                expect(error.code).toBe('NOT_ENOUGH_INPUT')
                expect(error.requireMoreInput).toBeInstanceOf(Array)
                expect(error.requireMoreInput.slice().sort()).toEqual(['captured'].sort())
            }
        })
    })
})


describe('import export fen', () => {
    const fen = 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1'
    const state = {
        boardState: [
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
        ],
        activeColor: WHITE,
        moveNumber: 1,
        history: [],
        future: [],
        countdownHistory: [],
        countdown: null,
        piecePositions: {
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
    }

    test('should import fen to state correctly', () => {
        const stateResult = importFen(fen)
        expect(stateResult).toEqual(state)
    })

    test('should export state to fen correctly', () => {
        const fenResult = exportFen(state)
        expect(fenResult).toBe(fen)
    })

    // TODO: test import/export fen with countdown

    test('should throw error when import fen', () => {
        const tests = [
            {
                fen: null,
                errorCode: 'WRONG_INPUT_TYPE', 
            },
            {
                fen: undefined,
                errorCode: 'WRONG_INPUT_TYPE', 
            },
            {
                fen: {},
                errorCode: 'WRONG_INPUT_TYPE', 
            },
            {
                fen: [],
                errorCode: 'WRONG_INPUT_TYPE', 
            },
            {
                fen: new String('rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1'),
                errorCode: 'WRONG_INPUT_TYPE', 
            },
            {
                fen: 123,
                errorCode: 'WRONG_INPUT_TYPE', 
            },
            {
                fen: new Number('123'),
                errorCode: 'WRONG_INPUT_TYPE', 
            },
            {
                fen: new Set([1, 2, 3]),
                errorCode: 'WRONG_INPUT_TYPE', 
            },



            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 -',
                errorCode: 'WRONG_NUMBER_OF_INPUTS',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 - -',
                errorCode: 'WRONG_NUMBER_OF_INPUTS',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 - - - -',
                errorCode: 'WRONG_NUMBER_OF_INPUTS',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 - - - - -',
                errorCode: 'WRONG_NUMBER_OF_INPUTS',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w',
                errorCode: 'WRONG_NUMBER_OF_INPUTS',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR',
                errorCode: 'WRONG_NUMBER_OF_INPUTS',
            },
            {
                fen: '- rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 -',
                errorCode: 'WRONG_NUMBER_OF_INPUTS',
            },
            {
                fen: '- - rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1',
                errorCode: 'WRONG_NUMBER_OF_INPUTS',
            },



            {
                fen: 'ratektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1',
                errorCode: 'WRONG_BOARD_STRING_CHARACTER',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BPBBBBBB/8/RMTKETMR w 1',
                errorCode: 'WRONG_BOARD_STRING_CHARACTER',
            },
            {
                fen: 'rmtektmd/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1',
                errorCode: 'WRONG_BOARD_STRING_CHARACTER',
            },
            {
                fen: 'rmtektmg/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 - - -',
                errorCode: 'WRONG_BOARD_STRING_CHARACTER',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/-BBBBBBB/8/RMTKETMR w 1 - - -',
                errorCode: 'WRONG_BOARD_STRING_CHARACTER',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/+BBBBBBB/8/RMTKETMR w 1 - - -',
                errorCode: 'WRONG_BOARD_STRING_CHARACTER',
            },


            
            {
                fen: 'rmtektmr w 1',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_OF_RANKS',
            },
            {
                fen: 'rmtektmr/8 w 1',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_OF_RANKS',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb w 1',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_OF_RANKS',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8 w 1',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_OF_RANKS',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8 w 1 - - -',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_OF_RANKS',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB w 1 - - -',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_OF_RANKS',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8 w 1 - - -',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_OF_RANKS',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR/8 w 1 - - -',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_OF_RANKS',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR/8/bbbbbbbb w 1 - - -',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_OF_RANKS',
            },



            {
                fen: 'rmtektmr/53/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 - - -',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_NEXT_TO_EACH_OTHER',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/71/8/BBBBBBBB/8/RMTKETMR w 1 - - -',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_NEXT_TO_EACH_OTHER',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/26/BBBBBBBB/8/RMTKETMR w 1 - - -',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_NEXT_TO_EACH_OTHER',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/44/RMTKETMR w 1 - - -',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_NEXT_TO_EACH_OTHER',
            },



            {
                fen: 'rmte/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_OF_SQUARES',
            },
            {
                fen: 'rmtektmr/5/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_OF_SQUARES',
            },
            {
                fen: 'rmtektmr/8/bbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_OF_SQUARES',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/7/8/BBBBBBBB/8/RMTKETMR w 1',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_OF_SQUARES',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/7/BBBBBBBB/8/RMTKETMR w 1',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_OF_SQUARES',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBB/8/RMTKETMR w 1',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_OF_SQUARES',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/5/RMTKETMR w 1',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_OF_SQUARES',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/MR w 1',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_OF_SQUARES',
            },


            
            {
                fen: 'rmtektmr/7/bbbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_OF_SQUARES_PER_RANK',
            },
            {
                fen: 'r/8mtektmr/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_OF_SQUARES_PER_RANK',
            },
            {
                fen: 'rmtektmr7bbbbbbb7BBBBBBB7RMTK7TMR/1/b/1/1/B/1/E w 1',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_OF_SQUARES_PER_RANK',
            },



            {
                fen: 'rmtektmk/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_OF_KHUNS',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/KMTKETMR w 1',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_OF_KHUNS',
            },
            {
                fen: 'rmtertmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_OF_KHUNS',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTRETMR w 1',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_OF_KHUNS',
            },
            {
                fen: 'rmtertmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTRETMR w 1',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_OF_KHUNS',
            },
            {
                fen: 'rmtekkmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKKTMR w 1',
                errorCode: 'WRONG_BOARD_STRING_NUMBER_OF_KHUNS',
            },



            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR W 1 - - -',
                errorCode: 'WRONG_ACTIVE_COLOR',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR B 1',
                errorCode: 'WRONG_ACTIVE_COLOR',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR WHITE 1 - - -',
                errorCode: 'WRONG_ACTIVE_COLOR',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR BLACK 1',
                errorCode: 'WRONG_ACTIVE_COLOR',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR white 1 - - -',
                errorCode: 'WRONG_ACTIVE_COLOR',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR black 1',
                errorCode: 'WRONG_ACTIVE_COLOR',
            },



            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 01',
                errorCode: 'WRONG_MOVE_NUMBER',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 0',
                errorCode: 'WRONG_MOVE_NUMBER',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w +1',
                errorCode: 'WRONG_MOVE_NUMBER',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w -1',
                errorCode: 'WRONG_MOVE_NUMBER',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 0x88',
                errorCode: 'WRONG_MOVE_NUMBER',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w white',
                errorCode: 'WRONG_MOVE_NUMBER',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w b',
                errorCode: 'WRONG_MOVE_NUMBER',
            },



            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 b - -',
                errorCode: 'WRONG_COUNTDOWN',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 - bp -',
                errorCode: 'WRONG_COUNTDOWN',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 - - 5',
                errorCode: 'WRONG_COUNTDOWN',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 b pp -',
                errorCode: 'WRONG_COUNTDOWN',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 b - 6',
                errorCode: 'WRONG_COUNTDOWN',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 - bp 6',
                errorCode: 'WRONG_COUNTDOWN',
            },



            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 white bp 6',
                errorCode: 'WRONG_COUNT_COLOR',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 black bp 6',
                errorCode: 'WRONG_COUNT_COLOR',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 W bp 6',
                errorCode: 'WRONG_COUNT_COLOR',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 B bp 6',
                errorCode: 'WRONG_COUNT_COLOR',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 + bp 6',
                errorCode: 'WRONG_COUNT_COLOR',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 / bp 6',
                errorCode: 'WRONG_COUNT_COLOR',
            },



            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 w pb 6',
                errorCode: 'WRONG_COUNT_TYPE',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 w bb 6',
                errorCode: 'WRONG_COUNT_TYPE',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 w 5 6',
                errorCode: 'WRONG_COUNT_TYPE',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 w b 6',
                errorCode: 'WRONG_COUNT_TYPE',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 w p 6',
                errorCode: 'WRONG_COUNT_TYPE',
            },



            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 w pp 06',
                errorCode: 'WRONG_COUNT_NUMBER',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 w pp 0',
                errorCode: 'WRONG_COUNT_NUMBER',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 w pp +6',
                errorCode: 'WRONG_COUNT_NUMBER',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 w bp -6',
                errorCode: 'WRONG_COUNT_NUMBER',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 w bp 0x88',
                errorCode: 'WRONG_COUNT_NUMBER',
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 w pp w',
                errorCode: 'WRONG_COUNT_NUMBER',
            },
        ]

        expect.assertions(tests.length)
    
        for (const test of tests) {
            try {
                importFen(test.fen)
                console.log('this input didn\'t throw error', test)
            } catch (error) {
                expect(error.code).toBe(test.errorCode)
                if (!error.hasOwnProperty('code')) {
                    console.log(error)
                }
            }
        }
    })


    test('should import fen with countdown correctly', () => {
        const tests = [
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 w bp 3',
                result: {
                    countColor: WHITE,
                    countType: BOARD_POWER_COUNTDOWN,
                    count: 3,
                }
            },
            {
                fen: 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1 b pp 33',
                result: {
                    countColor: BLACK,
                    countType: PIECE_POWER_COUNTDOWN,
                    count: 33,
                }
            },
        ]

        for (const test of tests) {
            const result = importFen(test.fen)
            expect(result.countdown).toEqual(test.result)
        }
    })


    test('should export state to fen with countdown correctly', () => {
        const newState = clone(state)

        newState.countdown = {
            countColor: BLACK,
            countType: BOARD_POWER_COUNTDOWN,
            count: 11
        }
        expect(exportFen(newState).split(' ').slice(3).join(' ')).toBe('b bp 11')

        newState.countdown = {
            countColor: WHITE,
            countType: PIECE_POWER_COUNTDOWN,
            count: 29
        }
        expect(exportFen(newState).split(' ').slice(3).join(' ')).toBe('w pp 29')

        newState.countdown = null
        expect(exportFen(newState).split(' ').length).toBe(3)
    })
})