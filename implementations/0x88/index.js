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

    DEFAULT_STATE_STRING,

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
} = require('./constants')


const {
    swapColor,
    getAttackOffsets,
    getMoveOffsets,
    rank,
    file,
    algebraic,
    ascii,
} = require('./utils')

const {
    move,
} = require('./move')


const getInfoFromStateString = stateString => {
    const regex = /^(?<boardString>\S+)\s+(?<activeColor>[wb])\s+(?<fullMove>\d+)$/
    const result = stateString.match(regex)

    if (!result) {
        return null
    }

    result.groups.fullMove = parseInt(result.groups.fullMove, 10)

    return result.groups
}

function getBoardStateFromBoardString(boardString) {
    const boardState = Array(128)
    let i = 0
    for (const symbol of boardString.split('').reverse().join('')) {
        if (/[bfmterk]/.test(symbol)) {
            boardState[i] = {
                piece: symbol,
                color: BLACK
            }
            i++
        } else if (/[BFMTERK]/.test(symbol)) {
            boardState[i] = {
                piece: symbol,
                color: WHITE
            }
            i++
        } else if (/\d/.test(symbol)) {
            i += parseInt(symbol, 10)
        } else if (symbol === '/') {
            i += 8
        }
    }

    return boardState
}


const getStateFromStateString = stateString => {
    const boardInfo = getInfoFromStateString(stateString)
    
    boardInfo.boardState = getBoardStateFromBoardString(boardInfo.boardString)
    delete boardInfo.boardString

    return boardInfo
}


// const info = getInfoFromStateString(DEFAULT_STATE_STRING)
// const boardState = getBoardStateFromBoardString(info.boardString)
// console.log(boardState)

const state = getStateFromStateString(DEFAULT_STATE_STRING)
// console.log(state)
// const allMoves = generateAllMoves(state)
// console.log(allMoves)

// console.log(generateMovesForOneSquare(state.boardState, SQUARES.e3))
// console.log(generateMoves(state.boardState))

console.log(ascii(state.boardState))

// const newBoardState = changePiecePosition(state.boardState, SQUARES.e3, SQUARES.e4)
// // console.log(newBoardState)
// console.log(ascii(newBoardState))


// console.log(extract0x88Move({ notation: 're2' }))
// console.log('ญ7=F≠'.match(sanRegex))
// console.log(move_from_san(state.boardState, 'Me2'))

console.log(move(state, 'e4'))
console.log(move(state, 'Tf2'))
console.log(move(state, { from: 'e3', to: 'e7' }))