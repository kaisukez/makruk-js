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
    canThisColorAttackThisSquare,
    move,
} = require('./move')



function getInfoFromStateString(stateString) {
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
                color: BLACK,
                piece: symbol.toLowerCase()
            }
            i++
        } else if (/[BFMTERK]/.test(symbol)) {
            boardState[i] = {
                color: WHITE,
                piece: symbol.toLowerCase()
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

function getKhunPositionsFromBoardState(boardState) {
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


function getStateFromStateString(stateString) {
    const boardInfo = getInfoFromStateString(stateString)
    
    boardInfo.boardState = getBoardStateFromBoardString(boardInfo.boardString)
    delete boardInfo.boardString

    boardInfo.khunPositions = getKhunPositionsFromBoardState(boardInfo.boardState)

    boardInfo.history = []

    return boardInfo
}


function generateFen(state) {
    const { boardState, activeColor, fullMove } = state

    let empty = 0
    let fen = ''

    for (let i = SQUARES.a1; i <= SQUARES.h8; i++) {
        if (!boardState[i]) {
            empty++
        } else {
            if (empty > 0) {
                fen += empty
                empty = 0
            }

            const { color, piece } = boardState[i]
            fen += color === WHITE ? piece.toUpperCase() : piece.toLowerCase()
        }

        if ((i + 1) & 0x88) {
            if (empty > 0) {
                fen += empty
            }

            if (i !== SQUARES.h8) {
                fen += '/'
            }

            empty = 0
            i += 8
        }
    }

    return [fen.split('').reverse().join(''), activeColor, fullMove].join(' ')
}


module.exports = {
    getInfoFromStateString,
    getBoardStateFromBoardString,
    getKhunPositionsFromBoardState,
    getStateFromStateString,
    generateFen,
}