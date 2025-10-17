import type {TrainingGroup} from "./TrainingGroup.ts";

export type TrainingPart = {
    name: string
    description: any
    order: number
    duration: number
    trainingGroups: TrainingGroup[]
    id: number
}