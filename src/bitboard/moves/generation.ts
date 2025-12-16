/**
 * Bitboard-based move generation for Makruk
 *
 * This module generates legal moves using bitboard operations
 */

import type { Bitboard, BitboardState } from "bitboard/board/board"
import { Color, Piece } from "common/const"
import {
    EMPTY_BITBOARD,
    FULL_BITBOARD,
    popLSB,
    setPiece,
    removePiece,
    getPieceAt,
    updateOccupancy,
    createEmptyBitboardState,
    RANK_6,
    RANK_3,
} from "bitboard/board/board"
import {
    getKnightAttacks,
    getKingAttacks,
    getDiagonalAttacks,
    getPawnAttacks,
    getPawnMoves,
    getRookAttacks,
} from "bitboard/rules/attacks"
import { applyBitboardMove } from "bitboard/moves/execution"

/**
 * Simplified move representation for bitboard generation
 */
export interface BitboardMove {
    from: number
    to: number
    piece: Piece
    color: Color
    captured?: Piece
    promotion?: Piece
}

/**
 * Generate all pseudo-legal moves for a color
 * (doesn't check if moves leave king in check)
 */
export function generatePseudoLegalMoves(
    state: BitboardState,
    color: Color
): BitboardMove[] {
    const moves: BitboardMove[] = []
    const isWhite = color === Color.WHITE

    const friendlyOccupancy = isWhite ? state.whiteOccupancy : state.blackOccupancy
    const enemyOccupancy = isWhite ? state.blackOccupancy : state.whiteOccupancy

    // Generate moves for each piece type
    generateBiaMoves(state, color, friendlyOccupancy, enemyOccupancy, moves)
    generateFlippedBiaMoves(state, color, friendlyOccupancy, enemyOccupancy, moves)
    generateMaMoves(state, color, friendlyOccupancy, enemyOccupancy, moves)
    generateThonMoves(state, color, friendlyOccupancy, enemyOccupancy, moves)
    generateMetMoves(state, color, friendlyOccupancy, enemyOccupancy, moves)
    generateRuaMoves(state, color, friendlyOccupancy, enemyOccupancy, moves)
    generateKhunMoves(state, color, friendlyOccupancy, enemyOccupancy, moves)

    return moves
}

/**
 * Generate Bia (Pawn) moves
 */
function generateBiaMoves(
    state: BitboardState,
    color: Color,
    friendly: Bitboard,
    enemy: Bitboard,
    moves: BitboardMove[]
): void {
    const isWhite = color === Color.WHITE
    let pawns = isWhite ? state.whiteBia : state.blackBia
    const allOccupancy = state.allOccupancy
    const promotionRank = isWhite ? RANK_6 : RANK_3 // Rank 6 for white, rank 3 for black

    while (pawns !== EMPTY_BITBOARD) {
        const { bb, square } = popLSB(pawns)
        pawns = bb

        // Pawn moves (non-captures)
        let pawnMovesBB = getPawnMoves(square, isWhite) & (FULL_BITBOARD ^ allOccupancy)

        while (pawnMovesBB !== EMPTY_BITBOARD) {
            const { bb: moveBB, square: toSquare } = popLSB(pawnMovesBB)
            pawnMovesBB = moveBB

            const toBit = 1n << BigInt(toSquare)
            const shouldPromote = (toBit & promotionRank) !== EMPTY_BITBOARD

            if (shouldPromote) {
                // In Makruk, pawns promote to FlippedBia
                moves.push({
                    from: square,
                    to: toSquare,
                    piece: Piece.BIA,
                    color,
                    promotion: Piece.FLIPPED_BIA,
                })
            } else {
                moves.push({
                    from: square,
                    to: toSquare,
                    piece: Piece.BIA,
                    color,
                })
            }
        }

        // Pawn captures
        let pawnAttacksBB = getPawnAttacks(square, isWhite) & enemy

        while (pawnAttacksBB !== EMPTY_BITBOARD) {
            const { bb: attackBB, square: toSquare } = popLSB(pawnAttacksBB)
            pawnAttacksBB = attackBB

            const capturedPiece = getPieceAt(state, toSquare)
            const toBit = 1n << BigInt(toSquare)
            const shouldPromote = (toBit & promotionRank) !== EMPTY_BITBOARD

            if (shouldPromote) {
                moves.push({
                    from: square,
                    to: toSquare,
                    piece: Piece.BIA,
                    color,
                    captured: capturedPiece?.[1],
                    promotion: Piece.FLIPPED_BIA,
                })
            } else {
                moves.push({
                    from: square,
                    to: toSquare,
                    piece: Piece.BIA,
                    color,
                    captured: capturedPiece?.[1],
                })
            }
        }
    }
}

/**
 * Generate FlippedBia (Promoted Pawn) moves
 * Moves one square diagonally (like Ferz)
 */
