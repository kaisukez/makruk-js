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
	ascii,
} from '@kaisukez/makruk-js'

function runUntilGameFinished(state?: State) {
	state = state || importFen(INITIAL_FEN)
	while(!gameOver(state)) {
		const { bestMove } = findBestMove(state, 3)
		if (!bestMove) { // there's no best move, it means you're already lost
			break
		}
		state = move(state, bestMove!)
		console.log(ascii(state.boardState))
	}
	console.log('game over!')
}

runUntilGameFinished()
```
```
     +------------------------+
 8 | r  m  t  e  k  t  m  r |
 7 | .  .  .  .  .  .  .  . |
 6 | b  b  b  b  b  b  b  b |
 5 | .  .  .  .  .  .  .  . |
 4 | .  .  .  .  .  .  .  . |
 3 | B  B  B  B  B  B  B  B |
 2 | .  .  .  .  M  .  .  . |
 1 | R  M  T  K  E  T  .  R |
     +------------------------+
     a  b  c  d  e  f  g  h

     +------------------------+
 8 | r  m  t  e  k  t  m  r |
 7 | .  .  .  .  .  .  .  . |
 6 | b  b  .  b  b  b  b  b |
 5 | .  .  b  .  .  .  .  . |
 4 | .  .  .  .  .  .  .  . |
 3 | B  B  B  B  B  B  B  B |
 2 | .  .  .  .  M  .  .  . |
 1 | R  M  T  K  E  T  .  R |
     +------------------------+
     a  b  c  d  e  f  g  h

     +------------------------+
 8 | r  m  t  e  k  t  m  r |
 7 | .  .  .  .  .  .  .  . |
 6 | b  b  .  b  b  b  b  b 
 5 | .  .  b  .  .  .  .  . |
 4 | .  .  .  .  .  M  .  . |
 3 | B  B  B  B  B  B  B  B |
 2 | .  .  .  .  .  .  .  . |
 1 | R  M  T  K  E  T  .  R |
     +------------------------+
     a  b  c  d  e  f  g  h

     +------------------------+
 8 | r  m  t  e  .  t  m  r |
 7 | .  .  .  .  .  k  .  . |
 6 | b  b  .  b  b  b  b  b |
 5 | .  .  b  .  .  .  .  . |
 4 | .  .  .  .  .  M  .  . |
 3 | B  B  B  B  B  B  B  B |
 2 | .  .  .  .  .  .  .  . |
 1 | R  M  T  K  E  T  .  R |
     +------------------------+
     a  b  c  d  e  f  g  h

     +------------------------+
 8 | r  m  t  e  .  t  m  r |
 7 | .  .  .  .  .  k  .  . |
 6 | b  b  .  b  b  b  b  b |
 5 | .  .  b  .  .  .  .  . |
 4 | .  .  .  .  .  M  .  . |
 3 | B  B  B  B  B  B  B  B |
 2 | .  .  .  M  .  .  .  . |
 1 | R  .  T  K  E  T  .  R |
     +------------------------+
     a  b  c  d  e  f  g  h
```

## Symbol
- Capital letter = White pieces (move first)
- Lowercase letter = black pieces

| Symbol | Piece (English) | Piece (Thai) |
|--------|-----------------|--------------|
| B / b  | Bia             | เบี้ยคว่ำ       |
| F / f  | Flipped Bia     | เบี้ยหงาย      |
| R / r  | Rua             | เรือ          |
| M / m  | Ma              | ม้า           |
| T / t  | Thon            | โคน          |
| K / k  | Khun            | ขุน           |
| E / e  | Met             | เม็ด          |

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
