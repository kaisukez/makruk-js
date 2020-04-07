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




function extractInfoFromFen(fen) {
    const regex = /^(?<boardString>\S+)\s+(?<activeColor>\S+)\s+(?<moveNumber>\S+)(\s+(?<countColor>\S+)\s+(?<countType>\S+)\s+(?<count>\S+))?$/
    const result = fen.trim().match(regex)

    if (!result) {
        return null
    }

    return { ...result.groups }
}

function throwIfWrongFen(fen) {
    if (typeof fen !== 'string') {
        throw {
            code: 'WRONG_INPUT_TYPE',
            message: 'fen must be string',
            field: 'fen',
            fieldNumber: -1,
        }
    }

    const length = fen.split(' ').length
    if (!length === 3 && !length === 6) {
        throw {
            code: 'WRONG_NUMBER_OF_INPUTS',
            message: 'fen must be string with 3 or 6 fields separated by space',
            field: 'fen',
            fieldNumber: -1,
        }
    }

    const parsed = extractInfoFromFen(fen)
    const {
        boardString,
        activeColor,
        moveNumber,
        countColor,
        countType,
        count
    } = parsed


    /* ------------------------- boardString ------------------------- */
    if (/[^bfmterkBFMTERK1-8/]/.test(boardString)) {
        throw {
            code: 'WRONG_BOARD_STRING_CHARACTER',
            message: `boardString can only contains 'bfmterkBFMTERK12345678/'`,
            field: 'boardString',
            fieldNumber: 1, // start from 1 (not 0)
        }
    }

    if (!(/^[bfmterkBFMTERK1-8]{1,8}(\/[bfmterkBFMTERK1-8]{1,8}){7}$/.test(boardString))) {
        throw {
            code: 'WRONG_BOARD_STRING_NUMBER_OF_RANKS',
            message: `boardString must contain 8 ranks separated by '/'`,
            field: 'boardString',
            fieldNumber: 1,
        }
    }

    if (/[1-8]{2,}g/.test(boardString)) {
        throw {
            code: 'WRONG_BOARD_STRING_NUMBER_NEXT_TO_EACH_OTHER',
            message: 'boardString must not have any connected number like this /bb6/71/... (7 and 1)',
            field: 'boardString',
            fieldNumber: 1,
        }
    }

    const squareCount = boardString
        .replace(/\//g, '')
        .split('')
        .reduce((count, character) => {
            if (/[1-8]/.test(character)) {
                return count + parseInt(character, 10)
            }
            return count + 1
        }, 0)
    if (squareCount !== 64) {
        throw {
            code: 'WRONG_BOARD_STRING_NUMBER_OF_SQUARES',
            message: 'total of squares boardString represented must be 64',
            field: 'boardString',
            fieldNumber: 1,
        }
    }


    /* ------------------------- activeColor ------------------------- */
    if (activeColor !== WHITE && activeColor !== BLACK) {
        throw {
            code: 'WRONG_ACTIVE_COLOR',
            message: `activeColor can be either 'w' or 'b' (white or black)`,
            field: 'activeColor',
            fieldNumber: 2,
        }
    }


    /* ------------------------- moveNumber ------------------------- */
    if (!(/^[1-9]\d*$/).test(moveNumber)) {
        throw {
            code: 'WRONG_MOVE_NUMBER',
            message: 'moveNumber must be number (positive number with no 0 in front)',
            field: 'moveNumber',
            fieldNumber: 3,
        }
    }


    /* ------------------------- countdown ------------------------- */
    if (
        !(
            (countColor === '-' && countType === '-' && count === '-') ||
            (countColor !== '-' && countType !== '-' && count !== '-')
        )
    ) {
        throw {
            code: 'WRONG_COUNTDOWN',
            message: `countColor, countType and count can be '-' at the same time or can be something else at the same time`,
            field: 'countdown',
            fieldNumber: -1,
        }
    }

    if (countColor && countColor !== WHITE && countColor !== BLACK) {
        throw {
            code: 'WRONG_COUNT_COLOR',
            message: `countColor can be either 'w' or 'b' (white or black)`,
            field: 'countColor',
            fiendNumber: 4,
        }
    }

    if (countType && countType !== 'bp' && countType !== 'pp') {
        throw {
            code: 'WRONG_COUNT_TYPE',
            message: `countType can be either 'bp' or 'pp' (board power or piece power)`,
            field: 'countType',
            fieldNumber: 5,
        }
    }

    if (count && !(/^[1-9]\d*$/).test(countNumber)) {
        throw {
            code: 'WRONG_COUNT_NUMBER',
            message: 'countNumber must be number (positive number with no 0 in front)',
            field: 'counterNumbere',
            fieldNumber: 6,
        }
    }
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
 * updatePiecePositionDictionary(piecePositions, moveObject)
 * newPiecePosition = [5, 22, 49]
 */
function updatePiecePositionDictionary(piecePositions, moveObject) {
    const newPiecePositions = clone(piecePositions)

    const { color, piece, from, to, flags, promotion, captured } = moveObject

    if (
        !color || !piece || !from || !to ||
        (flags & BITS.PROMOTION && !promotion) ||
        (flags & BITS.CAPTURE && !captured)
    ) {
        const requireMoreInput = []

        if (!color) {
            requireMoreInput.push('color')
        }
        if (!piece) {
            requireMoreInput.push('piece')
        }
        if (!from) {
            requireMoreInput.push('from')
        }
        if (!to) {
            requireMoreInput.push('to')
        }

        if (flags & BITS.PROMOTION && !promotion) {
            requireMoreInput.push('promotion')
        }

        if (flags & BITS.CAPTURE && !captured) {
            requireMoreInput.push('captured')
        }

        throw {
            code: 'NOT_ENOUGH_INPUT',
            requireMoreInput: requireMoreInput
        }
    }

    if (Array.isArray(newPiecePositions[color][piece])) {
        const index = newPiecePositions[color][piece].indexOf(from)
        if (index !== -1) {
            newPiecePositions[color][piece][index] = to
        }

        if (flags & BITS.PROMOTION) {
            const toDeleteIndex = newPiecePositions[color][piece].indexOf(to)
            if (toDeleteIndex !== -1) {
                newPiecePositions[color][piece].splice(toDeleteIndex, 1)
            }
            newPiecePositions[color][promotion].push(to)
        }
    
        if (flags & BITS.CAPTURE) {
            const toDeleteIndex = newPiecePositions[swapColor(color)][captured].indexOf(to)
            if (toDeleteIndex !== -1) {
                newPiecePositions[swapColor(color)][captured].splice(toDeleteIndex, 1)
            }
        }
    }


    return newPiecePositions
}


function importFen(fen) {
    throwIfWrongFen(fen)
    const state = extractInfoFromFen(fen)
    // throwIfWrongFenResult(state)
    state.moveNumber = parseInt(state.moveNumber, 10)
    
    state.boardState = getBoardStateFromBoardString(state.boardString)
    delete state.boardString

    state.history = []
    state.future = []
    state.piecePositions = getPiecePositions(state.boardState)

    state.countdown = null
    state.countdownHistory = []

    delete state.countColor
    delete state.countType
    delete state.count

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