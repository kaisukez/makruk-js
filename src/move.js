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

    SHIFTS,
    RAYS,
    ATTACKS,

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
    squareColor,
    algebraic,
    clone,
} = require('./utils')


const {
    importFen,
    exportFen,
} = require('./state')


/**
 * 
 * to find out if any of black piece can attack on e7 square
 * 
 * canThisColorAttackThisSquare(BLACK, SQUARES.e7)
 * 
 */
function canThisColorAttackThisSquare(boardState, color, targetSquareIndex) {
    for (let fromIndex = SQUARES.a1; fromIndex <= SQUARES.h8; fromIndex++) {
        /* did we run off the end of the board */
        if (fromIndex & 0x88) {
            fromIndex += 7
            continue
        }
        
        /* if empty square or wrong color */
        if (!boardState[fromIndex] || boardState[fromIndex][0] !== color) {
            continue
        }
        
        const fromSquare = boardState[fromIndex]
        const lookUpIndex = fromIndex - targetSquareIndex + 119

        if (ATTACKS[lookUpIndex] & (1 << SHIFTS[fromSquare[0]][fromSquare[1]])) {
            // if not sliding piece then return true
            if (!IS_SLIDING_PIECE[fromSquare[1]]) {
                return true
            }

            // if sliding piece then find out if it's blocked by other piece
            // if it's blocked then we can't attack, otherwise we can
            const offset = RAYS[lookUpIndex]
            let j = fromIndex + offset

            let blocked = false
            while (j !== targetSquareIndex) {
                if (boardState[j]) {
                    blocked = true
                    break
                }
                j += offset
            }
            
            if (!blocked) {
                return true
            }
        }
    }

    return false
}

// isKhunAttacked(boardState, WHITE) = is white khun attacked
function isKhunAttacked(boardState, color, khunPositions) {
    return canThisColorAttackThisSquare(
        boardState,
        swapColor(color),
        khunPositions[color]
    )
}

function inCheck (state) {
    const { boardState, activeColor, khunPositions } = state
    return isKhunAttacked(boardState, activeColor, khunPositions)
}

function inCheckmate(state) {
    return inCheck(state) && generateLegalMoves(state).length === 0
}

function inStalemate(state) {
    return !inCheck(state) && generateLegalMoves(state).length === 0
}

function inDraw(state) {
    return (
        inStalemate(state)
        // || insufficientMaterial(state)
        || inThreefoldRepetition(state)
    )
}

function gameOver(state) {
    return (
        inDraw(state)
        || inCheckmate(state)
    )
}

function inThreefoldRepetition(state) {
    const positions = {}
    let currentState = state

    while(currentState && currentState.history && currentState.history.length) {
        const fen = exportFen(currentState)
        positions[fen] = fen in positions ? positions[fen] + 1 : 1
        if (positions[fen] >= 3) {
            return true
        }

        currentState = undoMove(currentState)
    }

    return false
}

function insufficientMaterial(state) {
    // TODO: find out more conditions

    const pieceCount = {}
    let numPieces = 0

    for (let i = SQUARES.a1; i <= SQUARES.h8; i++) {
        if (i & 0x88) {
            i += 7
            continue
        }

        const _squareColor = squareColor(i)
        const square = state.boardState[i]
        if (square) {
            pieceCount[square[1]] =
                square[1] in pieceCount
                ? pieceCount[square[1]] + 1
                : 1
            numPieces++
        }
    }

    if (numPieces === 2) {
        return true
    } else if (
        numPieces === 3 &&
        (
            pieceCount[BIA] === 1 ||
            pieceCount[FLIPPED_BIA] === 1 ||
            pieceCount[MET] === 1 ||
            pieceCount[MA] === 1
        )
    ) {
        return true
    }

    return false
}

/**
 * 
 * @param {Object} boardState
 * @param {Number} from 0x88 square
 * @param {Number} to 0x88 square
 * 
 */
