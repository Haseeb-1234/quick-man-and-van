/** Fraction of the total price charged as deposit. */
export const DEPOSIT_RATE = 0.35
export const REMAINDER_RATE = 1 - DEPOSIT_RATE

/** Human-readable percentages, e.g. "35" and "65". */
export const DEPOSIT_PERCENT = Math.round(DEPOSIT_RATE * 100)
export const REMAINDER_PERCENT = Math.round(REMAINDER_RATE * 100)
