// Auth
export type EffectiveRole = 'Admin' | 'HeadCoach' | 'Coach' | 'User'

export interface AuthResponse {
  id: string
  token: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
  defaultClubId?: number | null
  defaultTeamId?: number | null
  effectiveRole: EffectiveRole
  clubId?: number | null
  coachTeamIds: number[]
}

export interface UserPreferencesDto {
  defaultClubId: number | null
  defaultTeamId: number | null
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName?: string
  lastName?: string
  clubId?: number
  requestedRole?: string
}

// Users
export interface UserDto {
  id: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
  effectiveRole: EffectiveRole
  clubName?: string
  clubId?: number
  memberId?: number
}

// Common
export interface PagedResult<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

// Training
export interface TrainingGroupDto {
  id: number
  activity?: ActivityDto
  personsMin?: number
  personsMax?: number
  goaliesMin?: number
  goaliesMax?: number
}

export interface TrainingPartDto {
  id: number
  name?: string
  description?: string
  order: number
  duration: number
  trainingGroups?: TrainingGroupDto[]
}

export interface TrainingDto {
  id: number
  name: string
  description?: string
  duration: number
  personsMin?: number
  personsMax?: number
  goaliesMin?: number
  goaliesMax?: number
  intensity?: number
  difficulty?: number
  commentBefore?: string
  commentAfter?: string
  environment?: number
  isDraft: boolean
  validationErrors?: string[]
  createdByUserId?: string
  createdByUserName?: string
  trainingGoal1?: TagDto
  trainingGoal2?: TagDto
  trainingGoal3?: TagDto
  trainingParts?: TrainingPartDto[]
  trainingAgeGroups?: AgeGroupDto[]
}

// Activity
export interface ActivityTagDto {
  id: number
  tagId?: number
  tag?: TagDto
}

export interface ActivityAgeGroupDto {
  id: number
  ageGroupId?: number
  ageGroup?: AgeGroupDto
}

export interface ActivityMediaDto {
  id: number
  activityId: number
  name: string
  mediaType: number // 0=Image, 1=Video, 2=URL
  data: string      // base64 encoded image
  preview: string
  path: string
  isThumbnail: boolean
}

export interface ActivityEquipmentDto {
  id: number
  activityId?: number
  equipmentId?: number
  equipment?: EquipmentDto
}

export interface ActivityDto {
  id: number
  name: string
  description?: string
  durationMin?: number
  durationMax?: number
  personsMin?: number
  personsMax?: number
  difficulty?: number
  intensity?: number
  environment?: string
  isDraft?: boolean
  validationErrors?: string[]
  createdByUserId?: string
  createdByUserName?: string
  activityTags?: ActivityTagDto[]
  activityAgeGroups?: ActivityAgeGroupDto[]
  activityEquipments?: ActivityEquipmentDto[]
  activityMedium?: ActivityMediaDto[]
}

// Team
export interface TeamMemberDto {
  id: number
  teamId: number
  memberId: number
  isCoach: boolean
  isPlayer: boolean
  member?: MemberDto
}

export interface TeamDto {
  id: number
  name: string
  ageGroupId?: number
  ageGroup?: AgeGroupDto
  clubId?: number
  seasonId?: number | null
  personsMin?: number
  personsMax?: number
  defaultTrainingDuration?: number
  maxTrainingDuration?: number
  maxTrainingPartDuration?: number
  minPartsDurationPercent?: number
  iCalUrl?: string
  appointments?: AppointmentDto[]
  teamMembers?: TeamMemberDto[]
}

// Club
export interface ClubDto {
  id: number
  name: string
  description?: string
  maxRegistrationRole?: string
}

export interface ClubPublicDto {
  id: number
  name: string
  maxRegistrationRole?: string
}

// Member
export interface MemberDto {
  id: number
  firstName: string
  lastName: string
  birthYear: number
  isActive: boolean
  email?: string
  clubId?: number
  appUserId?: string
  hasClubRoleManager?: boolean
  hasClubRoleSecretary?: boolean
  hasClubRoleMainCoach?: boolean
  hasClubRoleCoach?: boolean
}

// Appointment
export interface RepeatingPatternDto {
  repeatingFrequency: number // 0=Once,1=Daily,2=Weekly,3=Monthly,4=Yearly
  interval: number
  startDate: string
  endDate?: string
}

export interface AppointmentDto {
  id: number
  name?: string
  description?: string
  start: string
  end: string
  trainingId?: number
  trainingName?: string
  trainingTargets?: string
  teamId?: number
  ownerUserId?: string
  ownerUserName?: string
  locationId?: number
  locationName?: string
  appointmentType?: number // 0=Training,1=Camp,2=Promotion,3=Match,4=Other,5=Course,6=EventOrganization
  isPast?: boolean
  repeatingPattern?: RepeatingPatternDto
  parentAppointment?: AppointmentDto
  futureAppointments?: AppointmentDto[]
}

// Equipment
export interface EquipmentDto {
  id: number
  name: string
}

// Place
export interface PlaceDto {
  id: number
  name: string
  width?: number
  length?: number
  environment?: string
}

// Season
export interface SeasonDto {
  id: number
  name: string
  startDate: string
  endDate: string
  teams?: TeamDto[]
}

// Tag
export interface TagDto {
  id: number
  name: string
  color?: string
  parentTagId?: number
  isTrainingGoal?: boolean
}

// AgeGroup
export interface AgeGroupDto {
  id: number
  name: string
  description?: string
}

// Dashboard
export interface DashboardDto {
  appointments: AppointmentDto[]
  totalTrainings: number
  draftTrainings: number
  completeTrainings: number
}

// Role Request
export interface RoleRequestDto {
  id: number
  memberId: number
  memberName: string
  memberEmail: string
  clubName: string
  requestedRole: string
  status: number // 0=Pending, 1=Approved, 2=Rejected
  createdAt: string
}
