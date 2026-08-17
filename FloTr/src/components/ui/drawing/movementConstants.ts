export type MovementTool = {
  category: 'movement'
  toolId: string
  label: string
  stroke: string
  strokeWidth: number
  strokeDasharray: string
  arrow: boolean
}

const RUN_STROKE_DASH = '6,4'

export const movementTools: MovementTool[] = [
  {
    category: 'movement',
    toolId: 'run-straight',
    label: 'drawing.movementRunStraight',
    stroke: '#333',
    strokeWidth: 1.5,
    strokeDasharray: RUN_STROKE_DASH,
    arrow: true,
  },
  {
    category: 'movement',
    toolId: 'run-free',
    label: 'drawing.movementRunFree',
    stroke: '#333',
    strokeWidth: 1.5,
    strokeDasharray: RUN_STROKE_DASH,
    arrow: true,
  },
  {
    category: 'movement',
    toolId: 'shoot',
    label: 'drawing.movementShoot',
    stroke: '#700',
    strokeWidth: 1.5,
    strokeDasharray: '',
    arrow: true,
  },
  {
    category: 'movement',
    toolId: 'pass',
    label: 'drawing.movementPass',
    stroke: '#f2ab3f',
    strokeWidth: 1.5,
    strokeDasharray: '',
    arrow: true,
  },
]
