// export const Color = {
//     WHITE: 'w',
//     BLACK: 'b',
// } as const
export enum Color {
    WHITE = 'w',
    BLACK = 'b',
}


// https://www.chessprogramming.org/0x88
// export const SquareIndex = {
//     a8:   112, b8:   113, c8:   114, d8:   115, e8:   116, f8:   117, g8:   118, h8:   119,
//     a7:    96, b7:    97, c7:    98, d7:    99, e7:   100, f7:   101, g7:   102, h7:   103,
//     a6:    80, b6:    81, c6:    82, d6:    83, e6:    84, f6:    85, g6:    86, h6:    87,
//     a5:    64, b5:    65, c5:    66, d5:    67, e5:    68, f5:    69, g5:    70, h5:    71,
//     a4:    48, b4:    49, c4:    50, d4:    51, e4:    52, f4:    53, g4:    54, h4:    55,
//     a3:    32, b3:    33, c3:    34, d3:    35, e3:    36, f3:    37, g3:    38, h3:    39,
//     a2:    16, b2:    17, c2:    18, d2:    19, e2:    20, f2:    21, g2:    22, h2:    23,
//     a1:     0, b1:     1, c1:     2, d1:     3, e1:     4, f1:     5, g1:     6, h1:     7
// } as const
export enum SquareIndex {
    a8 = 112, b8 = 113, c8 = 114, d8 = 115, e8 = 116, f8 = 117, g8 = 118, h8 = 119,
    a7 =  96, b7 =  97, c7 =  98, d7 =  99, e7 = 100, f7 = 101, g7 = 102, h7 = 103,
    a6 =  80, b6 =  81, c6 =  82, d6 =  83, e6 =  84, f6 =  85, g6 =  86, h6 =  87,
    a5 =  64, b5 =  65, c5 =  66, d5 =  67, e5 =  68, f5 =  69, g5 =  70, h5 =  71,
    a4 =  48, b4 =  49, c4 =  50, d4 =  51, e4 =  52, f4 =  53, g4 =  54, h4 =  55,
    a3 =  32, b3 =  33, c3 =  34, d3 =  35, e3 =  36, f3 =  37, g3 =  38, h3 =  39,
    a2 =  16, b2 =  17, c2 =  18, d2 =  19, e2 =  20, f2 =  21, g2 =  22, h2 =  23,
    a1 =   0, b1 =   1, c1 =   2, d1 =   3, e1 =   4, f1 =   5, g1 =   6, h1 =   7,
}



// https://www.chessvariants.com/oriental.dir/thai.html
// export const Piece = {
//     BIA: 'b',
//     FLIPPED_BIA: 'f',
//     MA: 'm',
//     THON: 't', // using THON instead of KHON to distinguish between 't' and 'k'
//     MET: 'e', // using e because 'm' is already used for 'MA'
//     RUA: 'r',
//     KHUN: 'k',
// } as const
export enum Piece {
    BIA = 'b',
    FLIPPED_BIA = 'f',
    MA = 'm',
    THON = 't', // using THON instead of KHON to distinguish between 't' and 'k'
    MET = 'e', // using e because 'm' is already used for 'MA'
    RUA = 'r',
    KHUN = 'k',
}

export const INITIAL_FEN = 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 1'
export const EMPTY_FEN = 'k7/8/8/8/8/8/8/7K w 1'

export const BIA_MOVE_OFFSETS = {
    [Color.WHITE]: [16],
    [Color.BLACK]: [-16]
} as const
export const BIA_ATTACK_OFFSETS = {
    [Color.WHITE]: [15, 17],
    [Color.BLACK]: [-15, -17]
} as const

export const THON_ATTACK_OFFSETS = {
    [Color.WHITE]: [15, 16, 17, -15, -17],
    [Color.BLACK]: [-15, -16, -17, 15, 17]
} as const
export const THON_MOVE_OFFSETS = THON_ATTACK_OFFSETS

export const PIECE_ATTACK_OFFSETS = {
    [Piece.FLIPPED_BIA]: [15, 17, -15, -17],
    [Piece.MA]: [-18, -33, -31, -14, 18, 33, 31, 14],
    [Piece.MET]: [15, 17, -15, -17],
    [Piece.RUA]: [16, 1, -16, -1],
    [Piece.KHUN]: [17, 16, 15, -1, 1, -17, -16, -15]
} as const
export const PIECE_MOVE_OFFSETS = PIECE_ATTACK_OFFSETS

