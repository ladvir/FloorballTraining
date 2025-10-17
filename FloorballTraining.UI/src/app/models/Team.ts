import type {AgeGroup} from "./Training.ts";
import type {Club} from "./Club.ts";
import type {TeamMember} from "./TeamMember.ts";

export type Team = {
    name: string
    ageGroup: AgeGroup
    ageGroupId: number
    club: Club
    clubId: number
    appointments: any[]
    teamMembers: TeamMember[]
    id: number
}