function generateFlippedBiaMoves(
    state: BitboardState,
    color: Color,
    friendly: Bitboard,
    enemy: Bitboard,
    moves: BitboardMove[]
): void {
    const isWhite = color === Color.WHITE
    let pieces = isWhite ? state.whiteFlippedBia : state.blackFlippedBia

    while (pieces !== EMPTY_BITBOARD) {
        const { bb, square } = popLSB(pieces)
        pieces = bb

        // FlippedBia moves one square diagonally
        let attacksBB = getDiagonalAttacks(square) & (FULL_BITBOARD ^ friendly)

        while (attacksBB !== EMPTY_BITBOARD) {
            const { bb: moveBB, square: toSquare } = popLSB(attacksBB)
            attacksBB = moveBB

            const capturedPiece = getPieceAt(state, toSquare)

            moves.push({
                from: square,
                to: toSquare,
                piece: Piece.FLIPPED_BIA,
                color,
                captured: capturedPiece?.[1],
            })
        }
    }
}

/**
 * Generate Ma (Knight) moves
 */
function generateMaMoves(
    state: BitboardState,
    color: Color,
    friendly: Bitboard,
    enemy: Bitboard,
    moves: BitboardMove[]
): void {
    const isWhite = color === Color.WHITE
    let knights = isWhite ? state.whiteMa : state.blackMa

    while (knights !== EMPTY_BITBOARD) {
        const { bb, square } = popLSB(knights)
        knights = bb

        let attacksBB = getKnightAttacks(square) & (FULL_BITBOARD ^ friendly)

        while (attacksBB !== EMPTY_BITBOARD) {
            const { bb: moveBB, square: toSquare } = popLSB(attacksBB)
            attacksBB = moveBB

            const capturedPiece = getPieceAt(state, toSquare)

            moves.push({
                from: square,
                to: toSquare,
                piece: Piece.MA,
                color,
                captured: capturedPiece?.[1],
            })
        }
    }
}

/**
 * Generate Thon (Makruk Bishop) moves
 * Moves one square diagonally (like Ferz)
 */
function generateThonMoves(
    state: BitboardState,
    color: Color,
    friendly: Bitboard,
    enemy: Bitboard,
    moves: BitboardMove[]
): void {
    const isWhite = color === Color.WHITE
    let bishops = isWhite ? state.whiteThon : state.blackThon

    while (bishops !== EMPTY_BITBOARD) {
        const { bb, square } = popLSB(bishops)
        bishops = bb

        // Thon moves one square diagonally AND one square forward
        let attacksBB = getDiagonalAttacks(square) & (FULL_BITBOARD ^ friendly)

        // Add forward move (one square forward for white, one square backward for black)
        const forwardOffset = isWhite ? 8 : -8
        const forwardSquare = square + forwardOffset
        if (forwardSquare >= 0 && forwardSquare < 64) {
            const forwardBit = 1n << BigInt(forwardSquare)
            // Only add if the square is not occupied by a friendly piece
            if ((forwardBit & friendly) === EMPTY_BITBOARD) {
                attacksBB |= forwardBit
            }
        }

        while (attacksBB !== EMPTY_BITBOARD) {
            const { bb: moveBB, square: toSquare } = popLSB(attacksBB)
            attacksBB = moveBB

            const capturedPiece = getPieceAt(state, toSquare)

            moves.push({
                from: square,
                to: toSquare,
                piece: Piece.THON,
                color,
                captured: capturedPiece?.[1],
            })
        }
    }
}

/**
 * Generate Met (Makruk Queen) moves
 * Moves one square diagonally (like Ferz)
 */
function generateMetMoves(
    state: BitboardState,
    color: Color,
    friendly: Bitboard,
    enemy: Bitboard,
    moves: BitboardMove[]
): void {
    const isWhite = color === Color.WHITE
    let queens = isWhite ? state.whiteMet : state.blackMet

    while (queens !== EMPTY_BITBOARD) {
        const { bb, square } = popLSB(queens)
        queens = bb

        // Met moves one square diagonally
        let attacksBB = getDiagonalAttacks(square) & (FULL_BITBOARD ^ friendly)

        while (attacksBB !== EMPTY_BITBOARD) {
            const { bb: moveBB, square: toSquare } = popLSB(attacksBB)
            attacksBB = moveBB

            const capturedPiece = getPieceAt(state, toSquare)

            moves.push({
                from: square,
                to: toSquare,
                piece: Piece.MET,
                color,
                captured: capturedPiece?.[1],
            })
        }
    }
}

/**
 * Generate Rua (Rook) moves
 */
