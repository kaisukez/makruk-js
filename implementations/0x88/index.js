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


const getInfoFromStateString = R.pipe(
    R.match(/^(?<boardString>\S+)\s+(?<activeColor>[wb])\s+(?<fullMove>\d+)$/),
    R.prop('groups'),
    R.evolve({
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
    if (square & 0x88) {
        return moves
    }

    // if the square is empty
    if (!boardState[square]) {
        return moves
    }

    let { piece, color } = boardState[square]
    piece = piece.toLowerCase()
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
            if (targetSquare) {
                if (targetSquare.color !== color) {
                    const move = {
                        piece,
                        color,
                        from: square,
                        to: squarePointer,
                        flags: BITS.CAPTURE
                    }
                    if (
                        piece === BIA &&
                        (rank(squarePointer) === RANK_3 || rank(squarePointer) === RANK_6)
                    ) {
                        move.promotion = FLIPPED_BIA
                        move.flags |= BITS.PROMOTION
                    }
                    moves.push(move)
                }
                break
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
                const move = {
                    piece,
                    color,
                    from: square,
                    to: squarePointer,
                    flags: BITS.NORMAL
                }
                if (
                    piece === BIA &&
                    (rank(squarePointer) === RANK_3 || rank(squarePointer) === RANK_6)
                ) {
                    move.promotion = FLIPPED_BIA
                    move.flags |= BITS.PROMOTION
                }
                moves.push(move)
            } else {
                break
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
 * @param {Object} boardState
 * @param {Number} from 0x88 square
 * @param {Number} to 0x88 square
 * 
 */
const changePiecePosition = R.cond([
    // if "from" or "to" are null then return the same boardState
    [
        R.pipe(
            R.converge(
                R.or,
                [
                    R.nthArg(1), // from
                    R.nthArg(2) // to
                ]
            ),
            R.isNil
        ),
        R.identity
    ],

    // return new boardState
    [
        R.T,
        (boardState, from, to) => R.pipe(
            R.update(to, boardState[from]),
            R.update(from, null)
        )(boardState)
    ]
])

/**
 * Increase move counter (if black have made a move) and swap color
 * 
 * @param {Object} state 
 * 
 */
const step = R.pipe(
    R.when(
        R.pipe(R.prop('activeColor'), R.equals(BLACK)),
        R.evolve({
            fullMove: R.inc
        })
    ),
    R.evolve({
        activeColor: swapColor
    })
)

// // https://stackoverflow.com/questions/40007937/regex-help-for-chess-moves-san
// // https://stackoverflow.com/questions/12317049/how-to-split-a-long-regular-expression-into-multiple-lines-in-javascript
// const notationRegex = [
//     /(?<piece>[brqnkBRQNK])(?<to>[a-h][1-8])|/,
//     /(?<piece>[brqnkBRQNK])(?<fromFile>[a-h])x(?<to>[a-h][1-8]|)/,
//     /(?<piece>[brqnkBRQNK])(?<from>[a-h][1-8])x(?<to>[a-h][1-8])/,
//     /(?<piece>[brqnkBRQNK])(?<from>[a-h][1-8])(?<to>[a-h][1-8])/,
//     /(?<piece>[brqnkBRQNK])(?<fromFile>[a-h])(?<to>[a-h][1-8])/,
//     /(?<piece>[brqnkBRQNK])x(?<to>[a-h][1-8])/,
//     /(?<fromFile>[a-h])x(?<to>[a-h][1-8])=(?<promotion>(b+r+q+n+B+R+Q+N))/,
//     /(?<fromFile>[a-h])x(?<to>[a-h][1-8])/,
//     /(?<from>[a-h][1-8])x(?<to>[a-h][1-8])=(?<promotion>(b+r+q+n+B+R+Q+N))/,
//     /(?<from>[a-h][1-8])x(?<to>[a-h][1-8])/,
//     /(?<from>[a-h][1-8])(?<to>[a-h][1-8])=(?<promotion>(b+r+q+n+B+R+Q+N))/,
//     /(?<from>[a-h][1-8])(?<to>[a-h][1-8])/,
//     /(?<from>[a-h][1-8])=(?<promotion>(b+r+q+n+B+R+Q+N))/,
//     /(?<to>[a-h][1-8])/,
//     /(?<piece>[brqnkBRQNK])(?<fromRank>[1-8])x(?<to>[a-h][1-8])/,
//     /(?<piece>[brqnkBRQNK])(?<fromRank>[1-8])(?<to>[a-h][1-8])/,
// ]

const sanRegex = /^(?<piece>[FEMTRK])?(?<fromFlie>[a-h]|[\u0E01\u0E02\u0E04\u0E07\u0E08\u0E09\u0E0A\u0E0D])?(?<fromRank>[1-8])?(?<capture>[x:])?(?<to>[a-h]|[\u0E01\u0E02\u0E04\u0E07\u0E08\u0E09\u0E0A\u0E0D][1-8])(?<promotion>=(?<promoteTo>[F]))?(?<check>(?<normalCheck>[+†])|(?<doubleCheck>\+{2}|‡))?(?<checkmate>[#≠])?$/

// /**
//  * If there's moveObject.notation then use it, if not then use moveObject.from and moveObject.to.
//  * 
//  * @param {Object} moveObject 
//  * @param {String} moveObject.notation algebraic notation like ne2 (knight move) or c5 (bia move)
//  * @param {String} moveObject.from algebraic square like d3 or f7
//  * @param {String} moveObject.to algebraic square like d3 or f7
//  * 
//  */
// const extract0x88Move = R.cond([
//     [
//         R.both(R.has('notation'), R.T),
//         R.pipe(
//             R.prop('notation'),
//             R.match(notationRegex),
//             R.tap(console.log),
//             R.applySpec({
//                 piece: R.prop(1),
//                 from: R.prop(2),
//                 to: R.prop(3)
//             })
//         )
//     ]
// ])

// parses all of the decorators out of a SAN string
const stripped_san = move => {
    return move.replace(/=/, '').replace(/[+#]?[?!]*$/, '')
}

/* this function is used to uniquely identify ambiguous moves */
const get_disambiguator = (boardState, move, sloppy) => {
    var moves = generateMoves(boardState, { legal: !sloppy })

    var from = move.from
    var to = move.to
    var piece = move.piece

    var ambiguities = 0
    var same_rank = 0
    var same_file = 0

    for (var i = 0, len = moves.length; i < len; i++) {
        var ambig_from = moves[i].from
        var ambig_to = moves[i].to
        var ambig_piece = moves[i].piece

        /* if a move of the same piece type ends on the same to square, we'll
            * need to add a disambiguator to the algebraic notation
            */
        if (piece === ambig_piece && from !== ambig_from && to === ambig_to) {
            ambiguities++

            if (rank(from) === rank(ambig_from)) {
                same_rank++
            }

            if (file(from) === file(ambig_from)) {
                same_file++
            }
        }
    }

    if (ambiguities > 0) {
        /* if there exists a similar moving piece on the same rank and file as
            * the move in question, use the square as the disambiguator
            */
        if (same_rank > 0 && same_file > 0) {
            return algebraic(from)
        } else if (same_file > 0) {
            /* if the moving piece rests on the same file, use the rank symbol as the
                * disambiguator
                */
            return algebraic(from).charAt(1)
        } else {
            /* else use the file symbol */
            return algebraic(from).charAt(0)
        }
    }


    return ''
}

/* convert a move from 0x88 coordinates to Standard Algebraic Notation
* (SAN)
*
* @param {boolean} sloppy Use the sloppy SAN generator to work around over
* disambiguation bugs in Fritz and Chessbase.    See below:
*
* r1bqkbnr/ppp2ppp/2n5/1B1pP3/4P3/8/PPPP2PP/RNBQK1NR b KQkq - 2 4
* 4. ... Nge7 is overly disambiguated because the knight on c6 is pinned
* 4. ... Ne7 is technically the valid SAN
*/
const move_to_san = (boardState, move, sloppy) => {
    // console.log('move-to-san', move)
    var output = ''

    var disambiguator = get_disambiguator(boardState, move, sloppy)

    if (move.piece !== BIA) {
        output += move.piece.toUpperCase() + disambiguator
    }

    if (move.flags & BITS.CAPTURE) {
        if (move.piece === BIA) {
            output += algebraic(move.from)[0]
        }
        output += 'x'
    }

    output += algebraic(move.to)

    if (move.flags & BITS.PROMOTION) {
        output += '=' + move.promotion.toUpperCase()
    }

    // make_move(move)
    // if (in_check()) {
    //     if (in_checkmate()) {
    //         output += '#'
    //     } else {
    //         output += '+'
    //     }
    // }
    // undo_move()

    return output
}

// convert a move from Standard Algebraic Notation (SAN) to 0x88 coordinates
const move_from_san = (boardState, move, sloppy) => {
    // strip off any move decorations: e.g Nf3+?!
    var clean_move = stripped_san(move)
    // console.log('clean_move', clean_move)

    // if we're using the sloppy parser run a regex to grab piece, to, and from
    // this should parse invalid SAN like: Pe2-e4, Rc1c4, Qf3xf7
    if (sloppy) {
        var matches = clean_move.match(
            // /([pnbrqkPNBRQK])?([a-h][1-8])x?-?([a-h][1-8])([qrbnQRBN])?/
            /([bfmterkBFMTERK])?([a-h][1-8])x?-?([a-h][1-8])?/
        )
        if (matches) {
            var piece = matches[1]
            var from = matches[2]
            var to = matches[3]
        }
    }

    var moves = generateMoves(boardState)
    console.log('moves', moves)
    for (var i = 0, len = moves.length; i < len; i++) {
        // try the strict parser first, then the sloppy parser if requested
        // by the user
        if (
            clean_move === stripped_san(move_to_san(boardState, moves[i])) ||
            (sloppy && clean_move === stripped_san(move_to_san(boardState, moves[i], true)))
        ) {
                // console.log('')
                // console.log('if 1')
                // console.log('clean_move', clean_move)
                // console.log('stripped_san(move_to_san(moves[i]))', stripped_san(move_to_san(boardState, moves[i])))
                // console.log('move_to_san(moves[i])', move_to_san(boardState, moves[i]))
                // console.log('moves[i]', moves[i])
                // console.log('')

            return moves[i]
        } else {
            if (
                matches &&
                (!piece || piece.toLowerCase() == moves[i].piece) &&
                SQUARES[from] == moves[i].from &&
                SQUARES[to] == moves[i].to &&
                (!promotion || promotion.toLowerCase() == moves[i].promotion)
            ) {
                console.log('if 2')
                return moves[i]
            }
        }
    }

    return null
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

// const move = (state, moveObject) => {
//     const lowLevelMoveObject = makeMoveObjectLowLevel(moveObject)
//     return lowLevelMove(state, lowLevelMoveObject)
// }

const moveFromSan = (boardState, san) => {
    // strip off any move decorations: e.g Nf3+?!
    const clean_move = stripped_san(san)

    const moves = generateMoves(boardState)

    let result
    for (const move of moves) {
        if (clean_move === stripped_san(move_to_san(boardState, move))) {
            result = move
        }
    }

    return result
}

const moveFromMoveObject = (boardState, moveObject={}) => {
    const moves = generateMoves(boardState)

    let result
    for (const move of moves) {
        if (
            moveObject.from === algebraic(move.from) &&
            moveObject.to === algebraic(move.to)
        ) {
            result = move
        }
    }

    return result
}

/**
 * 
 * @param {Object} state 
 * @param {String | Object} move SAN or moveObject
 * 
 * moveObject = {
 *     from: Number, algebraic position like e4 d7 ...
 *     to: Number, algebraic position like e4 d7 ...
 * }
 * 
 */
const move = (state, move) => {
    let moveObject
    if (typeof move === 'string') {
        moveObject = moveFromSan(state.boardState, move)
    } else if (typeof move === 'object') {
        moveObject = moveFromMoveObject(state.boardState, move)
    }

    return moveObject
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

// console.log('step', R.omit(['boardState'])(step(state)))

// console.log(extract0x88Move({ notation: 're2' }))
// console.log('ญ7=F≠'.match(sanRegex))
// console.log(move_from_san(state.boardState, 'Me2'))

console.log(move(state, 'e4'))
console.log(move(state, { from: 'e3', to: 'e7' }))