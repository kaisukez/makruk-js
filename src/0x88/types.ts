import { Color, Piece, SquareIndex } from "common/const"
import type { Countdown } from "common/types"
import { CountdownFlag } from "0x88/rules/countdown"

export type { Countdown } from "common/types"

export type SquareData = [Color, Piece];

export type MoveObject = {
    color: Color;
    piece: Piece;
    from: SquareIndex;
    to: SquareIndex;
    flags: number;
    promotion?: Piece;
    captured?: Piece;
    optional?: CountdownFlag;
    score?: number;
};
export type Move = string | MoveObject;

export type State = {
    boardState: Array<SquareData | null>;
    piecePositions: Record<Color, Record<Piece, number[]>>; // fast lookup of piece positions
    turn: Color;
    moveNumber: number;
    countdown: Countdown | null;
    fenOccurrence: Record<string, number>;
};

export type PieceCount = {
    all: number;
    color: Record<Color, number>;
    piece: Record<Piece, number>;
    [Color.WHITE]: Record<Piece, number>;
    [Color.BLACK]: Record<Piece, number>;
};

export function toEnum<E extends Record<string, E[keyof E]>>(
    e: E,
    s: string,
): E[keyof E] {
    for (const [key, value] of Object.entries(e)) {
        if (s === String(value)) {
            return e[key]
        }
    }
    throw {
        code: "CANT_CONVERT_STRING_TO_ENUM",
        message: "can't convert string to enum",
    }
}
