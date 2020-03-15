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
    R.prop('groups')
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
        R.merge,
        [
            R.identity,
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