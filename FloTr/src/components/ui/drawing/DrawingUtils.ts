// Pomocné funkce pro vykreslování a zpracování bodů

export function chaikinSmoothAggressive(points: {x: number, y: number}[], iterations: number = 5, downsampleStep: number = 2): {x: number, y: number}[] {
    let pts = points.filter((_, i) => i % downsampleStep === 0);
    if (pts.length < 2) pts = points;
    for (let iter = 0; iter < iterations; iter++) {
        if (pts.length < 2) break;
        const newPts = [pts[0]];
        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[i];
            const p1 = pts[i + 1];
            const Q = { x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y };
            const R = { x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y };
            newPts.push(Q, R);
        }
        newPts.push(pts[pts.length - 1]);
        pts = newPts;
    }
    return pts;
}

export function pointsToSmoothPath(points: {x: number, y: number}[], iterations: number = 5, downsampleStep: number = 2) {
    const smooth = chaikinSmoothAggressive(points, iterations, downsampleStep);
    if (smooth.length < 2) return '';
    let d = `M ${smooth[0].x},${smooth[0].y}`;
    for (let i = 1; i < smooth.length; i++) {
        d += ` L ${smooth[i].x},${smooth[i].y}`;
    }
    return d;
}
