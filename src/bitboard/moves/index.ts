import type { Game, Move } from "bitboard/types"
import { Color } from "common/const"
import { generateLegalMoves as genMoves } from "bitboard/moves/generation"
import { applyMove as execMove } from "bitboard/moves/execution"
import { moveFromSan } from "bitboard/moves/notation"
import { updateHashForMove } from "bitboard/hash"

export { isSquareAttacked } from "bitboard/moves/generation"
export { moveToSan, moveFromSan } from "bitboard/moves/notation"
export type { Move } from "bitboard/types"

export function generateLegalMoves(game: Game): Move[] {
    return genMoves(game.board, game.turn)
}

export function move(game: Game, input: Move | string): Game {
    let m: Move
    if (typeof input === 'string') {
        const parsed = moveFromSan(game.board, game.turn, input)
        if (!parsed) {
            throw new Error(`Invalid move: ${input}`)
        }
        m = parsed
    } else {
        m = input
    }

    const newBoard = execMove(game.board, m)
    const newTurn = game.turn === Color.WHITE ? Color.BLACK : Color.WHITE
    const newMoveNumber = game.moveNumber + (newTurn === Color.WHITE ? 1 : 0)

    const newHash = updateHashForMove(game.hash, m)

    const newOccurrence = new Map(game.positionOccurrence)
    newOccurrence.set(newHash, (newOccurrence.get(newHash) || 0) + 1)

    return {
        board: newBoard,
        turn: newTurn,
        moveNumber: newMoveNumber,
        hash: newHash,
        positionOccurrence: newOccurrence,
        countdown: game.countdown,
    }
}
