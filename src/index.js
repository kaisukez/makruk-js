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

const {
    canThisColorAttackThisSquare,
    generateMoves,
    generateLegalMoves,
    move,
    gameOver,
} = require('./move')

const {
    importFen,
    exportFen,
} = require('./state')



function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max))
}

function performanceTest() {
    let state = importFen(INITIAL_FEN)
    let i = 0
    while(!gameOver(state)) {
        console.log('round', i)
        const moves = generateLegalMoves(state)
        const choosenMove = moves[getRandomInt(moves.length)]
        state = move(state, choosenMove)
        i++

        console.log(ascii(state.boardState))
    }
    console.log('game over!')
}


// const info = getInfoFromStateString(INITIAL_FEN)
// const boardState = getBoardStateFromBoardString(info.boardString)
// console.log(boardState)

const state = importFen(INITIAL_FEN)
// const state = importFen('T7/8/8/8/8/8/8/T7 w 1')
// console.log(state)
// const allMoves = generateAllMoves(state)
// console.log(allMoves)

// console.log(generateMovesForOneSquare(state.boardState, SQUARES.e3))
// console.log(generateMoves(state.boardState))

console.log(ascii(state.boardState))
// console.log(generateMoves(state))

// const newBoardState = changePiecePosition(state.boardState, SQUARES.e3, SQUARES.e4)
// // console.log(newBoardState)
// console.log(ascii(newBoardState))


// console.log(extract0x88Move({ notation: 're2' }))
// console.log('ญ7=F≠'.match(sanRegex))
// console.log(move_from_san(state.boardState, 'Me2'))

// console.log(ascii(move(state, 'e4').boardState))
// console.log(ascii(move(state, 'Tf2').boardState))
// console.log(ascii(move(state, { from: 'e3', to: 'e7' }).boardState))

// console.log(state)
// console.log(move(state, 'e4'))
// console.log(move(move(state, 'e4'), 'e5'))

console.log(ascii(state.boardState))
const state2 = move(state, 'e4')
console.log(ascii(state2.boardState))
const state3 = move(state2, 'd5')
console.log(ascii(state3.boardState))
const state4 = move(state3, 'exd5')
console.log(ascii(state4.boardState))

console.log(state.piecePositions[WHITE][BIA])
console.log(state.piecePositions[BLACK][BIA])

console.log(state2.piecePositions[WHITE][BIA])
console.log(state2.piecePositions[BLACK][BIA])

console.log(state3.piecePositions[WHITE][BIA])
console.log(state3.piecePositions[BLACK][BIA])

console.log(state4.piecePositions[WHITE][BIA])
console.log(state4.piecePositions[BLACK][BIA])

// console.log(canThisColorAttackThisSquare(state.boardState, WHITE, SQUARES.d5))
// console.log(canThisColorAttackThisSquare(state2.boardState, WHITE, SQUARES.d5))
// console.log(canThisColorAttackThisSquare(state3.boardState, WHITE, SQUARES.d5))
// console.log(state3)

// console.log(state)
// console.log(exportFen(state))

// performanceTest()

// console.log(JSON.stringify(state).length)