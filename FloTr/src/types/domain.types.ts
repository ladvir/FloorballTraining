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
  preferredLanguage?: string | null
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
  lastLoginAt?: string | null
}

export interface RecentLoginDto {
  id: string
  email: string
  firstName: string
  lastName: string
  lastLoginAt: string
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
  isIndividual?: boolean
  validationErrors?: string[]
  createdByUserId?: string
  createdByUserName?: string
  activitySignature?: string
  trainingGoal1?: TagDto
  trainingGoal2?: TagDto
  trainingGoal3?: TagDto
  trainingParts?: TrainingPartDto[]
  trainingAgeGroups?: AgeGroupDto[]
}

// Similarity
export type SimilarityTier = 'A' | 'B'

export interface SimilarTrainingDto {
  id: number
  name: string
  isDraft: boolean
  duration: number
  createdByUserId?: string
  createdByUserName?: string
  tier: SimilarityTier
  score: number
  matchedByAuthor: boolean
  matchedByClub: boolean
  appointmentCount: number
}

export interface DuplicateGroupDto {
  groupKey: string
  tier: SimilarityTier
  minScore: number
  trainings: SimilarTrainingDto[]
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
  data: string // base64 encoded image
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
  publicCalendarToken?: string | null
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

/** Lightweight team reference for a member (team-average scoping). */
export interface MemberTeamDto {
  id: number
  name?: string | null
  isPlayer: boolean
  isCoach: boolean
}

// Appointment
export interface RepeatingPatternDto {
  repeatingFrequency: number // 0=Once,1=Daily,2=Weekly,3=Monthly,4=Yearly
  interval: number
  startDate: string
  endDate?: string
}

export interface AppointmentMemberAssignmentDto {
  id: number
  memberId: number
  memberFirstName?: string
  memberLastName?: string
  isCompleted: boolean
  completedAt?: string
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
  testDefinitionIds?: number[]
  tests?: { id: number; name: string }[]
  isAssignedToMe?: boolean
  myAssignmentCompleted?: boolean
  memberAssignments?: AppointmentMemberAssignmentDto[]
  assignedMemberIds?: number[]
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

// Season planning (periodization): mesocycles + microcycles per team.
// phase: 0=Preparation 1=PreCompetition 2=Competition 3=Transition 4=Regeneration
// type:  0=Development 1=Stabilization 2=Tapering 3=Regeneration 4=Competition
export interface MicrocycleTrainingDto {
  id: number
  trainingId: number
  trainingName: string
  duration: number
  note?: string | null
  sortOrder: number
  scheduledCount: number
}

export interface MicrocycleDto {
  id: number
  mesocycleId: number
  name: string
  type: number
  startDate: string
  endDate: string
  goal?: string | null
  goalTagIds: number[]
  goalTags: TagDto[]
  recommendedTrainings: MicrocycleTrainingDto[]
}

export interface MesocycleDto {
  id: number
  teamId: number
  name: string
  phase: number
  startDate: string
  endDate: string
  goal?: string | null
  goalTagIds: number[]
  goalTags: TagDto[]
  microcycles: MicrocycleDto[]
}

export interface SeasonPlanDto {
  teamId: number
  teamName: string
  seasonId?: number | null
  seasonName?: string | null
  seasonStart?: string | null
  seasonEnd?: string | null
  mesocycles: MesocycleDto[]
}

export interface CycleCalendarDto {
  microcycleId: number
  mesocycleId: number
  mesocycleName: string
  phase: number
  microcycleName: string
  type: number
  startDate: string
  endDate: string
}

export interface TagCoverageDto {
  tagId: number
  tagName: string
  color: string
  matchedMinutes: number
  trainingsCount: number
}

export interface CycleEvaluationBlockDto {
  cycleId: number
  name: string
  from: string
  to: string
  trainingAppointmentsCount: number
  withLinkedTrainingCount: number
  totalTrainingMinutes: number
  goalMatchedMinutes: number
  goalCoveragePercent: number
  perTag: TagCoverageDto[]
  presentCount: number
  absentCount: number
  excusedCount: number
  unknownCount: number
  attendanceRatePercent: number
  averageGrade?: number | null
  ratingsCount: number
  coachAverageGrade?: number | null
  playerAverageGrade?: number | null
}

export interface TestProgressionDto {
  testDefinitionId: number
  name: string
  unit?: string | null
  higherIsBetter: boolean
  startAvg?: number | null
  endAvg?: number | null
  delta?: number | null
  improvedCount: number
  worsenedCount: number
  membersMeasuredBoth: number
}

export interface AppointmentRefDto {
  id: number
  name: string
  start: string
}

export interface MesocycleEvaluationDto {
  total: CycleEvaluationBlockDto
  microcycles: CycleEvaluationBlockDto[]
  testProgression: TestProgressionDto[]
  testingAppointments: AppointmentRefDto[]
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
  0: 'Kondice',
  1: 'Technika',
  2: 'Flexibilita',
  3: 'Readiness',
  4: 'Brankáři',
  5: 'Základní údaje',
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

// Lineups
export type SlotPosition = 0 | 1 | 2 | 3 | 4 | 5
// 0 = Goalie, 1 = RightDefender, 2 = LeftDefender, 3 = Center, 4 = LeftWing, 5 = RightWing

export const SLOT_POSITION_LABELS: Record<SlotPosition, string> = {
  0: 'B',
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
}

export const SLOT_POSITION_NAMES: Record<SlotPosition, string> = {
  0: 'Brankář',
  1: 'Pravý obránce',
  2: 'Levý obránce',
  3: 'Centr',
  4: 'Levé křídlo',
  5: 'Pravé křídlo',
}

export type FormationColorKey = 'blue' | 'emerald' | 'amber' | 'violet' | 'pink'

export const FORMATION_COLORS: FormationColorKey[] = ['blue', 'emerald', 'amber', 'violet', 'pink']

export interface FormationTemplateSlotDto {
  id: number
  position: SlotPosition
  x: number
  y: number
  sortOrder: number
}

export interface FormationTemplateDto {
  id: number
  clubId?: number | null
  name: string
  formationSize: number
  includesGoalie: boolean
  isBuiltIn: boolean
  slots: FormationTemplateSlotDto[]
}

export interface LineupRosterDto {
  id: number
  memberId?: number | null
  memberFirstName?: string | null
  memberLastName?: string | null
  manualName?: string | null
  isAvailable: boolean
  sortOrder: number
}

export interface LineupSlotDto {
  id: number
  position: SlotPosition
  rosterId?: number | null
}

export interface LineupFormationDto {
  id: number
  index: number
  label?: string | null
  colorKey: FormationColorKey | string
  slots: LineupSlotDto[]
}

export interface MatchLineupDto {
  id: number
  teamId: number
  teamName?: string | null
  appointmentId?: number | null
  appointmentName?: string | null
  appointmentStart?: string | null
  name: string
  formationTemplateId: number
  formationTemplate?: FormationTemplateDto | null
  formationCount: number
  isShared: boolean
  createdByUserId?: string | null
  createdByUserName?: string | null
  createdAt: string
  updatedAt: string
  roster: LineupRosterDto[]
  formations: LineupFormationDto[]
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

// Tournaments

export type TournamentFormat = 'round-robin' | 'round-robin-playoff' | 'round-robin-endless'

export interface TournamentTeamDto {
  id: number
  name: string
  sortOrder: number
}

export interface TournamentSpecialTaskDto {
  id: number
  name: string
  bonusPoints: number
}

export interface TournamentMatchDto {
  id: number
  round: number
  /** "rr" | "sf" | "3p" | "f" */
  stage: string
  field?: string | null
  homeTeamId?: number | null
  awayTeamId?: number | null
  played: boolean
  homeGoals: number
  awayGoals: number
  homeSpecialGoals: number
  awaySpecialGoals: number
  homeTaskIds: number[]
  awayTaskIds: number[]
}

export interface TournamentDto {
  id: number
  name: string
  format: TournamentFormat | string
  specialGoalBonusPoints: number
  fields: string[]
  clubId?: number | null
  createdByUserId?: string | null
  createdByUserName?: string | null
  createdAt: string
  updatedAt: string
  teams: TournamentTeamDto[]
  specialTasks: TournamentSpecialTaskDto[]
  matches: TournamentMatchDto[]
}

export interface TournamentSummary {
  id: number
  name: string
  format: string
  clubId?: number | null
  createdByUserId?: string | null
  createdAt: string
  updatedAt: string
  teamCount: number
  matchCount: number
  playedCount: number
}

// Stat Tracker

/** 0 = Match (tournament match or match appointment), 1 = Training */
export type StatEventCategory = 0 | 1

export const STAT_CATEGORY_LABELS: Record<number, string> = {
  0: 'Zápasy',
  1: 'Tréninky',
}

/** 0 = Player, 1 = Goalkeeper */
export type StatParticipantRole = 0 | 1

export interface StatTrackerParticipantDto {
  id: number
  memberId: number
  firstName?: string
  lastName?: string
  role: StatParticipantRole
  sortOrder: number
}

export interface StatTrackerMetricDto {
  id: number
  /** "goals" | "assists" | "saves" | "custom" */
  code: string
  name: string
  isGoalkeeper: boolean
  sortOrder: number
}

export interface StatTrackerEntryDto {
  id: number
  /** 0 = stat, 1 = score for home, 2 = score for opponent */
  kind: number
  participantId?: number | null
  metricId?: number | null
  delta: number
  period?: number | null
  createdAt: string
}

export interface StatTrackerAggregateDto {
  participantId: number
  metricId: number
  total: number
  /** Period -> total */
  byPeriod: Record<number, number>
}

export interface StatTrackerDto {
  id: number
  eventCategory: StatEventCategory
  tournamentMatchId?: number | null
  appointmentId?: number | null
  teamId: number
  teamName?: string | null
  seasonId?: number | null
  seasonName?: string | null
  matchLineupId?: number | null
  createdByUserId?: string | null
  createdByUserName?: string | null
  createdAt: string
  updatedAt: string
  opponentName?: string | null
  homeScore: number
  awayScore: number
  /** 1 = continuous, 2 = halves, 3 = thirds, 4 = quarters; null = not used */
  matchPeriodCount?: number | null
  matchPartDurationMinutes?: number | null
  currentPeriod?: number | null
  /** Per-period score breakdown (1-based) */
  homeScoreByPeriod: Record<number, number>
  awayScoreByPeriod: Record<number, number>
  eventName?: string | null
  eventDate?: string | null
  participants: StatTrackerParticipantDto[]
  metrics: StatTrackerMetricDto[]
  aggregates: StatTrackerAggregateDto[]
  recentEntries: StatTrackerEntryDto[]
}

export interface TeamStatMetricTemplateDto {
  id: number
  teamId: number
  name: string
  isGoalkeeper: boolean
  /** "match" | "training" | "both" */
  appliesTo: string
  sortOrder: number
}

/** Canadian scoring aggregate (match events only). Points = goals + assists, plusMinus = plus − minus. */
export interface ScoringSummaryDto {
  goals: number
  assists: number
  points: number
  plusMinus: number
  gamesPlayed: number
}

export interface StatTrackerEventSummaryDto {
  trackerId: number
  eventCategory: StatEventCategory
  tournamentMatchId?: number | null
  tournamentId?: number | null
  tournamentName?: string | null
  appointmentId?: number | null
  eventName?: string | null
  eventDate: string
  teamId: number
  teamName?: string | null
  seasonId?: number | null
  seasonName?: string | null
  metrics: Record<string, number>
  scoring?: ScoringSummaryDto | null
}

export interface PlayerStatsBySeasonDto {
  seasonId?: number | null
  seasonName?: string | null
  eventCategory: StatEventCategory
  eventCount: number
  totals: Record<string, number>
  scoring?: ScoringSummaryDto | null
  events: StatTrackerEventSummaryDto[]
}

export interface TeamPlayerSeasonRowDto {
  memberId: number
  firstName?: string
  lastName?: string
  eventCount: number
  totals: Record<string, number>
  scoring?: ScoringSummaryDto | null
}

export interface TeamStatsBySeasonDto {
  seasonId?: number | null
  seasonName?: string | null
  eventCategory: StatEventCategory
  eventCount: number
  totals: Record<string, number>
  players: TeamPlayerSeasonRowDto[]
}

export interface AuditLogDto {
  id: number
  userId?: string | null
  userEmail?: string | null
  action: string
  entityType?: string | null
  entityId?: string | null
  details?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  occurredAt: string
}

export interface PagedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export const STANDARD_STAT_METRICS: { code: string; name: string; isGoalkeeper: boolean }[] = [
  { code: 'goals', name: 'Góly', isGoalkeeper: false },
  { code: 'assists', name: 'Asistence', isGoalkeeper: false },
  { code: 'plus', name: 'Plus', isGoalkeeper: false },
  { code: 'minus', name: 'Mínus', isGoalkeeper: false },
  { code: 'saves', name: 'Zákroky', isGoalkeeper: true },
]

// Attendance
export type AttendanceStatus = 0 | 1 | 2 | 3
// 0 = Unknown, 1 = Present, 2 = Absent, 3 = Excused

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  0: 'Neznámý',
  1: 'Přítomen',
  2: 'Nepřítomen',
  3: 'Omluven',
}

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  0: 'text-gray-500',
  1: 'text-green-600',
  2: 'text-red-600',
  3: 'text-amber-600',
}

export interface AppointmentAttendanceDto {
  id: number
  appointmentId: number
  memberId: number
  memberFirstName?: string
  memberLastName?: string
  status: AttendanceStatus
  note?: string | null
  recordedAt: string
}

export interface AttendanceUpsertDto {
  memberId: number
  status: AttendanceStatus
  note?: string | null
}

export interface MemberAttendanceRecordDto {
  id: number
  appointmentId: number
  appointmentName?: string
  appointmentStart: string
  status: AttendanceStatus
  note?: string | null
}

export interface MemberAttendanceSummaryDto {
  memberId: number
  totalEvents: number
  present: number
  absent: number
  excused: number
  unknown: number
  attendanceRate: number
  recentRecords: MemberAttendanceRecordDto[]
}

export interface TeamAttendanceEventDto {
  appointmentId: number
  appointmentName?: string
  appointmentStart: string
  present: number
  absent: number
  excused: number
  unknown: number
  total: number
  memberAttendances: AppointmentAttendanceDto[]
}

export interface TeamMemberAttendanceSummaryDto {
  memberId: number
  memberFirstName?: string
  memberLastName?: string
  present: number
  absent: number
  excused: number
  unknown: number
  attendanceRate: number
}

export interface TeamAttendanceSummaryDto {
  teamId: number
  events: TeamAttendanceEventDto[]
  members: TeamMemberAttendanceSummaryDto[]
}

// KPI
export interface EventKpiDto {
  appointmentId: number
  name?: string
  start: string
  appointmentType: number
  avgRating?: number | null
  attendancePresent: number
  attendanceTotal: number
  attendancePct?: number | null
}

export interface MemberAttendanceKpiDto {
  memberId: number
  firstName?: string
  lastName?: string
  present: number
  eventsTotal: number
  attendancePct: number
}

export interface MemberScoringKpiDto {
  memberId: number
  firstName?: string
  lastName?: string
  goals: number
  assists: number
  points: number
  gamesPlayed: number
}

export interface KpiSummaryDto {
  eventsThisMonth: number
  eventsLast30Days: number
  upcomingNext30Days: number
  eventsByTypeLast30Days: Record<string, number>
  activeMembers: number
  avgRatingLast30Days?: number | null
  ratingCountLast30Days: number
  avgAttendancePctLast30Days?: number | null
  eventsWithAttendanceLast30Days: number
  recentEvents: EventKpiDto[]
  topAttendees: MemberAttendanceKpiDto[]
  topScorers: MemberScoringKpiDto[]
}

// Individual workouts
export interface IndividualWorkoutDto {
  id: number
  memberId: number
  title: string
  description?: string | null
  /** 0=Assigned, 1=Completed, 2=Skipped */
  status: number
  dueDate?: string | null
  assignedByUserId: string
  assignedAt: string
  completedAt?: string | null
  playerNote?: string | null
  isTeamWorkout: boolean
  isOverdue: boolean
}

export interface IndividualWorkoutCreateDto {
  title: string
  description?: string | null
  dueDate?: string | null
  isTeamWorkout?: boolean
}

export interface BulkWorkoutCreateDto {
  title: string
  description?: string | null
  dueDate?: string | null
  memberIds: number[]
}

export interface IndividualWorkoutStatusDto {
  /** 1=Completed, 2=Skipped */
  status: number
  playerNote?: string | null
}
