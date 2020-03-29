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
} = require('./constants')


function swapColor(color) {
    return color === WHITE ? BLACK : WHITE
}

function getAttackOffsets(color, piece) {
    piece = piece.toLowerCase()

    if (piece === BIA) {
        return BIA_ATTACK_OFFSETS[color]
    }
    
    if (piece === THON) {
        return THON_ATTACK_OFFSETS[color]
    }

    return PIECE_ATTACK_OFFSETS[piece]
}


function getMoveOffsets(color, piece) {
    piece = piece.toLowerCase()

    if (piece === BIA) {
        return BIA_MOVE_OFFSETS[color]
    }
    
    if (piece === THON) {
        return THON_MOVE_OFFSETS[color]
    }

    return PIECE_MOVE_OFFSETS[piece]
}


function rank(index) {
    return index >> 4
}

function file(index) {
    return index & 7
}

function squareColor(index) {
    const _file = index & 1
    const _rank = (index & 16) >> 4

    const isWhite = _file ^ _rank
    
    return isWhite ? WHITE : BLACK
}

function algebraic(squareIndex) {
    const _file = file(squareIndex)
    const _rank = rank(squareIndex)

    return 'abcdefgh'[_file] + '12345678'[_rank]
}

function ascii(boardState) {
    const end = iterator => iterator === SQUARES.h1

    let s = '     +------------------------+\n'
    let i = SQUARES.a8

    while(true) {
        /* display the rank */
        if (file(i) === FILE_A) {
            s += ' ' + (parseInt(rank(i), 10) + 1) + ' |'
        }
        
        /* empty piece */
        if (boardState[i] == null || !(boardState[i].piece && boardState[i].color)) {
            s += ' . '
        } else {
            const piece = boardState[i].piece
            const color = boardState[i].color
            const symbol = color === WHITE ? piece.toUpperCase() : piece.toLowerCase()
            s += ' ' + symbol + ' '
        }

        if ((i + 1) & 0x88) {
            s += '|\n'
            if (end(i)) {
                break
            }
            i -= (SQUARES.h8 - SQUARES.a7)
        } else {
            i++
        }
    }
    s += '     +------------------------+\n'
    s += '     a  b  c  d  e  f  g  h\n'

    return s
}

function clone(obj) {
    // if (!obj) {
    //     return obj
    // }

    // let duplicate
    // if (Array.isArray(obj)) {
    //     duplicate = []
    // } else {
    //     duplicate = {}
    // }

    // for (const property in obj) {
    //     if (typeof obj[property] === 'object') {
    //         duplicate[property] = clone(obj[property])
    //     } else {
    //         duplicate[property] = obj[property]
    //     }
    // }

    // return duplicate

    return JSON.parse(JSON.stringify(obj))
}


// https://stackoverflow.com/a/728694/10154216
function clone(obj) {
    var copy

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj

    // Handle Set
    if (obj instanceof Set) {
        copy = new Set(obj)
        return copy
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = []
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i])
        }
        return copy
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {}
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr])
        }
        return copy
    }

    throw new Error("Unable to copy obj! Its type isn't supported.")
}

// https://gist.github.com/JamieMason/172460a36a0eaef24233e6edb2706f83
const compose = (...fns) =>
    (...args) => fns.reduceRight(
        (params, f) => Array.isArray(params) ? f(...params) : f(params),
        args
    )

const pipe = (...fns) =>
    (...args) => fns.reduce(
        (params, f) => Array.isArray(params) ? f(...params) : f(params),
        args
    )


module.exports = {
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
}