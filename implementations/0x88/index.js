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

const {
    canThisColorAttackThisSquare
} = require('./moveValidation')


const getInfoFromStateString = stateString => {
    const regex = /^(?<boardString>\S+)\s+(?<activeColor>[wb])\s+(?<fullMove>\d+)$/
    const result = stateString.match(regex)

    if (!result) {
        return null
    }

    result.groups.fullMove = parseInt(result.groups.fullMove, 10)

    return result.groups
}

const getBoardStateFromBoardString = boardString => {
    const boardState = Array(128)
    let i = 0
    for (const symbol of boardString.split('').reverse().join('')) {
        if (/[bfmterk]/.test(symbol)) {
            boardState[i] = {
                piece: symbol.toLowerCase(),
                color: BLACK
            }
            i++
        } else if (/[BFMTERK]/.test(symbol)) {
            boardState[i] = {
                piece: symbol.toLowerCase(),
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

const getKhunPositionsFromBoardState = boardState => {
    let whiteKhunPosition
    let blackKhunPosition
    
    boardState.forEach((square, index) => {
        if (square && square.piece === KHUN) {
            if (square.color === WHITE) {
                whiteKhunPosition = index
            } else if (square.color === BLACK) {
                blackKhunPosition = index
            }
        }
    })

    return {
        [WHITE]: whiteKhunPosition,
        [BLACK]: blackKhunPosition
    }
}


const getStateFromStateString = stateString => {
    const boardInfo = getInfoFromStateString(stateString)
    
    boardInfo.boardState = getBoardStateFromBoardString(boardInfo.boardString)
    delete boardInfo.boardString

    boardInfo.khunPositions = getKhunPositionsFromBoardState(boardInfo.boardState)

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

// console.log(ascii(state.boardState))

// const newBoardState = changePiecePosition(state.boardState, SQUARES.e3, SQUARES.e4)
// // console.log(newBoardState)
// console.log(ascii(newBoardState))


// console.log(extract0x88Move({ notation: 're2' }))
// console.log('ญ7=F≠'.match(sanRegex))
// console.log(move_from_san(state.boardState, 'Me2'))

// console.log(ascii(move(state, 'e4').boardState))
// console.log(ascii(move(state, 'Tf2').boardState))
// console.log(ascii(move(state, { from: 'e3', to: 'e7' }).boardState))

// console.log(state)
// console.log(move(state, 'e4'))
// console.log(move(move(state, 'e4'), 'e5'))

console.log(ascii(state.boardState))
const state2 = move(state, 'e4')
console.log(ascii(state2.boardState))
const state3 = move(state2, 'd5')
console.log(ascii(state3.boardState))

console.log(canThisColorAttackThisSquare(state.boardState, WHITE, SQUARES.d5))
console.log(canThisColorAttackThisSquare(state2.boardState, WHITE, SQUARES.d5))
console.log(canThisColorAttackThisSquare(state3.boardState, WHITE, SQUARES.d5))