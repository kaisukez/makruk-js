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
    const duplicate = obj instanceof Array ? [] : {}

    for (const property in obj) {
        if (typeof obj[property] === 'object') {
            duplicate[property] = clone(obj[property])
        } else {
            duplicate[property] = obj[property]
        }
    }

    return duplicate
}

module.exports = {
    swapColor,
    getAttackOffsets,
    getMoveOffsets,
    rank,
    file,
    algebraic,
    ascii,
    clone,
}