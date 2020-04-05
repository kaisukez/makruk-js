const WHITE = 'w'
const BLACK = 'b'



// https://www.chessprogramming.org/0x88
const SQUARES = {
    a8:   112, b8:   113, c8:   114, d8:   115, e8:   116, f8:   117, g8:   118, h8:   119,
    a7:    96, b7:    97, c7:    98, d7:    99, e7:   100, f7:   101, g7:   102, h7:   103,
    a6:    80, b6:    81, c6:    82, d6:    83, e6:    84, f6:    85, g6:    86, h6:    87,
    a5:    64, b5:    65, c5:    66, d5:    67, e5:    68, f5:    69, g5:    70, h5:    71,
    a4:    48, b4:    49, c4:    50, d4:    51, e4:    52, f4:    53, g4:    54, h4:    55,
    a3:    32, b3:    33, c3:    34, d3:    35, e3:    36, f3:    37, g3:    38, h3:    39,
    a2:    16, b2:    17, c2:    18, d2:    19, e2:    20, f2:    21, g2:    22, h2:    23,
    a1:     0, b1:     1, c1:     2, d1:     3, e1:     4, f1:     5, g1:     6, h1:     7
}
const FIRST_SQUARE = SQUARES.a1
const LAST_SQUARE = SQUARES.h8



// https://www.chessvariants.com/oriental.dir/thai.html
const BIA = 'b'
const FLIPPED_BIA = 'f'
const MA = 'm'
const THON = 't' // using THON instead of KHON to distinguish between 't' and 'k'
const MET = 'e' // using e because 'm' is already used for 'MA'
const RUA = 'r'
const KHUN = 'k'

const INITIAL_FEN = 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1'

const BIA_MOVE_OFFSETS = {
    [WHITE]: [16],
    [BLACK]: [-16]
}
const BIA_ATTACK_OFFSETS = {
    [WHITE]: [15, 17],
    [BLACK]: [-15, -17]
}

const THON_ATTACK_OFFSETS = {
    [WHITE]: [15, 16, 17, -15, -17],
    [BLACK]: [-15, -16, -17, 15, 17]
}
const THON_MOVE_OFFSETS = THON_ATTACK_OFFSETS

const PIECE_ATTACK_OFFSETS = {
    [FLIPPED_BIA]: [15, 17, -15, -17],
    [MA]: [-18, -33, -31, -14, 18, 33, 31, 14],
    [MET]: [15, 17, -15, -17],
    [RUA]: [16, 1, -16, -1],
    [KHUN]: [17, 16, 15, -1, 1, -17, -16, -15]
}
const PIECE_MOVE_OFFSETS = PIECE_ATTACK_OFFSETS

// use for offset sliding when generating moves
const IS_SLIDING_PIECE = {
    [RUA]: true
}


// http://bgsthai.com/2018/04/30/howtoplay/
const PIECE_POWER = {
    [BIA]: 1,
    [FLIPPED_BIA]: 1.7,
    [MA]: 3,
    [THON]: 2.6,
    [MET]: 1.7,
    [RUA]: 5,
    [KHUN]: 0,
}


const WHITE_BIA_SHIFT = 0
const BLACK_BIA_SHIFT = 1
const FLIPPED_BIA_SHIFT = 2
const MA_SHIFT = 3
const WHITE_THON_SHIFT = 4
const BLACK_THON_SHIFT = 5
const MET_SHIFT = 6
const RUA_SHIFT = 7
const KHUN_SHIFT = 8

const SHIFTS = {
    [WHITE]: {
        [BIA]: WHITE_BIA_SHIFT,
        [FLIPPED_BIA]: FLIPPED_BIA_SHIFT,
        [MA]: MA_SHIFT,
        [THON]: WHITE_THON_SHIFT,
        [MET]: MET_SHIFT,
        [RUA]: RUA_SHIFT,
        [KHUN]: KHUN_SHIFT,
    },
    [BLACK]: {
        [BIA]: BLACK_BIA_SHIFT,
        [FLIPPED_BIA]: FLIPPED_BIA_SHIFT,
        [MA]: MA_SHIFT,
        [THON]: BLACK_THON_SHIFT,
        [MET]: MET_SHIFT,
        [RUA]: RUA_SHIFT,
        [KHUN]: KHUN_SHIFT,
    }
}

const upLeft = // 373
    (1 << WHITE_BIA_SHIFT) +
    (1 << FLIPPED_BIA_SHIFT) +
    (1 << WHITE_THON_SHIFT) +
    (1 << BLACK_THON_SHIFT) +
    (1 << MET_SHIFT) +
    (1 << KHUN_SHIFT)

const upRight = upLeft // 373

const downLeft = // 374
    (1 << BLACK_BIA_SHIFT) +
    (1 << FLIPPED_BIA_SHIFT) +
    (1 << WHITE_THON_SHIFT) +
    (1 << BLACK_THON_SHIFT) +
    (1 << MET_SHIFT) +
    (1 << KHUN_SHIFT)

const downRight = downLeft // 374

const up = // 400
    (1 << WHITE_THON_SHIFT) +
    (1 << RUA_SHIFT) +
    (1 << KHUN_SHIFT)

const down = // 416
    (1 << BLACK_THON_SHIFT) +
    (1 << RUA_SHIFT) +
    (1 << KHUN_SHIFT)

