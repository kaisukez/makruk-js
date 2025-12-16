/**
 * PGN (Portable Game Notation) type definitions
 */

/**
 * Represents a single move in PGN notation with optional annotations
 */
export interface PgnMove {
    /** Move number (e.g., 1, 2, 3...) - only present for white's moves */
    moveNumber?: number;

    /** Standard Algebraic Notation for the move (e.g., "e4", "Nf3", "Rxe5+") */
    san: string;

    /** Comment attached to this move (text between {}) */
    comment?: string;

    /** Numeric Annotation Glyphs - special symbols like $1 (good move), $2 (bad move) */
    nags?: number[];

    /** Recursive Annotation Variations - alternative move sequences (text in parentheses) */
    variations?: PgnMove[][];
}

/**
 * Represents a complete PGN game with metadata and moves
 */
export interface PgnGame {
    /** Tag pairs - metadata like [Event ""], [Site ""], [White ""], etc. */
    tags: Record<string, string>;

    /** Array of moves in the game */
    moves: PgnMove[];

    /** Game result - "1-0", "0-1", "1/2-1/2", or "*" (ongoing/unknown) */
    result?: string;
}

/**
 * Options for parsing PGN strings
 */
export interface PgnParseOptions {
    /** Whether to include comments in the parsed output (default: true) */
    includeComments?: boolean;

    /** Whether to include variations in the parsed output (default: true) */
    includeVariations?: boolean;

    /** Whether to include NAGs in the parsed output (default: true) */
    includeNags?: boolean;
}

/**
 * Options for exporting games to PGN format
 */
export interface PgnExportOptions {
    /** Maximum line width before wrapping (default: 80) */
    maxLineWidth?: number;

    /** Whether to include comments in the output (default: true) */
    includeComments?: boolean;

    /** Whether to include variations in the output (default: true) */
    includeVariations?: boolean;

    /** Whether to include NAGs in the output (default: true) */
    includeNags?: boolean;

    /** Whether to add newlines between moves for readability (default: false) */
    prettyPrint?: boolean;
}
