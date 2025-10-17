import type {TrainingGoal} from "./TrainingGoal.ts";
import type {TrainingAgeGroup} from "./TrainingAgeGroup.ts";
import type {TrainingPart} from "./TrainingPart.ts";

export type Training = {
    name: string
    description: any
    duration: number
    personsMin: number
    personsMax: number
    goaliesMin: number
    goaliesMax: number
    intensity: number
    difficulty: number
    commentBefore: any
    commentAfter: any
    environment: number
    trainingGoal1: TrainingGoal
    trainingGoal3?: TrainingGoal
    trainingGoal2?: TrainingGoal
    trainingAgeGroups: TrainingAgeGroup[]
    trainingParts: TrainingPart[]
    id: number;
}
