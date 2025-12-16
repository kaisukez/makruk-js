import { BITS, Piece } from "common/const"
import { isCheck, isCheckmate } from "0x88/rules/status"
import { Move, MoveObject, State } from "0x88/types"
import { getAlgebraic, getFile, getRank } from "0x88/utils/board-utils"

import { applyMove } from "0x88/moves/execution"
import { generateLegalMoves } from "0x88/moves/generation"

/* this export function is used to uniquely identify ambiguous moves */
export function getDisambiguator(
    possibleMoves: MoveObject[],
    move: MoveObject,
) {
    const { from, to, piece } = move

    const samePieceAndDestinationMoves = possibleMoves.filter(
        (move) => move.piece === piece && move.to === to && move.from !== from,
    )

    let sameRank = 0
    let sameFile = 0
    samePieceAndDestinationMoves.forEach((move) => {
        if (getRank(move.from) === getRank(from)) {
            sameRank++
        }

        if (getFile(move.from) === getFile(from)) {
            sameFile++
        }
    })

    /* if there exists a similar moving piece on the same rank and file as
     * the move in question, use the square as the disambiguator
     */
    if (sameRank > 0 && sameFile > 0) {
        return getAlgebraic(from)
    } else if (sameFile > 0) {
        /* if the moving piece rests on the same file, use the rank symbol as the
         * disambiguator
         */
        return getAlgebraic(from).charAt(1)
    } else if (sameRank > 0) {
        /* else use the file symbol */
        return getAlgebraic(from).charAt(0)
    }

    return ""
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
export function moveToSan(state: State, move: MoveObject) {
    const possibleMoves = generateLegalMoves(state)
    const disambiguator = getDisambiguator(possibleMoves, move)

    let output = ""

    if (move.piece !== Piece.BIA) {
        output += move.piece.toUpperCase() + disambiguator
    }

    if (move.flags & BITS.CAPTURE) {
        if (move.piece === Piece.BIA) {
            output += getAlgebraic(move.from)[0]
        }
        output += "x"
    }

    output += getAlgebraic(move.to)

    if (move.flags & BITS.PROMOTION && move.promotion) {
        output += "=" + move.promotion.toUpperCase()
    }

    const { newState } = applyMove(state, move, {
        trackUndo: false,
        updateFen: false,
    })
    if (isCheck(newState)) {
        if (isCheckmate(newState)) {
            output += "#"
        } else {
            output += "+"
        }
    }

    return output
}

export function strippedSan(san: string) {
    return san.replace(
        /[^FEMTRKa-h\u0E01\u0E02\u0E04\u0E07\u0E08\u0E09\u0E0A\u0E0D1-8]/g,
        "",
    )
}

export function moveFromSan(state: State, san: string) {
    const possibleMoves = generateLegalMoves(state)
    // console.log(possibleMoves)

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

export function moveFromMoveObject(state: State, moveObject: MoveObject) {
    const possibleMoves = generateLegalMoves(state)
    // console.log(possibleMoves)

    let result
    for (const move of possibleMoves) {
        let from, to

        if (typeof moveObject.from === "number") {
            from = move.from
            to = move.to
        } else if (typeof moveObject.from === "string") {
            from = getAlgebraic(move.from)
            to = getAlgebraic(move.to)
        }

        if (moveObject.from === from && moveObject.to === to) {
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
 * @param optional
 */
export function move(state: State, move: Move, optional = {}): State {
    let moveObject
    if (typeof move === "string") {
        moveObject = moveFromSan(state, move)
    } else if (typeof move === "object") {
        moveObject = moveFromMoveObject(state, move)
    }

    if (!moveObject) {
        throw { code: "INVALID_MOVE" }
    }

    const { newState } = applyMove(state, moveObject, {
        optional,
        trackUndo: false,
        updateFen: true,
    })

    return newState
}
