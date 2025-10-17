export type Member = {
    name: string
    email: string
    club: any
    clubId: number
    hasClubRoleManager: boolean
    hasClubRoleSecretary: boolean
    hasClubRoleMainCoach: boolean
    memberTeamMembers: any[]
    id: number
}