function generateRuaMoves(
    state: BitboardState,
    color: Color,
    friendly: Bitboard,
    enemy: Bitboard,
    moves: BitboardMove[]
): void {
    const isWhite = color === Color.WHITE
    let rooks = isWhite ? state.whiteRua : state.blackRua

    while (rooks !== EMPTY_BITBOARD) {
        const { bb, square } = popLSB(rooks)
        rooks = bb

        let attacksBB = getRookAttacks(square, state.allOccupancy) & (FULL_BITBOARD ^ friendly)

        while (attacksBB !== EMPTY_BITBOARD) {
            const { bb: moveBB, square: toSquare } = popLSB(attacksBB)
            attacksBB = moveBB

            const capturedPiece = getPieceAt(state, toSquare)

            moves.push({
                from: square,
                to: toSquare,
                piece: Piece.RUA,
                color,
                captured: capturedPiece?.[1],
            })
        }
    }
}

/**
 * Generate Khun (King) moves
 */
function generateKhunMoves(
    state: BitboardState,
    color: Color,
    friendly: Bitboard,
    enemy: Bitboard,
    moves: BitboardMove[]
): void {
    const isWhite = color === Color.WHITE
    let kings = isWhite ? state.whiteKhun : state.blackKhun

    while (kings !== EMPTY_BITBOARD) {
        const { bb, square } = popLSB(kings)
        kings = bb

        let attacksBB = getKingAttacks(square) & (FULL_BITBOARD ^ friendly)

        while (attacksBB !== EMPTY_BITBOARD) {
            const { bb: moveBB, square: toSquare } = popLSB(attacksBB)
            attacksBB = moveBB

            const capturedPiece = getPieceAt(state, toSquare)

            moves.push({
                from: square,
                to: toSquare,
                piece: Piece.KHUN,
                color,
                captured: capturedPiece?.[1],
            })
        }
    }
}

/**
 * Apply a move to the bitboard state
 * Returns a new state (immutable)
 */
export function isSquareAttacked(
    state: BitboardState,
    square: number,
    attackerColor: Color
): boolean {
    const isWhite = attackerColor === Color.WHITE

    // Check pawn attacks
    const pawnAttackers = getPawnAttacks(square, !isWhite)
    if (pawnAttackers === undefined) {
        throw new Error(`getPawnAttacks returned undefined for square ${square}`)
    }
    const pawns = isWhite ? state.whiteBia : state.blackBia
    if (typeof pawns !== 'bigint') {
        throw new Error(`Pawns is not a bigint: ${typeof pawns}, state.whiteBia=${typeof state.whiteBia}, state.blackBia=${typeof state.blackBia}`)
    }
    if ((pawns & pawnAttackers) !== EMPTY_BITBOARD) return true

    // Check flipped bia attacks (diagonal)
    const diagAttacks = getDiagonalAttacks(square)
    const flippedBias = isWhite ? state.whiteFlippedBia : state.blackFlippedBia
    if ((flippedBias & diagAttacks) !== EMPTY_BITBOARD) return true

    // Check knight attacks
    const knightAttackers = getKnightAttacks(square)
    const knights = isWhite ? state.whiteMa : state.blackMa
    if ((knights & knightAttackers) !== EMPTY_BITBOARD) return true

    // Check Thon attacks (one square diagonal)
    const thons = isWhite ? state.whiteThon : state.blackThon
    if ((thons & diagAttacks) !== EMPTY_BITBOARD) return true

    // Check Met attacks (one square diagonal)
    const mets = isWhite ? state.whiteMet : state.blackMet
    if ((mets & diagAttacks) !== EMPTY_BITBOARD) return true

    // Check rook attacks
    const rookAttackers = getRookAttacks(square, state.allOccupancy)
    const rooks = isWhite ? state.whiteRua : state.blackRua
    if ((rooks & rookAttackers) !== EMPTY_BITBOARD) return true

    // Check king attacks
    const kingAttackers = getKingAttacks(square)
    const kings = isWhite ? state.whiteKhun : state.blackKhun
    if ((kings & kingAttackers) !== EMPTY_BITBOARD) return true

    return false
}

/**
 * Generate all legal moves (filters out moves that leave king in check)
 */
export function generateLegalMoves(
    state: BitboardState,
    color: Color
): BitboardMove[] {
    const pseudoLegalMoves = generatePseudoLegalMoves(state, color)
    const legalMoves: BitboardMove[] = []

    for (const move of pseudoLegalMoves) {
        // Apply the move
        const newState = applyBitboardMove(state, move)

        // Find our king
        const isWhite = color === Color.WHITE
        const kingBB = isWhite ? newState.whiteKhun : newState.blackKhun
        const kingSquare = kingBB !== EMPTY_BITBOARD ? popLSB(kingBB).square : -1

        if (kingSquare === -1) {
            // King was captured (shouldn't happen in legal moves)
            continue
        }

        // Check if king is in check after the move
        const enemyColor = isWhite ? Color.BLACK : Color.WHITE
        const inCheck = isSquareAttacked(newState, kingSquare, enemyColor)

        if (!inCheck) {
            legalMoves.push(move)
        }
    }

    return legalMoves
}
