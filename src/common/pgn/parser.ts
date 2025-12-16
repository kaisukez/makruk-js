import { PgnGame, PgnMove, PgnParseOptions } from "common/pgn/types"

/**
 * Token types for PGN parsing
 */
type TokenType = 'MOVE_NUMBER' | 'MOVE' | 'COMMENT' | 'NAG' | 'VARIATION_START' | 'VARIATION_END' | 'RESULT';

interface Token {
    type: TokenType;
    value: string;
}

/**
 * NAG symbol to numeric mapping
 */
const NAG_SYMBOLS: Record<string, number> = {
    '!': 1,   // good move
    '?': 2,   // bad move
    '!!': 3,  // brilliant move
    '??': 4,  // blunder
    '!?': 5,  // interesting move
    '?!': 6,  // dubious move
};

/**
 * Parse PGN string into a structured game object
 * @param pgnString - The PGN string to parse
 * @param options - Parsing options
 * @returns Parsed PGN game
 */
export function parsePgn(pgnString: string, options?: PgnParseOptions): PgnGame {
    const opts: PgnParseOptions = {
        includeComments: options?.includeComments !== false,
        includeVariations: options?.includeVariations !== false,
        includeNags: options?.includeNags !== false,
    };

    // Split PGN into tags section and movetext section
    const { tagSection, movetext } = splitPgn(pgnString);

    // Parse tags
    const tags = parseTags(tagSection);

    // Tokenize and parse movetext
    const tokens = tokenizeMovetext(movetext);
    const { moves, result } = parseMoveSequence(tokens, opts);

    return {
        tags,
        moves,
        result,
    };
}

/**
 * Split PGN into tag section and movetext section
 */
function splitPgn(pgnString: string): { tagSection: string; movetext: string } {
    // Remove line comments (;comments)
    let cleaned = pgnString.replace(/;[^\n]*\n/g, '\n');

    // Find where tags end (last tag pair)
    const tagRegex = /\[([A-Za-z0-9_]+)\s+"([^"]*)"\]/g;
    let lastTagEnd = 0;
    let match;

    while ((match = tagRegex.exec(cleaned)) !== null) {
        lastTagEnd = match.index + match[0].length;
    }

    const tagSection = cleaned.substring(0, lastTagEnd);
    const movetext = cleaned.substring(lastTagEnd);

    return { tagSection, movetext };
}

/**
 * Parse tag pairs from the tag section
 */
function parseTags(tagSection: string): Record<string, string> {
    const tags: Record<string, string> = {};
    const tagRegex = /\[([A-Za-z0-9_]+)\s+"([^"]*)"\]/g;
    let match;

    while ((match = tagRegex.exec(tagSection)) !== null) {
        const key = match[1];
        const value = match[2];
        tags[key] = value;
    }

    return tags;
}

/**
 * Tokenize movetext into structured tokens
 */
function tokenizeMovetext(movetext: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < movetext.length) {
        const char = movetext[i];

        // Skip whitespace
        if (/\s/.test(char)) {
            i++;
            continue;
        }

        // Comments: { ... }
        if (char === '{') {
            const start = i + 1;
            let depth = 1;
            i++;
            while (i < movetext.length && depth > 0) {
                if (movetext[i] === '{') depth++;
                if (movetext[i] === '}') depth--;
                i++;
            }
            const comment = movetext.substring(start, i - 1).trim();
            tokens.push({ type: 'COMMENT', value: comment });
            continue;
        }

        // Variation start
        if (char === '(') {
            tokens.push({ type: 'VARIATION_START', value: '(' });
            i++;
            continue;
        }

        // Variation end
        if (char === ')') {
            tokens.push({ type: 'VARIATION_END', value: ')' });
            i++;
            continue;
        }

        // NAG: $1, $2, etc.
        if (char === '$') {
            i++;
            let num = '';
            while (i < movetext.length && /\d/.test(movetext[i])) {
                num += movetext[i];
                i++;
            }
            tokens.push({ type: 'NAG', value: num });
            continue;
        }

        // Symbolic NAGs and other text
        // Try to match move number, move, result, or NAG symbols
        let token = '';

        // Collect non-whitespace, non-special characters
        while (i < movetext.length && !/[\s({})$]/.test(movetext[i])) {
            token += movetext[i];
            i++;
        }

        if (token.length === 0) {
            i++;
            continue;
        }

        // Determine token type
        // Result
        if (token === '1-0' || token === '0-1' || token === '1/2-1/2' || token === '*') {
            tokens.push({ type: 'RESULT', value: token });
        }
        // Move number (e.g., "1.", "2...", etc.)
        else if (/^\d+\.+$/.test(token)) {
            tokens.push({ type: 'MOVE_NUMBER', value: token.replace(/\.+$/, '') });
        }
        // Check for NAG symbols at the end of a move
        else {
            // Extract NAG symbols from the end
            const nagMatch = token.match(/(.*?)(\?\?|!!|\?\!|\!\?|!|\?)$/);
            if (nagMatch) {
                const move = nagMatch[1];
                const nag = nagMatch[2];

                if (move.length > 0) {
                    tokens.push({ type: 'MOVE', value: move });
                }
                tokens.push({ type: 'NAG', value: NAG_SYMBOLS[nag].toString() });
            } else {
                // Regular move
                if (token.length > 0) {
                    tokens.push({ type: 'MOVE', value: token });
                }
            }
        }
    }

    return tokens;
}