// use for offset sliding when generating moves
export const IS_SLIDING_PIECE = {
    [Piece.BIA]: false,
    [Piece.FLIPPED_BIA]: false,
    [Piece.MA]: false,
    [Piece.THON]: false,
    [Piece.MET]: false,
    [Piece.RUA]: true,
    [Piece.KHUN]: false,
} as const


// http://bgsthai.com/2018/04/30/howtoplay/
export const PIECE_POWER = {
    [Piece.BIA]: 1,
    [Piece.FLIPPED_BIA]: 1.7,
    [Piece.MA]: 3,
    [Piece.THON]: 2.6,
    [Piece.MET]: 1.7,
    [Piece.RUA]: 5,
    [Piece.KHUN]: 0,
} as const


export const WHITE_BIA_SHIFT = 0
export const BLACK_BIA_SHIFT = 1
export const FLIPPED_BIA_SHIFT = 2
export const MA_SHIFT = 3
export const WHITE_THON_SHIFT = 4
export const BLACK_THON_SHIFT = 5
export const MET_SHIFT = 6
export const RUA_SHIFT = 7
export const KHUN_SHIFT = 8

export const SHIFTS = {
    [Color.WHITE]: {
        [Piece.BIA]: WHITE_BIA_SHIFT,
        [Piece.FLIPPED_BIA]: FLIPPED_BIA_SHIFT,
        [Piece.MA]: MA_SHIFT,
        [Piece.THON]: WHITE_THON_SHIFT,
        [Piece.MET]: MET_SHIFT,
        [Piece.RUA]: RUA_SHIFT,
        [Piece.KHUN]: KHUN_SHIFT,
    },
    [Color.BLACK]: {
        [Piece.BIA]: BLACK_BIA_SHIFT,
        [Piece.FLIPPED_BIA]: FLIPPED_BIA_SHIFT,
        [Piece.MA]: MA_SHIFT,
        [Piece.THON]: BLACK_THON_SHIFT,
        [Piece.MET]: MET_SHIFT,
        [Piece.RUA]: RUA_SHIFT,
        [Piece.KHUN]: KHUN_SHIFT,
    }
} as const

export const upLeft = // 373
    (1 << WHITE_BIA_SHIFT) +
    (1 << FLIPPED_BIA_SHIFT) +
    (1 << WHITE_THON_SHIFT) +
    (1 << BLACK_THON_SHIFT) +
    (1 << MET_SHIFT) +
    (1 << KHUN_SHIFT)

export const upRight = upLeft // 373

export const downLeft = // 374
    (1 << BLACK_BIA_SHIFT) +
    (1 << FLIPPED_BIA_SHIFT) +
    (1 << WHITE_THON_SHIFT) +
    (1 << BLACK_THON_SHIFT) +
    (1 << MET_SHIFT) +
    (1 << KHUN_SHIFT)

export const downRight = downLeft // 374

export const up = // 400
    (1 << WHITE_THON_SHIFT) +
    (1 << RUA_SHIFT) +
    (1 << KHUN_SHIFT)

export const down = // 416
    (1 << BLACK_THON_SHIFT) +
    (1 << RUA_SHIFT) +
    (1 << KHUN_SHIFT)

export const left = // 384
    (1 << RUA_SHIFT) +
    (1 << KHUN_SHIFT)

export const right = left // 384

export const onlyMaDirection = 1 << MA_SHIFT // 8
export const onlyRuaDirection = 1 << RUA_SHIFT // 128



export const RAYS = [
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

export const ATTACKS = [
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



export const FLAGS = {
    NORMAL: 'n',
    CAPTURE: 'c',
    BIG_PAWN: 'b',
    EP_CAPTURE: 'e',
    PROMOTION: 'p',
    KSIDE_CASTLE: 'k',
    QSIDE_CASTLE: 'q'
} as const

export const BITS = {
    NORMAL: 1, // 1 << 0,
    CAPTURE: 2, // 1 << 1,
    PROMOTION: 4 // 1 << 2,
} as const



export const RANK_1 = 0
export const RANK_2 = 1
export const RANK_3 = 2
export const RANK_4 = 3
export const RANK_5 = 4
export const RANK_6 = 5
export const RANK_7 = 6
export const RANK_8 = 7

export const FILE_A = 0
export const FILE_B = 1
export const FILE_C = 2
export const FILE_D = 3
export const FILE_E = 4
export const FILE_F = 5
export const FILE_G = 6
export const FILE_H = 7


export enum CountType {
    PIECE_POWER_COUNTDOWN = 'pp',
    BOARD_POWER_COUNTDOWN = 'bp',
}