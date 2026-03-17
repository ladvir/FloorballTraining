/**
 * Utility functions for generating ball positions
 */

export interface Ball {
    x: number;
    y: number;
}

const DEFAULT_BALL_RADIUS = 6;
const MIN_BALLS = 3;
const MAX_BALLS = 7;
const SPREAD_FACTOR_MULTIPLIER = 5;

/**
 * Generates random ball positions around a center point
 */
export function generateBalls(equipmentRadius?: number): Ball[] {
    const radius = equipmentRadius ?? DEFAULT_BALL_RADIUS;
    const numBalls = Math.floor(Math.random() * (MAX_BALLS - MIN_BALLS + 1)) + MIN_BALLS;
    const spreadFactor = radius * SPREAD_FACTOR_MULTIPLIER;
    
    return Array.from({ length: numBalls }).map(() => {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * spreadFactor;
        return {
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist
        };
    });
}


