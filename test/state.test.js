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