function changePiecePosition(boardState, from, to) {
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
function step(state) {
    const newState = clone(state)

    if (state.activeColor === BLACK) {
        newState.fullMove++
    }

    newState.activeColor = swapColor(newState.activeColor)

    return newState
}

function stepBack(state) {
    const newState = clone(state)

    if (state.activeColor === WHITE) {
        newState.fullMove--
    }

    newState.activeColor = swapColor(newState.activeColor)

    return newState
}

function makeMove(state, moveObject) {
    let newState = clone(state)
    newState.boardState = changePiecePosition(
        state.boardState,
        moveObject.from,
        moveObject.to
    )

    if (moveObject.flags & BITS.PROMOTION) {
        newState.boardState[moveObject.to][1] = moveObject.promotion
    }

    newState = step(newState)

    // update Khun position lookup table
    if (moveObject.piece === KHUN) {
        newState.khunPositions[state.activeColor] = moveObject.to
    }

    newState.history.push(moveObject)
    newState.future = []

    return newState
}

function nextMove(state) {
    if (!state.future || state.future && state.future.length === 0) {
        throw { code: 'NO_FUTURE_MOVE' }
    }

    let newState = clone(state)
    const nextMove = newState.future.shift()
    newState = makeMove(newState, nextMove)
    return newState
}

function undoMove(state) {
    if (!state.history || state.history && state.history.length === 0) {
        throw { code: 'NO_MOVE_HISTORY' }
    }

    let newState = clone(state)
    newState = stepBack(newState)
    const lastMove = newState.history.pop()

    const { piece, from, to, flags, captured } = lastMove
    const { boardState, activeColor } = newState
    boardState[from] = boardState[to]
    // boardState[from].type = piece // undo promotion
    boardState[from][1] = piece // undo promotion
    boardState[to] = null

    if (flags & BITS.CAPTURE) {
        // boardState[to] = { piece: captured, color: swapColor(activeColor) }
        boardState[to] = [ swapColor(activeColor), captured ]
    }

    return newState
}


function generateMovesForOneSquare(state, square, options={}) {
    const { boardState } = state
    const moves = []

    // if the square is off the board
    if (square & 0x88) {
        return moves
    }

    // if the square is empty
    if (!boardState[square]) {
        return moves
    }

    const { forColor, legal } = options
    const [color, piece] = boardState[square]

    let squarePointer = square

    if (forColor !== color) {
        return moves
    }

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
                if (targetSquare[0] !== color) {
                    const move = {
                        color,
                        piece,
                        from: square,
                        to: squarePointer,
                        flags: BITS.CAPTURE,
                        captured: targetSquare[1]
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
                    color,
                    piece,
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

    if (!legal) {
        return moves
    }

    const legalMoves = []
    for (const move of moves) {
        const newState = makeMove(state, move)
        if (
            !isKhunAttacked(
                newState.boardState,
                swapColor(newState.activeColor),
                newState.khunPositions
            )
        ) {
            legalMoves.push(move)
        }
    }

    return legalMoves
}

function generateMoves(state, options) {
    const moves = []
    state.boardState.forEach((_, index) => {
        moves.push(...generateMovesForOneSquare(state, index, options))
    })
    return moves
}

function generateLegalMoves(state) {
    return generateMoves(
        state,
        {
            forColor: state.activeColor,
            legal: true
        }
    )
}


const sanRegex = /^(?<piece>[FEMTRK])?(?<fromFlie>[a-h]|[\u0E01\u0E02\u0E04\u0E07\u0E08\u0E09\u0E0A\u0E0D])?(?<fromRank>[1-8])?(?<capture>[x:])?(?<to>[a-h]|[\u0E01\u0E02\u0E04\u0E07\u0E08\u0E09\u0E0A\u0E0D][1-8])(?<promotion>=(?<promoteTo>[F]))?(?<check>(?<normalCheck>[+†])|(?<doubleCheck>\+{2}|‡))?(?<checkmate>[#≠])?$/


/* this function is used to uniquely identify ambiguous moves */
function getDisambiguator(possibleMoves, move) {
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
function moveToSan(state, move) {
    const possibleMoves = generateLegalMoves(state)
    const disambiguator = getDisambiguator(possibleMoves, move)

    let output = ''

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

    const newState = makeMove(state, move)
    if (inCheck(newState)) {
        if (inCheckmate(newState)) {
            output += '#'
        } else {
            output += '+'
        }
    }

    return output
}

function strippedSan(san) {
    return san.replace(/[^FEMTRKa-h\u0E01\u0E02\u0E04\u0E07\u0E08\u0E09\u0E0A\u0E0D1-8]/g, '')
}

function moveFromSan(state, san) {
    const possibleMoves = generateLegalMoves(state)

    // strip off any move decorations: e.g Nf3+?!
    const cleanMove = strippedSan(san)

    let result
    for (const move of possibleMoves) {
        if (cleanMove === strippedSan(moveToSan(state, move))) {
            result = move
        }
    }

    return result
}

function moveFromMoveObject(state, moveObject={}) {
    const possibleMoves = generateLegalMoves(state)
    let result
    for (const move of possibleMoves) {
        let from, to

        if (typeof moveObject.from === 'number') {
            from = move.from
            to = move.to
        } else if (moveObject.from === 'string') {
            from = algebraic(move.from)
            to = algebraic(move.to)
        }

        if (
            moveObject.from === from &&
            moveObject.to === to
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
function move(state, move) {
    let moveObject
    if (typeof move === 'string') {
        moveObject = moveFromSan(state, move)
    } else if (typeof move === 'object') {
        moveObject = moveFromMoveObject(state, move)
    }

    if (!moveObject) {
        throw { code: 'INVALID_MOVE' }
    }

    const newState = makeMove(state, moveObject)

    return newState
}


module.exports = {
    canThisColorAttackThisSquare,
    isKhunAttacked,
    inCheck,
    inCheckmate,
    inStalemate,
    inDraw,
    gameOver,

    changePiecePosition,
    step,
    makeMove,

    generateMoves,
    generateLegalMoves,
    move,
}