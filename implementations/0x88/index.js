/**
 * MIT License
 *
 * Copyright (c) 2020 kaisukez
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 * -------------------------------------------------------------------------------
 * 
 * This file is trying to copy this project's (https://github.com/jhlywa/chess.js)
 * algorithm but modify it to be compatible with thai chess rule
 * before starting to optimize it (or even rewrite using bitboard instead).
 * 
 * ------------------------------------------------------------------------------- */
const R = require('ramda')

const WHITE = 'w'
const BLACK = 'b'
const getOppositeColor = R.ifElse(
    R.equals(WHITE),
    R.always(BLACK),
    R.always(WHITE)
)

// https://www.chessvariants.com/oriental.dir/thai.html
const BIA = 'b'
const FLIPPED_BIA = 'f'
const MA = 'm'
const THON = 't' // using THON instead of KHON to distinguish between 't' and 'k'
const MET = 'e' // using e because 'm' is already use for 'MA'
const RUA = 'r'
const KHUN = 'k'

const DEFAULT_STATE_STRING = 'rmtektmr/8/bbbbbbbb/8/8/BBBBBBBB/8/RMTKETMR w 0 1'

const BIA_MOVE_OFFSETS = {
    [WHITE]: [16],
    [BLACK]: [-16]
}
const BIA_ATTACK_OFFSETS = {
    [WHITE]: [15, 17],
    [BLACK]: [-15, -17]
}

const THON_ATTACK_OFFSETS = {
    [WHITE]: [15, 16, 17, -15, -17],
    [BLACK]: [-15, -16, -17, 17, 17]
}
const THON_MOVE_OFFSETS = THON_ATTACK_OFFSETS

const PIECE_ATTACK_OFFSETS = {
    [FLIPPED_BIA]: [15, 17, -15, -17],
    [MA]: [-18, -33, -31, -14, 18, 33, 31, 14],
    [MET]: [15, 17, -15, -17],
    [RUA]: [16, 1, -16, -1],
    [KHUN]: [17, 16, 15, -1, 1, -17, -16, -15]
}
const PIECE_MOVE_OFFSETS = PIECE_ATTACK_OFFSETS


const getAttackOffsets = R.useWith(
    (piece, color) => R.cond([
        [
            R.equals(BIA),
            R.always(BIA_ATTACK_OFFSETS[color])
        ],
        [
            R.equals(THON),
            R.always(THON_ATTACK_OFFSETS[color])
        ],
        [
            R.T,
            R.always(PIECE_ATTACK_OFFSETS[piece, color])
        ]
    ])(piece),
    [
        R.toLower,
        R.identity
    ]
)

const getMoveOffsets = R.useWith(
    (piece, color) => R.cond([
        [
            R.equals(BIA),
            R.always(BIA_MOVE_OFFSETS[color])
        ],
        [
            R.equals(THON),
            R.always(THON_MOVE_OFFSETS[color])
        ],
        [
            R.T,
            R.always(PIECE_MOVE_OFFSETS[piece, color])
        ]
    ])(piece),
    [
        R.toLower,
        R.identity
    ]
)

// use for offset sliding when generating moves
const IS_SLIDING_PIECE = {
    [RUA]: true
}

// https://www.chessprogramming.org/0x88
const SQUARES = {
    a8:   112, b8:   112, c8:   114, d8:   115, e8:   116, f8:   117, g8:   118, h8:   119,
    a7:    96, b7:    97, c7:    98, d7:    99, e7:   100, f7:   101, g7:   102, h7:   103,
    a6:    80, b6:    81, c6:    82, d6:    83, e6:    84, f6:    85, g6:    86, h6:    87,
    a5:    64, b5:    65, c5:    66, d5:    67, e5:    68, f5:    69, g5:    70, h5:    71,
    a4:    48, b4:    49, c4:    50, d4:    51, e4:    52, f4:    53, g4:    54, h4:    55,
    a3:    32, b3:    33, c3:    34, d3:    35, e3:    36, f3:    37, g3:    38, h3:    39,
    a2:    16, b2:    17, c2:    18, d2:    19, e2:    20, f2:    21, g2:    22, h2:    23,
    a1:     0, b1:     1, c1:     2, d1:     3, e1:     4, f1:     5, g1:     6, h1:     7
}

const FIRST_SQUARE = SQUARES.a1
const LAST_SQUARE = SQUARES.h8

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

const generateAllMovesForOneSquare = (boardState, square) => {
    const { piece, color } = boardState[square]
    
    const moves = []
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
                    to: targetSquare,
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

// const info = getInfoFromStateString(DEFAULT_STATE_STRING)
// const boardState = getBoardStateFromBoardString(info.boardString)
// console.log(boardState)

const state = getStateFromStateString(DEFAULT_STATE_STRING)
// console.log(state)
// const allMoves = generateAllMoves(state)
// console.log(allMoves)

console.log(generateAllMovesForOneSquare(state.boardState, SQUARES.e3))