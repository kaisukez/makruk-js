/** @type {import('ts-jest').JestConfigWithTsJest} */

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src/'],
    moduleNameMapper: {
        '^bitboard/(.*)$': '<rootDir>/src/bitboard/$1',
        '^common/(.*)$': '<rootDir>/src/common/$1',
        '^0x88/(.*)$': '<rootDir>/src/0x88/$1',
    },
}
