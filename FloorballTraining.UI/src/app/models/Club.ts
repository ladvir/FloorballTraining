import type {Team} from "./Team.ts";

import type {Member} from "./Member.ts";

export type Club = {
    name: string
    teams: Team []
    members: Member[]
    id: number
}