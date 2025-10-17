import type {ActivityTag} from "./ActivityTag.ts";
import type {ActivityEquipment} from "./ActivityEquipment.ts";
import type {ActivityAgeGroup} from "./ActivityAgeGroup.ts";

export type Activity = {
    activityTags: ActivityTag[]
    activityEquipments: ActivityEquipment[]
    activityMedium: any[]
    activityAgeGroups: ActivityAgeGroup[]
    name: string
    description: string
    personsMin: number
    personsMax: number
    goaliesMin: number
    goaliesMax: number
    durationMin: number
    durationMax: number
    intensity: number
    difficulty: number
    placeWidth: number
    placeLength: number
    environment: string
    id: number
}