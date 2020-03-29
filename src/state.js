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



function extractInfoFromFen(fen) {
    const regex = /^(?<boardString>\S+)\s+(?<activeColor>[wb])\s+(?<fullMove>\d+)$/
    const result = fen.match(regex)

    if (!result) {
        return null
    }

    result.groups.fullMove = parseInt(result.groups.fullMove, 10)

    return { ...result.groups }
}

function getBoardStateFromBoardString(boardString) {
    const boardState = Array(128)
    let i = 0
    for (const symbol of boardString.split('').reverse().join('')) {
        if (/[bfmterk]/.test(symbol)) {
            // boardState[i] = {
            //     color: BLACK,
            //     piece: symbol.toLowerCase()
            // }
            boardState[i] = [
                BLACK,
                symbol.toLowerCase()
            ]
            i++
        } else if (/[BFMTERK]/.test(symbol)) {
            // boardState[i] = {
            //     color: WHITE,
            //     piece: symbol.toLowerCase()
            // }
            boardState[i] = [
                WHITE,
                symbol.toLowerCase()
            ]
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
        if (square && square[1] === KHUN) {
            if (square[0] === WHITE) {
                whiteKhunPosition = index
            } else if (square[0] === BLACK) {
                blackKhunPosition = index
            }
        }
    })

    return {
        [WHITE]: whiteKhunPosition,
        [BLACK]: blackKhunPosition
    }
}

function forEachPieceFromBoardState(boardState, func) {
    for (let i = SQUARES.a1; i <= SQUARES.h8; i++) {
        if (i & 0x88) {
            i += 7
            continue
        }

        if (!boardState[i]) {
            continue
        }

        func(boardState[i], i)
    }
}

function getPiecePositions(boardState) {
    const piecePositions = {
        [WHITE]: {
            [BIA]: [],
            [FLIPPED_BIA]: [],
            [MA]: [],
            [THON]: [],
            [MET]: [],
            [RUA]: [],
            [KHUN]: []
        },
        [BLACK]: {
            [BIA]: [],
            [FLIPPED_BIA]: [],
            [MA]: [],
            [THON]: [],
            [MET]: [],
            [RUA]: [],
            [KHUN]: []
        }
    }

    forEachPieceFromBoardState(boardState, ([color, piece], index) => {
        piecePositions[color][piece] = piecePositions[color][piece].concat(index)
    })

    return piecePositions
}


function importFen(fen) {
    const state = extractInfoFromFen(fen)
    
    state.boardState = getBoardStateFromBoardString(state.boardString)
    delete state.boardString

    state.khunPositions = getKhunPositionsFromBoardState(state.boardState)

    state.history = []
    state.future = []
    state.piecePositions = getPiecePositions(state.boardState)

    return state
}


function exportFen(state) {
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

            const [color, piece] = boardState[i]
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
    importFen,
    exportFen,
}