const left = // 384
    (1 << RUA_SHIFT) +
    (1 << KHUN_SHIFT)

const right = left // 384

const onlyMaDirection = 1 << MA_SHIFT // 8
const onlyRuaDirection = 1 << RUA_SHIFT // 128



const RAYS = [
    17,    0,    0,    0,    0,    0,    0,   16,    0,    0,    0,    0,    0,    0,   15,    0,
     0,   17,    0,    0,    0,    0,    0,   16,    0,    0,    0,    0,    0,   15,    0,    0,
     0,    0,   17,    0,    0,    0,    0,   16,    0,    0,    0,    0,   15,    0,    0,    0,
     0,    0,    0,   17,    0,    0,    0,   16,    0,    0,    0,   15,    0,    0,    0,    0,
     0,    0,    0,    0,   17,    0,    0,   16,    0,    0,   15,    0,    0,    0,    0,    0,
     0,    0,    0,    0,    0,   17,    0,   16,    0,   15,    0,    0,    0,    0,    0,    0,
     0,    0,    0,    0,    0,    0,   17,   16,   15,    0,    0,    0,    0,    0,    0,    0,
     1,    1,    1,    1,    1,    1,    1,    0,   -1,   -1,   -1,   -1,   -1,   -1,   -1,    0,
     0,    0,    0,    0,    0,    0,  -15,  -16,  -17,    0,    0,    0,    0,    0,    0,    0,
     0,    0,    0,    0,    0,  -15,    0,  -16,    0,  -17,    0,    0,    0,    0,    0,    0,
     0,    0,    0,    0,  -15,    0,    0,  -16,    0,    0,  -17,    0,    0,    0,    0,    0,
     0,    0,    0,  -15,    0,    0,    0,  -16,    0,    0,    0,  -17,    0,    0,    0,    0,
     0,    0,  -15,    0,    0,    0,    0,  -16,    0,    0,    0,    0,  -17,    0,    0,    0,
     0,  -15,    0,    0,    0,    0,    0,  -16,    0,    0,    0,    0,    0,  -17,    0,    0,
   -15,    0,    0,    0,    0,    0,    0,  -16,    0,    0,    0,    0,    0,    0,  -17
]

const ATTACKS = [
      0,    0,    0,    0,    0,    0,    0,  128,    0,    0,    0,    0,    0,    0,    0,    0,
      0,    0,    0,    0,    0,    0,    0,  128,    0,    0,    0,    0,    0,    0,    0,    0,
      0,    0,    0,    0,    0,    0,    0,  128,    0,    0,    0,    0,    0,    0,    0,    0,
      0,    0,    0,    0,    0,    0,    0,  128,    0,    0,    0,    0,    0,    0,    0,    0,
      0,    0,    0,    0,    0,    0,    0,  128,    0,    0,    0,    0,    0,    0,    0,    0,
      0,    0,    0,    0,    0,    0,    8,  128,    8,    0,    0,    0,    0,    0,    0,    0,
      0,    0,    0,    0,    0,    8,  373,  400,  373,    8,    0,    0,    0,    0,    0,    0,
    128,  128,  128,  128,  128,  128,  384,    0,  384,  128,  128,  128,  128,  128,  128,    0,
      0,    0,    0,    0,    0,    8,  374,  416,  374,    8,    0,    0,    0,    0,    0,    0,
      0,    0,    0,    0,    0,    0,    8,  128,    8,    0,    0,    0,    0,    0,    0,    0,
      0,    0,    0,    0,    0,    0,    0,  128,    0,    0,    0,    0,    0,    0,    0,    0,
      0,    0,    0,    0,    0,    0,    0,  128,    0,    0,    0,    0,    0,    0,    0,    0,
      0,    0,    0,    0,    0,    0,    0,  128,    0,    0,    0,    0,    0,    0,    0,    0,
      0,    0,    0,    0,    0,    0,    0,  128,    0,    0,    0,    0,    0,    0,    0,    0,
      0,    0,    0,    0,    0,    0,    0,  128,    0,    0,    0,    0,    0,    0,    0   
]



const FLAGS = {
    NORMAL: 'n',
    CAPTURE: 'c',
    BIG_PAWN: 'b',
    EP_CAPTURE: 'e',
    PROMOTION: 'p',
    KSIDE_CASTLE: 'k',
    QSIDE_CASTLE: 'q'
}

const BITS = {
    NORMAL: 1, // 1 << 0,
    CAPTURE: 2, // 1 << 1,
    PROMOTION: 4 // 1 << 2,
}



const RANK_1 = 0
const RANK_2 = 1
const RANK_3 = 2
const RANK_4 = 3
const RANK_5 = 4
const RANK_6 = 5
const RANK_7 = 6
const RANK_8 = 7

const FILE_A = 0
const FILE_B = 1
const FILE_C = 2
const FILE_D = 3
const FILE_E = 4
const FILE_F = 5
const FILE_G = 6
const FILE_H = 7



const PIECE_POWER_COUNTDOWN = 'PIECE_POWER_COUNTDOWN'
const BOARD_POWER_COUNTDOWN = 'BOARD_POWER_COUNTDOWN'



module.exports = {
    WHITE,
    BLACK,

    SQUARES,
    FIRST_SQUARE,
    LAST_SQUARE,

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

    SHIFTS,
    RAYS,
    ATTACKS,

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
}
