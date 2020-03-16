const R = require('ramda')

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


const getInfoFromStateString = R.pipe(
    R.match(/^(?<boardString>\S+)\s+(?<activeColor>[wb])\s+(?<halfMove>[01])\s+(?<fullMove>\d+)$/),
    R.prop('groups'),
    R.evolve({
        halfMove: R.curry(parseInt)(R.__, 10),
        fullMove: R.curry(parseInt)(R.__, 10)
    })
)

// https://stackoverflow.com/a/60673103/10154216
const getBoardStateFromBoardString = R.pipe(
    R.split(''),
    R.reverse,
    R.chain(
        R.cond([
            [
                R.test(/[bfmterk]/),
                R.applySpec({
                    piece: R.identity,
                    color: R.always(BLACK)
                })
            ],
            [
                R.test(/[BFMTERK]/),
                R.applySpec({
                    piece: R.identity,
                    color: R.always(WHITE)
                })
            ],
            [
                R.test(/\d/),
                R.repeat(null)
            ],
            [
                R.equals('/'),
                R.always(R.repeat(null, 8))
            ]
        ])
    ),
    R.concat(R.__, R.repeat(null, 8))
)

const getStateFromStateString = R.pipe(
    getInfoFromStateString,
    R.converge(
        R.mergeRight,
        [
            R.omit(['boardString']),
            R.pipe(
                R.prop('boardString'),
                R.applySpec({
                    boardState: getBoardStateFromBoardString
                })
            )
        ]
    )
)

const generateMovesForOneSquare = (boardState, square) => {
    const moves = []

    // if the square is off the board
    if ((square & 0x88)) {
        return moves
    }

    // if the square is empty
    if (!boardState[square]) {
        return moves
    }

    const { piece, color } = boardState[square]
    let squarePointer = square

    const attackOffsets = getAttackOffsets(piece, color)
    for (const offset of attackOffsets) {
        squarePointer = square
        while (true) {
            squarePointer += offset
            targetSquare = boardState[squarePointer]

            // if the square is off the board
            if (squarePointer & 0x88) {
                break
            }

            // if it's a opponent piece
            if (targetSquare && targetSquare.color !== color) {
                moves.push({
                    piece,
                    color,
                    from: square,
                    to: squarePointer,
                    type: 'capture'
                })
            }

            if (!IS_SLIDING_PIECE[piece]) {
                break
            }
        }
    }

    const moveOffsets = getMoveOffsets(piece, color)
    for (const offset of moveOffsets) {
        squarePointer = square
        while (true) {
            squarePointer += offset
            targetSquare = boardState[squarePointer]

            // if the square is off the board
            if (squarePointer & 0x88) {
                break
            }

            // if it's a empty square
            if (!targetSquare) {
                moves.push({
                    piece,
                    color,
                    from: square,
                    to: squarePointer,
                    type: 'normal'
                })
            }

            if (!IS_SLIDING_PIECE[piece]) {
                break
            }
        }
    }
    return moves
}

const generateMoves = boardState => {
    const moves = []
    boardState.forEach((_, index) => {
        moves.push(...generateMovesForOneSquare(boardState, index))
    })
    return moves
}

/**
 * 
 * @param {Object} lowLevelMoveObject 
 * @param {Number} lowLevelMoveObject.from 0x88 square
 * @param {Number} lowLevelMoveObject.to 0x88 square
 * 
 */
const lowLevelMove = (state, lowLevelMoveObject) => {
    const { boardState, halfMove, activeColor } = state
    const { from, to } = lowLevelMoveObject

    const newState = R.clone(state)
    newState.boardState[to] = boardState[from]
    newState.boardState[from] = null

    if (halfMove === 0) {
        newState.halfMove++
    } else {
        newState.halfMove = 0
        newState.fullMove++
    }

    newState.activeColor = swapColor(activeColor)

    return newState
}

/**
 * If there's moveObject.notation then use it, if not then use moveObject.from and moveObject.to.
 * 
 * @param {Object} moveObject 
 * @param {String} moveObject.notation algebraic notation like ne2 (knight move) or c5 (bia move)
 * @param {String} moveObject.from algebraic square like d3 or f7
 * @param {String} moveObject.to algebraic square like d3 or f7
 * 
 */
const makeMoveObjectLowLevel = moveObject => {
    if (moveObject.notation) {
        // todo
        return moveObject
    } else if (
        typeof(moveObject.from) === 'string' &&
        typeof(moveObject.to) === 'string'
    ) {
        return {
            from: SQUARES[moveObject.from],
            to: SQUARES[moveObject.to]
        }
    }

    return moveObject
}

const move = (state, moveObject) => {
    const lowLevelMoveObject = makeMoveObjectLowLevel(moveObject)
    return lowLevelMove(state, lowLevelMoveObject)
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

const newState = lowLevelMove(state, { from: SQUARES.e3, to: SQUARES.e4 })
console.log(newState)
console.log(ascii(newState.boardState))