export type MovementType = {
    id: string,
    label: string,
    color: string,
    dash: string,
    arrow: boolean,
    strokeWidth: number
};

export const movementTypes: MovementType[] = [
    { id: 'run', label: 'Běh bez míčku', color: '#000', dash: '', arrow: true, strokeWidth:1 },
    { id: 'runWithBall', label: 'Běh s míčkem', color: '#1976d2', dash: '4 2', arrow: true, strokeWidth:1 },
    { id: 'pass', label: 'Přihrávka', color: 'dimgrey', dash: '2 6', arrow: true, strokeWidth:1 },
    { id: 'shot', label: 'Střela', color: '#d32f2f', dash: '', arrow: true, strokeWidth:1 }
];