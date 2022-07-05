import {
    Color,
    Piece,
    // BIA,
    // FLIPPED_BIA,
    // MA,
    // THON,
    // MET,
    // RUA,
    // KHUN,

    INITIAL_FEN,

    BIA_MOVE_OFFSETS,
    BIA_ATTACK_OFFSETS,
    THON_MOVE_OFFSETS,
    THON_ATTACK_OFFSETS,
    PIECE_MOVE_OFFSETS,
    PIECE_ATTACK_OFFSETS,

    IS_SLIDING_PIECE,

    SquareIndex,

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
} from './constants'
import { State } from './types'


export function swapColor(color: Color) {
    return color === Color.WHITE ? Color.BLACK : Color.WHITE
}

export function getAttackOffsets(color: Color, piece: Piece) {
    // piece = piece.toLowerCase()

    if (piece === Piece.BIA) {
        return BIA_ATTACK_OFFSETS[color]
    }
    
    if (piece === Piece.THON) {
        return THON_ATTACK_OFFSETS[color]
    }

    return PIECE_ATTACK_OFFSETS[piece]
}


export function getMoveOffsets(color: Color, piece: Piece) {
    // piece = piece.toLowerCase()

    if (piece === Piece.BIA) {
        return BIA_MOVE_OFFSETS[color]
    }
    
    if (piece === Piece.THON) {
        return THON_MOVE_OFFSETS[color]
    }

    return PIECE_MOVE_OFFSETS[piece]
}


export function rank(square: SquareIndex) {
    return square >> 4
}

export function file(square: SquareIndex) {
    return square & 15
}

export function squareColor(square: SquareIndex) {
    const _file = square & 1
    const _rank = (square & 16) >> 4

    const isWhite = _file ^ _rank
    
    return isWhite ? Color.WHITE : Color.BLACK
}

export type AlgebraicOptions = {
    thai?: boolean
}
export function algebraic(square: SquareIndex, optional: AlgebraicOptions={}) {
    const { thai } = optional
    
    const _file = file(square)
    const _rank = rank(square)

    let fileSymbols = 'abcdefgh'
    let rankSymbols = '12345678'
    if (thai) {
        fileSymbols = 'กขคงจฉชญ'
    }

    return fileSymbols[_file] + rankSymbols[_rank]
}

export function ascii(boardState: State['boardState']) {
    const end = (iterator: number) => iterator === SquareIndex.h1

    let s = '     +------------------------+\n'
    let i = SquareIndex.a8

    if (!boardState) {
        throw { code: 'NO_BOARD_STATE' }
    }

    while(true) {
        /* display the rank */
        if (file(i) === FILE_A) {
            // s += ' ' + (parseInt(rank(i), 10) + 1) + ' |'
            s += ' ' + (rank(i) + 1) + ' |'
        }
        
        /* empty piece */
        // if (boardState[i] == null || !(boardState[i].piece && boardState[i].color)) {
        const squareData = boardState[i]
        if (!squareData) {
            s += ' . '
        } else {
            // const piece = squareData.piece
            // const color = squareData.color
            const [color, piece] = squareData
            const symbol = color === Color.WHITE ? piece.toUpperCase() : piece.toLowerCase()
            s += ' ' + symbol + ' '
        }

        if ((i + 1) & 0x88) {
            s += '|\n'
            if (end(i)) {
                break
            }
            i -= (SquareIndex.h8 - SquareIndex.a7)
        } else {
            i++
        }
    }
    s += '     +------------------------+\n'
    s += '     a  b  c  d  e  f  g  h\n'

    return s
}

// export function clone(obj) {
//     // if (!obj) {
//     //     return obj
//     // }

//     // let duplicate
//     // if (Array.isArray(obj)) {
//     //     duplicate = []
//     // } else {
//     //     duplicate = {}
//     // }

//     // for (const property in obj) {
//     //     if (typeof obj[property] === 'object') {
//     //         duplicate[property] = clone(obj[property])
//     //     } else {
//     //         duplicate[property] = obj[property]
//     //     }
//     // }

//     // return duplicate

//     return JSON.parse(JSON.stringify(obj))
// }

// export function cloneArray<T>(array: T[]): T[] {
//     const copied: T[] = []
//     for (let i = 0, len = array.length; i < len; i++) {
//         copied[i] = clone(array[i])
//     }
//     return copied
// }

// https://stackoverflow.com/a/728694/10154216
export function clone<T extends Object>(obj: T): T {
    let copy: any

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) {
        return obj
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = []
        for (let i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i])
        }
        return copy
        // return <T> <unknown> cloneArray(obj)
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {}
        for (const attr in obj) {
            if (obj.hasOwnProperty(attr)) {
                copy[attr] = clone(obj[attr])
            }
        }
        return copy
    }

    // throw new Error("Unable to copy obj! Its type isn't supported.")
    throw { code: 'OBJECT_TYPE_IS_NOT_SUPPORTED' }
}

// https://developer.mozilla.org/en-US/docs/Web/API/structuredClone
// export function clone<T extends Object>(obj: T): T {
//     return structuredClone(obj)
// }

// https://gist.github.com/JamieMason/172460a36a0eaef24233e6edb2706f83
export const compose = (...fns: Function[]) =>
    (...args: any) => fns.reduceRight(
        (params, f) => Array.isArray(params) ? f(...params) : f(params),
        args
    )

export const pipe = (...fns: Function[]) =>
    (...args: any) => fns.reduce(
        (params, f) => Array.isArray(params) ? f(...params) : f(params),
        args
    )


// module.exports = {
//     swapColor,
//     getAttackOffsets,
//     getMoveOffsets,
//     rank,
//     file,
//     squareColor,
//     algebraic,
//     ascii,
//     clone,
//     compose,
//     pipe
// }