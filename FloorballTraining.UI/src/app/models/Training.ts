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
    
    // Vrací pole TrainingGoal, které obsahuje pouze goal1, goal2, goal3 pokud mají hodnotu
}


export function getTrainingGoals(training: Training): TrainingGoal[] {
    const goals: TrainingGoal[] = [];
    if (training.trainingGoal1) goals.push(training.trainingGoal1);
    if (training.trainingGoal2) goals.push(training.trainingGoal2);
    if (training.trainingGoal3) goals.push(training.trainingGoal3);
    return goals;
}
