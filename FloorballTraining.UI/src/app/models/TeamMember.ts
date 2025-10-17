import type {Member} from "./Member.ts";

export type TeamMember = {
    teamId: number
    team: any
    isCoach: boolean
    isPlayer: boolean
    memberId: number
    member: Member
    id: number
}