/**
 * Parse a sequence of tokens into moves
 */
function parseMoveSequence(tokens: Token[], options: PgnParseOptions): { moves: PgnMove[], result?: string } {
    const moves: PgnMove[] = [];
    let i = 0;
    let currentMoveNumber: number | undefined = undefined;
    let result: string | undefined = undefined;

    while (i < tokens.length) {
        const token = tokens[i];

        // Move number
        if (token.type === 'MOVE_NUMBER') {
            currentMoveNumber = parseInt(token.value, 10);
            i++;
            continue;
        }

        // Move
        if (token.type === 'MOVE') {
            const move: PgnMove = {
                san: token.value,
            };

            // Only add move number for white's moves (when it's defined)
            if (currentMoveNumber !== undefined) {
                move.moveNumber = currentMoveNumber;
                currentMoveNumber = undefined; // Clear after using for white's move
            }

            i++;

            // Collect annotations for this move (comments, NAGs, variations)
            while (i < tokens.length) {
                const nextToken = tokens[i];

                if (nextToken.type === 'COMMENT') {
                    if (options.includeComments) {
                        move.comment = nextToken.value;
                    }
                    i++;
                }
                else if (nextToken.type === 'NAG') {
                    if (options.includeNags) {
                        if (!move.nags) {
                            move.nags = [];
                        }
                        move.nags.push(parseInt(nextToken.value, 10));
                    }
                    i++;
                }
                else if (nextToken.type === 'VARIATION_START') {
                    if (options.includeVariations) {
                        // Parse variation recursively
                        const { variation, endIndex } = parseVariation(tokens, i + 1, options);
                        if (!move.variations) {
                            move.variations = [];
                        }
                        move.variations.push(variation);
                        i = endIndex + 1; // Skip to after VARIATION_END
                    } else {
                        // Skip the entire variation
                        i = skipVariation(tokens, i + 1) + 1;
                    }
                }
                else {
                    // Not an annotation, break
                    break;
                }
            }

            moves.push(move);
            continue;
        }

        // Result
        if (token.type === 'RESULT') {
            result = token.value;
            i++;
            continue;
        }

        // Skip other tokens (shouldn't happen in well-formed PGN)
        i++;
    }

    return { moves, result };
}

/**
 * Parse a variation (recursive)
 */
function parseVariation(tokens: Token[], startIndex: number, options: PgnParseOptions): { variation: PgnMove[], endIndex: number } {
    const variationMoves: PgnMove[] = [];
    let i = startIndex;
    let currentMoveNumber: number | undefined = undefined;

    while (i < tokens.length) {
        const token = tokens[i];

        // End of variation
        if (token.type === 'VARIATION_END') {
            return { variation: variationMoves, endIndex: i };
        }

        // Move number
        if (token.type === 'MOVE_NUMBER') {
            currentMoveNumber = parseInt(token.value, 10);
            i++;
            continue;
        }

        // Move
        if (token.type === 'MOVE') {
            const move: PgnMove = {
                san: token.value,
            };

            if (currentMoveNumber !== undefined) {
                move.moveNumber = currentMoveNumber;
                currentMoveNumber = undefined;
            }

            i++;

            // Collect annotations
            while (i < tokens.length) {
                const nextToken = tokens[i];

                if (nextToken.type === 'COMMENT') {
                    if (options.includeComments) {
                        move.comment = nextToken.value;
                    }
                    i++;
                }
                else if (nextToken.type === 'NAG') {
                    if (options.includeNags) {
                        if (!move.nags) {
                            move.nags = [];
                        }
                        move.nags.push(parseInt(nextToken.value, 10));
                    }
                    i++;
                }
                else if (nextToken.type === 'VARIATION_START') {
                    if (options.includeVariations) {
                        // Nested variation
                        const { variation, endIndex } = parseVariation(tokens, i + 1, options);
                        if (!move.variations) {
                            move.variations = [];
                        }
                        move.variations.push(variation);
                        i = endIndex + 1;
                    } else {
                        i = skipVariation(tokens, i + 1) + 1;
                    }
                }
                else {
                    break;
                }
            }

            variationMoves.push(move);
            continue;
        }

        // Skip comments and NAGs that aren't attached to moves
        if (token.type === 'COMMENT' || token.type === 'NAG') {
            i++;
            continue;
        }

        // Nested variation start
        if (token.type === 'VARIATION_START') {
            if (options.includeVariations) {
                const { variation: _variation, endIndex } = parseVariation(tokens, i + 1, options);
                // This variation isn't attached to a move, so we skip it
                i = endIndex + 1;
            } else {
                i = skipVariation(tokens, i + 1) + 1;
            }
            continue;
        }

        i++;
    }

    // If we reach here, variation wasn't properly closed
    return { variation: variationMoves, endIndex: i };
}

/**
 * Skip a variation without parsing (for when includeVariations is false)
 */
function skipVariation(tokens: Token[], startIndex: number): number {
    let depth = 1;
    let i = startIndex;

    while (i < tokens.length && depth > 0) {
        if (tokens[i].type === 'VARIATION_START') {
            depth++;
        } else if (tokens[i].type === 'VARIATION_END') {
            depth--;
        }
        i++;
    }

    return i - 1; // Return index of the matching VARIATION_END
}
