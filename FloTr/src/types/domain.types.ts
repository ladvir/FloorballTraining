// Auth
export type EffectiveRole = 'Admin' | 'ClubAdmin' | 'HeadCoach' | 'Coach' | 'User'

export interface UserClubMembership {
  clubId: number
  clubName: string
  memberId: number
  effectiveRole: EffectiveRole
  coachTeamIds: number[]
}

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
  clubMemberships: UserClubMembership[]
}

export interface UserPreferencesDto {
  defaultClubId: number | null
  defaultTeamId: number | null
}

export interface LoginRequest {
  email: string
  password: string
}

// Users
export interface UserClubMembershipInfo {
  clubId: number
  clubName: string
  memberId: number
  effectiveRole: string
}

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
  clubMemberships?: UserClubMembershipInfo[]
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
  gender?: number // 0=Male, 1=Female
  email?: string
  clubId?: number
  appUserId?: string
  hasClubRoleClubAdmin?: boolean
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
  clubId?: number | null
  clubName?: string
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

// Rating
export interface AppointmentRatingDto {
  id: number
  appointmentId: number
  appointmentName?: string
  appointmentStart?: string
  appointmentType?: number
  teamId?: number
  teamName?: string
  trainingName?: string
  userId: string
  userName?: string
  grade: number // 1-5 (1=best, 5=worst)
  comment?: string
  raterType: number // 0=Player, 1=Coach
  createdAt: string
}

export interface RatingStatsDto {
  totalRatings: number
  averageGrade: number
  gradeDistribution: number[] // [count_grade1, count_grade2, ..., count_grade5]
  ratedAppointments: number
  coachRatings: number
  playerRatings: number
}

// Dashboard
export interface DashboardDto {
  appointments: AppointmentDto[]
  totalTrainings: number
  draftTrainings: number
  completeTrainings: number
}

// Player Testing
export type TestType = number // 0=Number, 1=Grade
export type TestCategory = number // 0=Conditioning, 1=Technique, 2=Flexibility, 3=Readiness, 4=Goalkeeper, 5=BasicInfo
export type ColourCode = 'green' | 'yellow' | 'red' | null

export const TEST_TYPE_LABELS: Record<number, string> = { 0: 'Číselný', 1: 'Škála' }
export const TEST_CATEGORY_LABELS: Record<number, string> = {
  0: 'Kondice', 1: 'Technika', 2: 'Flexibilita', 3: 'Readiness', 4: 'Brankáři', 5: 'Základní údaje'
}
export const GENDER_LABELS: Record<number, string> = { 0: 'Muž', 1: 'Žena' }

export interface GradeOptionDto {
  id?: number
  testDefinitionId?: number
  label: string
  numericValue: number
  colour?: string
  sortOrder: number
}

export interface TestColourRangeDto {
  id?: number
  testDefinitionId?: number
  ageGroupId?: number
  ageGroupName?: string
  gender?: number
  greenFrom?: number
  greenTo?: number
  yellowFrom?: number
  yellowTo?: number
}

export interface TestDefinitionDto {
  id: number
  name: string
  description?: string
  testType: TestType
  category: TestCategory
  unit?: string
  higherIsBetter: boolean
  clubId?: number
  isTemplate: boolean
  sortOrder: number
  gradeOptions: GradeOptionDto[]
  colourRanges: TestColourRangeDto[]
  resultCount?: number
}

export interface TestResultDto {
  id: number
  testDefinitionId: number
  testName?: string
  memberId: number
  memberName?: string
  numericValue?: number
  gradeOptionId?: number
  gradeLabel?: string
  testDate: string
  note?: string
  recordedByUserId: string
  recordedByUserName?: string
  colourCode?: ColourCode
  createdAt: string
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
