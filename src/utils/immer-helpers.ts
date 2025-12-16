import { Draft, produce } from "immer"

import { Countdown, SquareData, State } from "core/types"

/**
 * Type-safe wrapper for Immer's produce function
 * Applies updates to State in an immutable way using structural sharing
 */
export const produceState = (
    state: State,
    updater: (draft: Draft<State>) => void,
): State => {
    return produce(state, updater)
}

/**
 * Helper to clone countdown immutably
 * Returns null if countdown is null, otherwise creates a shallow copy
 */
export const cloneCountdown = (
    countdown: Countdown | null,
): Countdown | null => {
    return countdown ? { ...countdown } : null
}

/**
 * Helper to clone square data immutably
 * Returns null for empty squares, otherwise creates a new tuple
 */
export const cloneSquareData = (
    square: SquareData | null,
): SquareData | null => {
    return square ? [square[0], square[1]] : null
}
