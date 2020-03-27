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
function canThisColorAttackThisSquare(boardState, color, targetSquareIndex) {
    for (let fromIndex = SQUARES.a1; fromIndex <= SQUARES.h8; fromIndex++) {
        /* did we run off the end of the board */
        if (fromIndex & 0x88) {
            fromIndex += 7
            continue
        }
        
        /* if empty square or wrong color */
        if (!boardState[fromIndex] || boardState[fromIndex].color !== color) {
            continue
        }
        
        const fromSquare = boardState[fromIndex]
        const lookUpIndex = fromIndex - targetSquareIndex + 119

        if (ATTACKS[lookUpIndex] & (1 << SHIFTS[fromSquare.color][fromSquare.piece])) {
            // if not sliding piece then return true
            if (!IS_SLIDING_PIECE[fromSquare.piece]) {
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



module.exports = {
    canThisColorAttackThisSquare
}