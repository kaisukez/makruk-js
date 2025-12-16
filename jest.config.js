/** @type {import('ts-jest').JestConfigWithTsJest} */

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src/'],
    modulePaths: ['<rootDir>/src'],
    moduleDirectories: ['node_modules', 'src'],
}