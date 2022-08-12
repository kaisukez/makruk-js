# Makruk JS
Makruk (Thai chess) library written in Typescript

## Initialize state
```ts
import { State, importFen, INITIAL_FEN } from '@kaisukez/makruk-js'
const state: State = importFen(INITIAL_FEN)
```

## Move
There're 2 different ways to move
```ts
import { move, generateLegalMoves } from '@kaisukez/makruk-js'

// 1. Use Standard Algebraic Notation (SAN)
const newState: State = move(state, 'Me2')

// 2. Choose from legal moves
const moves: MoveObject[] = generateLegalMoves(state)
const newState: State = move(state, moves[0])
```

## Check if game over
```ts
import { move, generateLegalMoves } from '@kaisukez/makruk-js'
const end: boolean = gameOver(state)
```

## Simple AI (Minimax with Alpha-beta pruning technique)
```ts
import {
	State,
	importFen,
	INITIAL_FEN,
	gameOver,
	findBestMove,
} from '@kaisukez/makruk-js'

function  runUntilGameFinished(state?: State) {
	state || importFen(INITIAL_FEN)
	let  i = 0
	while(!gameOver(state)) {
		const { bestMove, bestScore } = findBestMove(state, 3)
		if (!bestMove) {
			break
		}
		state = move(state, bestMove!)
		i++
	}
	console.log('game over!')
}

runUntilGameFinished()
```

## Todos
- [x] attacked (its name was changed to canThisColorAttackThisSquare) function
- [x] inCheck / inCheckmate / inStalemate / inThreefoldRepetition
- [x] insufficientMaterial (half finished but it's ok for now)
- [x] functional programming utility function like "compose" ...
- [x] refactor code
- [x] replace [Ramda](https://ramdajs.com/) with regular js (because it make code hard to read and add friction in development process)
- [x] [counting rules](https://www.chessvariants.com/play/makruk-thai-chess)
- [x] import / export [FEN](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation)
- [ ] import / export [PGN](https://en.wikipedia.org/wiki/Portable_Game_Notation)
- [x] write test (Why write test last? I don't know. I'm not familiar with TDD or any kind of tests so I will put it last to be more focused on chess algorithm.)
- [ ] write documentation
- [ ] release version 0.1.0 to npm
- [ ] decide what to do next. Maybe optimize existing code or rewrite entire library using bitboard.
