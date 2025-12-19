import type { Mask64, BoardState } from "bitboard/board/board"
import { Color, Piece } from "common/const"
import {
    EMPTY_MASK,
    FULL_MASK,
    popLSB,
    setPiece,
    removePiece,
    getPieceAt,
    updateOccupancy,
    createEmptyBoardState,
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
import { applyMove } from "bitboard/moves/execution"

export interface Move {
    from: number
    to: number
    piece: Piece
    color: Color
    captured?: Piece
    promotion?: Piece
}

export function generatePseudoLegalMoves(
    state: BoardState,
    color: Color
): Move[] {
    const moves: Move[] = []
    const isWhite = color === Color.WHITE

    const friendlyOccupancy = isWhite ? state.whiteOccupancy : state.blackOccupancy
    const enemyOccupancy = isWhite ? state.blackOccupancy : state.whiteOccupancy

    generateBiaMoves(state, color, friendlyOccupancy, enemyOccupancy, moves)
    generateFlippedBiaMoves(state, color, friendlyOccupancy, enemyOccupancy, moves)
    generateMaMoves(state, color, friendlyOccupancy, enemyOccupancy, moves)
    generateThonMoves(state, color, friendlyOccupancy, enemyOccupancy, moves)
    generateMetMoves(state, color, friendlyOccupancy, enemyOccupancy, moves)
    generateRuaMoves(state, color, friendlyOccupancy, enemyOccupancy, moves)
    generateKhunMoves(state, color, friendlyOccupancy, enemyOccupancy, moves)

    return moves
}

function generateBiaMoves(
    state: BoardState,
    color: Color,
    friendly: Mask64,
    enemy: Mask64,
    moves: Move[]
): void {
    const isWhite = color === Color.WHITE
    let pawns = isWhite ? state.whiteBia : state.blackBia
    const allOccupancy = state.allOccupancy
    const promotionRank = isWhite ? RANK_6 : RANK_3 // Rank 6 for white, rank 3 for black

    while (pawns !== EMPTY_MASK) {
        const { bb, square } = popLSB(pawns)
        pawns = bb

        // Pawn moves (non-captures)
        let pawnMoves = getPawnMoves(square, isWhite) & (FULL_MASK ^ allOccupancy)

        while (pawnMoves !== EMPTY_MASK) {
            const { bb: remaining, square: toSquare } = popLSB(pawnMoves)
            pawnMoves = remaining

            const toBit = 1n << BigInt(toSquare)
            const shouldPromote = (toBit & promotionRank) !== EMPTY_MASK

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
        let pawnAttacks = getPawnAttacks(square, isWhite) & enemy

        while (pawnAttacks !== EMPTY_MASK) {
            const { bb: remaining, square: toSquare } = popLSB(pawnAttacks)
            pawnAttacks = remaining

            const capturedPiece = getPieceAt(state, toSquare)
            const toBit = 1n << BigInt(toSquare)
            const shouldPromote = (toBit & promotionRank) !== EMPTY_MASK

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
    state: BoardState,
    color: Color,
    friendly: Mask64,
    enemy: Mask64,
    moves: Move[]
): void {
    const isWhite = color === Color.WHITE
    let pieces = isWhite ? state.whiteFlippedBia : state.blackFlippedBia

    while (pieces !== EMPTY_MASK) {
        const { bb, square } = popLSB(pieces)
        pieces = bb

        // FlippedBia moves one square diagonally
        let attacks = getDiagonalAttacks(square) & (FULL_MASK ^ friendly)

        while (attacks !== EMPTY_MASK) {
            const { bb: remaining, square: toSquare } = popLSB(attacks)
            attacks = remaining

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
    state: BoardState,
    color: Color,
    friendly: Mask64,
    enemy: Mask64,
    moves: Move[]
): void {
    const isWhite = color === Color.WHITE
    let knights = isWhite ? state.whiteMa : state.blackMa

    while (knights !== EMPTY_MASK) {
        const { bb, square } = popLSB(knights)
        knights = bb

        let attacks = getKnightAttacks(square) & (FULL_MASK ^ friendly)

        while (attacks !== EMPTY_MASK) {
            const { bb: remaining, square: toSquare } = popLSB(attacks)
            attacks = remaining

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
    state: BoardState,
    color: Color,
    friendly: Mask64,
    enemy: Mask64,
    moves: Move[]
): void {
    const isWhite = color === Color.WHITE
    let bishops = isWhite ? state.whiteThon : state.blackThon

    while (bishops !== EMPTY_MASK) {
        const { bb, square } = popLSB(bishops)
        bishops = bb

        // Thon moves one square diagonally AND one square forward
        let attacks = getDiagonalAttacks(square) & (FULL_MASK ^ friendly)

        // Add forward move (one square forward for white, one square backward for black)
        const forwardOffset = isWhite ? 8 : -8
        const forwardSquare = square + forwardOffset
        if (forwardSquare >= 0 && forwardSquare < 64) {
            const forwardBit = 1n << BigInt(forwardSquare)
            // Only add if the square is not occupied by a friendly piece
            if ((forwardBit & friendly) === EMPTY_MASK) {
                attacks |= forwardBit
            }
        }

        while (attacks !== EMPTY_MASK) {
            const { bb: remaining, square: toSquare } = popLSB(attacks)
            attacks = remaining

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
    state: BoardState,
    color: Color,
    friendly: Mask64,
    enemy: Mask64,
    moves: Move[]
): void {
    const isWhite = color === Color.WHITE
    let queens = isWhite ? state.whiteMet : state.blackMet

    while (queens !== EMPTY_MASK) {
        const { bb, square } = popLSB(queens)
        queens = bb

        // Met moves one square diagonally
        let attacks = getDiagonalAttacks(square) & (FULL_MASK ^ friendly)

        while (attacks !== EMPTY_MASK) {
            const { bb: remaining, square: toSquare } = popLSB(attacks)
            attacks = remaining

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
    state: BoardState,
    color: Color,
    friendly: Mask64,
    enemy: Mask64,
    moves: Move[]
): void {
    const isWhite = color === Color.WHITE
    let rooks = isWhite ? state.whiteRua : state.blackRua

    while (rooks !== EMPTY_MASK) {
        const { bb, square } = popLSB(rooks)
        rooks = bb

        let attacks = getRookAttacks(square, state.allOccupancy) & (FULL_MASK ^ friendly)

        while (attacks !== EMPTY_MASK) {
            const { bb: remaining, square: toSquare } = popLSB(attacks)
            attacks = remaining

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
    state: BoardState,
    color: Color,
    friendly: Mask64,
    enemy: Mask64,
    moves: Move[]
): void {
    const isWhite = color === Color.WHITE
    let kings = isWhite ? state.whiteKhun : state.blackKhun

    while (kings !== EMPTY_MASK) {
        const { bb, square } = popLSB(kings)
        kings = bb

        let attacks = getKingAttacks(square) & (FULL_MASK ^ friendly)

        while (attacks !== EMPTY_MASK) {
            const { bb: remaining, square: toSquare } = popLSB(attacks)
            attacks = remaining

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
    state: BoardState,
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
    if ((pawns & pawnAttackers) !== EMPTY_MASK) return true

    // Check flipped bia attacks (diagonal)
    const diagAttacks = getDiagonalAttacks(square)
    const flippedBias = isWhite ? state.whiteFlippedBia : state.blackFlippedBia
    if ((flippedBias & diagAttacks) !== EMPTY_MASK) return true

    // Check knight attacks
    const knightAttackers = getKnightAttacks(square)
    const knights = isWhite ? state.whiteMa : state.blackMa
    if ((knights & knightAttackers) !== EMPTY_MASK) return true

    // Check Thon attacks (one square diagonal)
    const thons = isWhite ? state.whiteThon : state.blackThon
    if ((thons & diagAttacks) !== EMPTY_MASK) return true

    // Check Met attacks (one square diagonal)
    const mets = isWhite ? state.whiteMet : state.blackMet
    if ((mets & diagAttacks) !== EMPTY_MASK) return true

    // Check rook attacks
    const rookAttackers = getRookAttacks(square, state.allOccupancy)
    const rooks = isWhite ? state.whiteRua : state.blackRua
    if ((rooks & rookAttackers) !== EMPTY_MASK) return true

    // Check king attacks
    const kingAttackers = getKingAttacks(square)
    const kings = isWhite ? state.whiteKhun : state.blackKhun
    if ((kings & kingAttackers) !== EMPTY_MASK) return true

    return false
}

/**
 * Generate all legal moves (filters out moves that leave king in check)
 */
export function generateLegalMoves(
    state: BoardState,
    color: Color
): Move[] {
    const pseudoLegalMoves = generatePseudoLegalMoves(state, color)
    const legalMoves: Move[] = []

    for (const move of pseudoLegalMoves) {
        // Apply the move
        const newState = applyMove(state, move)

        // Find our king
        const isWhite = color === Color.WHITE
        const kingMask = isWhite ? newState.whiteKhun : newState.blackKhun
        const kingSquare = kingMask !== EMPTY_MASK ? popLSB(kingMask).square : -1

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
