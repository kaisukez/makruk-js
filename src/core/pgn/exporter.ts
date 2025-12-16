import { PgnExportOptions, PgnGame, PgnMove } from "core/pgn/types"

/**
 * Standard PGN tag order according to the Seven Tag Roster
 */
const STANDARD_TAG_ORDER = ['Event', 'Site', 'Date', 'Round', 'White', 'Black', 'Result'];

/**
 * Mapping of Numeric Annotation Glyphs to their symbolic representations
 */
const NAG_TO_SYMBOL: Record<number, string> = {
    1: '!',   // good move
    2: '?',   // bad move
    3: '!!',  // brilliant move
    4: '??',  // blunder
    5: '!?',  // interesting move
    6: '?!',  // dubious move
};

/**
 * Export a PGN game to a formatted PGN string
 *
 * @param game - The PGN game to export
 * @param options - Export options for formatting
 * @returns Formatted PGN string
 */
export function exportPgn(game: PgnGame, options?: PgnExportOptions): string {
    const opts: PgnExportOptions = {
        maxLineWidth: options?.maxLineWidth ?? 80,
        includeComments: options?.includeComments ?? true,
        includeVariations: options?.includeVariations ?? true,
        includeNags: options?.includeNags ?? true,
        prettyPrint: options?.prettyPrint ?? false,
    };

    const parts: string[] = [];

    // Format tags
    const tagsString = formatTags(game.tags);
    if (tagsString) {
        parts.push(tagsString);
    }

    // Format movetext
    const movetextString = formatMoveSequence(game.moves, opts);
    if (movetextString) {
        parts.push(movetextString);
    }

    // Add game result
    const result = game.result || game.tags.Result || '*';
    const lastPart = parts[parts.length - 1];
    if (lastPart && movetextString) {
        // Add result on same line as movetext if there's space
        parts[parts.length - 1] = lastPart + ' ' + result;
    } else {
        parts.push(result);
    }

    return parts.join('\n\n');
}

/**
 * Format tag pairs in standard PGN order
 *
 * @param tags - Record of tag key-value pairs
 * @returns Formatted tag pairs as a string
 */
function formatTags(tags: Record<string, string>): string {
    const lines: string[] = [];
    const processedKeys = new Set<string>();

    // First, add standard tags in order
    for (const key of STANDARD_TAG_ORDER) {
        if (key in tags) {
            lines.push(`[${key} "${tags[key]}"]`);
            processedKeys.add(key);
        }
    }

    // Then, add remaining tags alphabetically
    const remainingKeys = Object.keys(tags)
        .filter(key => !processedKeys.has(key))
        .sort();

    for (const key of remainingKeys) {
        lines.push(`[${key} "${tags[key]}"]`);
    }

    return lines.join('\n');
}

/**
 * Format a sequence of moves into PGN movetext
 *
 * @param moves - Array of moves to format
 * @param options - Export options
 * @returns Formatted movetext string
 */
function formatMoveSequence(moves: PgnMove[], options: PgnExportOptions): string {
    if (moves.length === 0) {
        return '';
    }

    const parts: string[] = [];
    let isBlackMove = false;

    for (let i = 0; i < moves.length; i++) {
        const move = moves[i];
        const moveString = formatSingleMove(move, options);

        if (options.prettyPrint && parts.length > 0) {
            parts.push('\n' + moveString);
        } else {
            parts.push(moveString);
        }

        isBlackMove = !isBlackMove;
    }

    const fullText = parts.join(' ');

    if (options.maxLineWidth && options.maxLineWidth > 0) {
        return wrapText(fullText, options.maxLineWidth);
    }

    return fullText;
}

/**
 * Format a single move with annotations
 *
 * @param move - The move to format
 * @param options - Export options
 * @returns Formatted move string
 */
function formatSingleMove(move: PgnMove, options: PgnExportOptions): string {
    const parts: string[] = [];

    // Add move number for white's moves
    if (move.moveNumber !== undefined) {
        parts.push(`${move.moveNumber}.`);
    }

    // Add the move in Standard Algebraic Notation
    parts.push(move.san);

    // Add NAGs (Numeric Annotation Glyphs)
    if (options.includeNags && move.nags && move.nags.length > 0) {
        for (const nag of move.nags) {
            const symbol = NAG_TO_SYMBOL[nag];
            if (symbol) {
                // Add symbol directly after the move
                parts[parts.length - 1] = parts[parts.length - 1] + symbol;
            } else {
                // Add NAG in numeric form
                parts.push(`$${nag}`);
            }
        }
    }

    // Add comment
    if (options.includeComments && move.comment) {
        parts.push(`{ ${move.comment} }`);
    }

    // Add variations
    if (options.includeVariations && move.variations && move.variations.length > 0) {
        for (const variation of move.variations) {
            const variationText = formatVariation(variation, options);
            parts.push(`( ${variationText} )`);
        }
    }

    return parts.join(' ');
}

/**
 * Format a variation (alternative move sequence)
 *
 * @param variation - Array of moves in the variation
 * @param options - Export options
 * @returns Formatted variation string
 */
function formatVariation(variation: PgnMove[], options: PgnExportOptions): string {
    if (variation.length === 0) {
        return '';
    }

    const parts: string[] = [];

    for (const move of variation) {
        // For variations, we need to include move number with black moves too
        // if it's the first move of the variation
        if (move.moveNumber !== undefined) {
            const moveString = formatSingleMove(move, options);
            parts.push(moveString);
        } else {
            const moveString = formatSingleMove(move, options);
            parts.push(moveString);
        }
    }

    return parts.join(' ');
}

/**
 * Wrap text to a maximum line width, preserving move boundaries
 *
 * @param text - Text to wrap
 * @param maxWidth - Maximum line width
 * @returns Wrapped text
 */
function wrapText(text: string, maxWidth: number): string {
    if (maxWidth <= 0 || text.length <= maxWidth) {
        return text;
    }

    const lines: string[] = [];
    const words = text.split(' ');
    let currentLine = '';

    for (const word of words) {
        // If adding this word would exceed the max width
        if (currentLine.length > 0 && currentLine.length + word.length + 1 > maxWidth) {
            // Save current line and start a new one
            lines.push(currentLine);
            currentLine = word;
        } else {
            // Add word to current line
            if (currentLine.length > 0) {
                currentLine += ' ' + word;
            } else {
                currentLine = word;
            }
        }
    }

    // Add the last line if it has content
    if (currentLine.length > 0) {
        lines.push(currentLine);
    }

    return lines.join('\n');
}
