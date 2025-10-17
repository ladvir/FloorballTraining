import type {Activity} from "./Activity.ts";

export type TrainingGroup = {
    personsMax: number
    personsMin: number
    goaliesMin: number
    goaliesMax: number
    activity: Activity
    id: number
}