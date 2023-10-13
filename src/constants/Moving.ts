import {
    BLACK_BIA_SHIFT,
    BLACK_THON_SHIFT,
    FLIPPED_BIA_SHIFT,
    KHUN_SHIFT,
    MA_SHIFT,
    MET_SHIFT,
    RUA_SHIFT,
    WHITE_BIA_SHIFT,
    WHITE_THON_SHIFT,
} from "./Piece"


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


// @formatter:off
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
// @formatter:on

// @formatter:off
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
// @formatter:on


export const FLAGS = {
    NORMAL: "n",
    CAPTURE: "c",
    BIG_PAWN: "b",
    EP_CAPTURE: "e",
    PROMOTION: "p",
    KSIDE_CASTLE: "k",
    QSIDE_CASTLE: "q",
} as const

export const BITS = {
    NORMAL: 1, // 1 << 0,
    CAPTURE: 2, // 1 << 1,
    PROMOTION: 4, // 1 << 2,
} as const
