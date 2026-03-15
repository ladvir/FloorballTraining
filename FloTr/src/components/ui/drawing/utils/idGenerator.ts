/**
 * Utility functions for generating unique IDs
 */

/**
 * Generates a unique ID using crypto.randomUUID if available, otherwise falls back to timestamp-based ID
 */
export function generateId(prefix: string = 'id'): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}


