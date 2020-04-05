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

    PIECE_POWER,

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
    clone,
} = require('./utils')

const {
    canThisColorAttackThisSquare,
    move,
} = require('./move')



function throwIfWrongFenResult(result) {
    // TODO
    if (!result) {
        throw { code: 'WRONG_AMOUNT_OF_INPUTS' }
    }

    console.log(result)

    const {
        boardString,
        activeColor,
        moveNumber,
        countColor,
        countType,
        count
    } = result

} 

function extractInfoFromFen(fen) {
    const regex = /^(?<boardString>\S+)\s+(?<activeColor>\S+)\s+(?<moveNumber>\S+)(\s+(?<countColor>\S+)\s+(?<countType>\S+)\s+(?<count>\S+))?$/
    const result = fen.trim().match(regex)

    if (!result) {
        return null
    }

    return { ...result.groups }
}

function getBoardStateFromBoardString(boardString) {
    const boardState = Array(128)
    let i = 0
    for (const symbol of boardString.split('/').reverse().join('/')) {
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

function forEachPiece(piecePositions, func) {
    for (const piece in piecePositions[WHITE]) {
        for (const position of piecePositions[WHITE][piece]) {
            func(WHITE, piece, position)
        }
    }
    for (const piece in piecePositions[BLACK]) {
        for (const position of piecePositions[BLACK][piece]) {
            func(BLACK, piece, position)
        }
    }
}

function countPiece(piecePositions) {
    const pieceCount = {
        all: 0,

        color: {
            [WHITE]: 0,
            [BLACK]: 0
        },
        piece: {
            [BIA]: 0,
            [FLIPPED_BIA]: 0,
            [MA]: 0,
            [THON]: 0,
            [MET]: 0,
            [RUA]: 0,
            [KHUN]: 0,
        },
        
        [WHITE]: {
            [BIA]: 0,
            [FLIPPED_BIA]: 0,
            [MA]: 0,
            [THON]: 0,
            [MET]: 0,
            [RUA]: 0,
            [KHUN]: 0
        },
        [BLACK]: {
            [BIA]: 0,
            [FLIPPED_BIA]: 0,
            [MA]: 0,
            [THON]: 0,
            [MET]: 0,
            [RUA]: 0,
            [KHUN]: 0
        }
    }

    forEachPiece(piecePositions, (color, piece) => {
        pieceCount.all++
        pieceCount.color[color]++
        pieceCount.piece[piece]++
        pieceCount[color][piece]++
    })

    return pieceCount
}

function evalulatePower(pieceCount) {
    const power = {
        [WHITE]: 0,
        [BLACK]: 0
    }

    for (const piece in pieceCount[WHITE]) {
        power[WHITE] += pieceCount[WHITE][piece] * PIECE_POWER[piece]
    }

    for (const piece in pieceCount[BLACK]) {
        power[BLACK] += pieceCount[BLACK][piece] * PIECE_POWER[piece]
    }

    return power
}


/**
 * moveObject = { from: 21, to: 22 }
 * piecePositions = [5, 21, 49]
 * 
 * updatePiecePositionDictionary(piceePositions, moveObject)
 * newPiecePosition = [5, 22, 49]
 */
function updatePiecePositionDictionary(piecePositions, moveObject) {
    const newPiecePositions = clone(piecePositions)

    const { color, piece, from, to, promotion, captured } = moveObject
    if (Array.isArray(newPiecePositions[color][piece])) {
        const index = newPiecePositions[color][piece].indexOf(from)
        if (index !== -1) {
            newPiecePositions[color][piece][index] = to
        }

        if (moveObject.flags & BITS.PROMOTION) {
            const toDeleteIndex = newPiecePositions[color][piece].indexOf(to)
            if (toDeleteIndex !== -1) {
                newPiecePositions[color][piece].splice(toDeleteIndex, 1)
            }
            newPiecePositions[color][promotion].concat(to)
        }
    
        if (moveObject.flags & BITS.CAPTURE) {
            const toDeleteIndex = newPiecePositions[swapColor(color)][captured].indexOf(to)
            if (toDeleteIndex !== -1) {
                newPiecePositions[swapColor(color)][captured].splice(toDeleteIndex, 1)
            }
        }
    }


    return newPiecePositions
}


function importFen(fen) {
    const state = extractInfoFromFen(fen)
    throwIfWrongFenResult(state)
    state.moveNumber = parseInt(state.moveNumber, 10)
    
    state.boardState = getBoardStateFromBoardString(state.boardString)
    delete state.boardString

    state.history = []
    state.future = []
    state.piecePositions = getPiecePositions(state.boardState)

    state.countdown = null
    state.countdownHistory = []

    return state
}


function exportFen(state) {
    const { boardState, activeColor, moveNumber } = state

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

    return [fen.split('/').reverse().join('/'), activeColor, moveNumber].join(' ')
}


module.exports = {
    extractInfoFromFen,
    getBoardStateFromBoardString,
    forEachPieceFromBoardState,
    getPiecePositions,
    forEachPiece,
    countPiece,
    evalulatePower,
    updatePiecePositionDictionary,
    importFen,
    exportFen,
}