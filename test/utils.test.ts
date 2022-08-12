import {
    Color,
    Piece,

    INITIAL_FEN,

    BIA_MOVE_OFFSETS,
    BIA_ATTACK_OFFSETS,
    THON_MOVE_OFFSETS,
    THON_ATTACK_OFFSETS,
    PIECE_MOVE_OFFSETS,
    PIECE_ATTACK_OFFSETS,

    IS_SLIDING_PIECE,

    SquareIndex,

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
} from '../src/constants'

import {
    swapColor,
    getAttackOffsets,
    getMoveOffsets,
    rank,
    file,
    squareColor,
    algebraic,
    ascii,
    clone,
    compose,
    pipe
} from '../src/utils'


const { WHITE, BLACK } = Color
const {
    BIA,
    FLIPPED_BIA,
    MA,
    THON,
    MET,
    RUA,
    KHUN,
} = Piece


describe('swapColor', () => {
    test('should swap color form WHITE to BLACK or BLACK to WHITE', () => {
        expect(swapColor(WHITE)).toBe(BLACK)
        expect(swapColor(BLACK)).toBe(WHITE)
    })
})


describe('getAttackOffsets', () => {
    test('attack offset should be correct', () => {
        expect(getAttackOffsets(WHITE, BIA)).toEqual(BIA_ATTACK_OFFSETS[WHITE])
        expect(getAttackOffsets(WHITE, FLIPPED_BIA)).toEqual(PIECE_ATTACK_OFFSETS[FLIPPED_BIA])
        expect(getAttackOffsets(WHITE, MA)).toEqual(PIECE_ATTACK_OFFSETS[MA])
        expect(getAttackOffsets(WHITE, THON)).toEqual(THON_ATTACK_OFFSETS[WHITE])
        expect(getAttackOffsets(WHITE, MET)).toEqual(PIECE_ATTACK_OFFSETS[MET])
        expect(getAttackOffsets(WHITE, RUA)).toEqual(PIECE_ATTACK_OFFSETS[RUA])
        expect(getAttackOffsets(WHITE, KHUN)).toEqual(PIECE_ATTACK_OFFSETS[KHUN])
    
        expect(getAttackOffsets(BLACK, BIA)).toEqual(BIA_ATTACK_OFFSETS[BLACK])
        expect(getAttackOffsets(BLACK, FLIPPED_BIA)).toEqual(PIECE_ATTACK_OFFSETS[FLIPPED_BIA])
        expect(getAttackOffsets(BLACK, MA)).toEqual(PIECE_ATTACK_OFFSETS[MA])
        expect(getAttackOffsets(BLACK, THON)).toEqual(THON_ATTACK_OFFSETS[BLACK])
        expect(getAttackOffsets(BLACK, MET)).toEqual(PIECE_ATTACK_OFFSETS[MET])
        expect(getAttackOffsets(BLACK, RUA)).toEqual(PIECE_ATTACK_OFFSETS[RUA])
        expect(getAttackOffsets(BLACK, KHUN)).toEqual(PIECE_ATTACK_OFFSETS[KHUN])
    })
})


describe('rank', () => {
    test('should get rank number from square index', () => {
        for (let i = 0; i < 128; i++) {
            if (!(i & 0x88)) {
                expect(rank(i)).toBe(Math.floor(i / 16))
            }
        }
    })
})


describe('file', () => {
    test('should get file number from square index', () => {
        for (let i = 0; i < 128; i++) {
            if (!(i & 0x88)) {
                expect(file(i)).toBe(i % 16)
            }
        }
    })
})


describe('algebraic', () => {
    test('should represent square index with algebraic notation correctly', () => {
        for (let i = 0; i < 128; i++) {
            if (!(i & 0x88)) {
                const _rank = Math.floor(i / 16)
                const _file = i % 16
    
                expect(algebraic(i)).toBe('abcdefgh'[_file] + '12345678'[_rank])
                expect(algebraic(i, { thai: true })).toBe('กขคงจฉชญ'[_file] + '12345678'[_rank])
            }
        }
    })
})


describe('ascii', () => {
    test('should print board state correctly', () => {
        // TODO
    })
})


describe('clone', () => {
    test('should deep clone nested array correctly', () => {
        const a: any = [11, 22, 33, [44, 55, [66, 77]]]
        const aCopy = clone(a)
    
        expect(aCopy).toEqual(a)
        expect(aCopy).not.toBe(a)
    
        expect(aCopy[3]).toEqual(a[3])
        expect(aCopy[3]).not.toBe(a[3])
    
        expect(aCopy[3][2]).toEqual(a[3][2])
        expect(aCopy[3][2]).not.toBe(a[3][2])
    })

    test('should deep clone nested object correctly', () => {
        const b = {
            firstName: 'ffff',
            lastName: 'llll',
            nested: {
                nested: {
                    nested: {
                        nested: ['nnnn', 'eee', 'ss', 't', 'ee', 'ddd']
                    }
                }
            },
            null: null,
            undefined: undefined,
            emptyString: ''
        }
        const bCopy = clone(b)
    
        expect(bCopy).toEqual(b)
        expect(bCopy).not.toBe(b)
    
        expect(bCopy.nested).toEqual(b.nested)
        expect(bCopy.nested).not.toBe(b.nested)
    
        expect(bCopy.nested.nested).toEqual(b.nested.nested)
        expect(bCopy.nested.nested).not.toBe(b.nested.nested)
    
        expect(bCopy.nested.nested.nested).toEqual(b.nested.nested.nested)
        expect(bCopy.nested.nested.nested).not.toBe(b.nested.nested.nested)
    
        expect(bCopy.nested.nested.nested.nested).toEqual(b.nested.nested.nested.nested)
        expect(bCopy.nested.nested.nested.nested).not.toBe(b.nested.nested.nested.nested)
    })
})


describe('compose / pipe', () => {
    const plusOneThenDouble = (num: number) => (num + 1) * 2
    const minusTwoThenTriple = (num: number) => (num - 2) * 3

    test('compose execution order should go from bottom to top', () => {
        const result = compose(
            plusOneThenDouble,
            minusTwoThenTriple
        )(1)
    
        expect(result).toBe(-4)
    })
    
    test('pipe execution order should go from top to bottom', () => {
        const result = pipe(
            plusOneThenDouble,
            minusTwoThenTriple
        )(1)
    
        expect(result).toBe(6)
    })
})