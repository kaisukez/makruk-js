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
    clone,
} = require('./utils')

/**
 * 
 * to find out if any of black piece can attack on e7 square
 * 
 * canThisColorAttackThisSquare(BLACK, SQUARES.e7)
 * 
 */
function canThisColorAttackThisSquare(boardState, color, targetSquare) {
    for (let i = SQUARES.a8; i <= SQUARES.h1; i++) {
        /* did we run off the end of the board */
        if (i & 0x88) {
            i += 7
            continue
        }

        /* if empty square or wrong color */
        if (!boardState[i] || boardState[i].color !== color) continue

        const piece = boardState[i]
        const difference = i - targetSquare
        const index = difference + 119

        if (ATTACKS[index] & (1 << SHIFTS[piece.type])) {
            if (piece.type === PAWN) {
                if (difference > 0) {
                    if (piece.color === WHITE) return true
                } else {
                    if (piece.color === BLACK) return true
                }
                continue
            }

            /* if the piece is a knight or a king */
            if (piece.type === 'n' || piece.type === 'k') return true

            const offset = RAYS[index]
            let j = i + offset

            let blocked = false
            while (j !== targetSquare) {
                if (boardState[j]) {
                    blocked = true
                    break
                }
                j += offset
            }

            if (!blocked) return true
        }
    }

    return false
}

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

    let { color, piece } = boardState[square]
    piece = piece.toLowerCase()
    let squarePointer = square

    const attackOffsets = getAttackOffsets(color, piece)
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

    const moveOffsets = getMoveOffsets(color, piece)
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
const changePiecePosition = (boardState, from, to) => {
    if (!from && !to) {
        return boardState
    }

    const newBoardState = clone(boardState)

    newBoardState[to] = newBoardState[from]
    newBoardState[from] = null

    return newBoardState
}

/**
 * Increase move counter (if black have made a move) and swap color
 * 
 * @param {Object} state 
 * 
 */
const step = state => {
    const newState = clone(state)

    if (state.activeColor === BLACK) {
        newState.fullMove++
    }

    newState.activeColor = swapColor(newState.activeColor)

    return newState
}

const sanRegex = /^(?<piece>[FEMTRK])?(?<fromFlie>[a-h]|[\u0E01\u0E02\u0E04\u0E07\u0E08\u0E09\u0E0A\u0E0D])?(?<fromRank>[1-8])?(?<capture>[x:])?(?<to>[a-h]|[\u0E01\u0E02\u0E04\u0E07\u0E08\u0E09\u0E0A\u0E0D][1-8])(?<promotion>=(?<promoteTo>[F]))?(?<check>(?<normalCheck>[+†])|(?<doubleCheck>\+{2}|‡))?(?<checkmate>[#≠])?$/


/* this function is used to uniquely identify ambiguous moves */
const getDisambiguator = (possibleMoves, move) => {
    const { from, to, piece } = move

    const samePieceAndDestinationMoves = possibleMoves.filter(
        move => move.piece === piece && move.to === to && move.from !== from
    )

    let sameRank = 0
    let sameFile = 0
    samePieceAndDestinationMoves.forEach(move => {
        if (rank(move.from) === rank(from)) {
            sameRank++
        }

        if (file(move.from) === file(from)) {
            sameFile++
        }
    })

    /* if there exists a similar moving piece on the same rank and file as
        * the move in question, use the square as the disambiguator
        */
    if (sameRank > 0 && sameFile > 0) {
        return algebraic(from)
    } else if (sameFile > 0) {
        /* if the moving piece rests on the same file, use the rank symbol as the
            * disambiguator
            */
        return algebraic(from).charAt(1)
    } else if (sameRank > 0) {
        /* else use the file symbol */
        return algebraic(from).charAt(0)
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
const moveToSan = (possibleMoves, move) => {
    var output = ''

    var disambiguator = getDisambiguator(possibleMoves, move)

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

const strippedSan = san => {
    return san.replace(/[^FEMTRKa-h\u0E01\u0E02\u0E04\u0E07\u0E08\u0E09\u0E0A\u0E0D1-8]/g, '')
}

const moveFromSan = (possibleMoves, san) => {
    // strip off any move decorations: e.g Nf3+?!
    const cleanMove = strippedSan(san)

    let result
    for (const move of possibleMoves) {
        if (cleanMove === strippedSan(moveToSan(possibleMoves, move))) {
            result = move
        }
    }

    return result
}

const moveFromMoveObject = (possibleMoves, moveObject={}) => {
    let result
    for (const move of possibleMoves) {
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
    const possibleMoves = generateMoves(state.boardState)

    let moveObject
    if (typeof move === 'string') {
        moveObject = moveFromSan(possibleMoves, move)
    } else if (typeof move === 'object') {
        moveObject = moveFromMoveObject(possibleMoves, move)
    }

    return moveObject
}


module.exports = {
    move
}