/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { AppLayout } from '../components/layout/AppLayout'

// Auth pages (kept eager - entry points)
import { LoginPage } from '../features/auth/LoginPage'

// Lazy-loaded feature pages
const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const TrainingsPage = lazy(() => import('../features/trainings/TrainingsPage').then(m => ({ default: m.TrainingsPage })))
const TrainingFormPage = lazy(() => import('../features/trainings/TrainingFormPage').then(m => ({ default: m.TrainingFormPage })))
const ActivitiesPage = lazy(() => import('../features/activities/ActivitiesPage').then(m => ({ default: m.ActivitiesPage })))
const ActivityFormPage = lazy(() => import('../features/activities/ActivityFormPage').then(m => ({ default: m.ActivityFormPage })))
const TeamsPage = lazy(() => import('../features/teams/TeamsPage').then(m => ({ default: m.TeamsPage })))
const TeamFormPage = lazy(() => import('../features/teams/TeamFormPage').then(m => ({ default: m.TeamFormPage })))
const SeasonFormPage = lazy(() => import('../features/seasons/SeasonFormPage').then(m => ({ default: m.SeasonFormPage })))
const ClubsPage = lazy(() => import('../features/clubs/ClubsPage').then(m => ({ default: m.ClubsPage })))
const MembersPage = lazy(() => import('../features/members/MembersPage').then(m => ({ default: m.MembersPage })))
const MemberDetailPage = lazy(() => import('../features/members/MemberDetailPage').then(m => ({ default: m.MemberDetailPage })))
const AppointmentsPage = lazy(() => import('../features/appointments/AppointmentsPage').then(m => ({ default: m.AppointmentsPage })))
const EquipmentPage = lazy(() => import('../features/equipment/EquipmentPage').then(m => ({ default: m.EquipmentPage })))
const PlacesPage = lazy(() => import('../features/places/PlacesPage').then(m => ({ default: m.PlacesPage })))
const SeasonsPage = lazy(() => import('../features/seasons/SeasonsPage').then(m => ({ default: m.SeasonsPage })))
const TagsPage = lazy(() => import('../features/tags/TagsPage').then(m => ({ default: m.TagsPage })))
const ProfilePage = lazy(() => import('../features/auth/ProfilePage').then(m => ({ default: m.ProfilePage })))
const AdminUsersPage = lazy(() => import('../features/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })))
const DrawingPage = lazy(() => import('../features/drawing/DrawingPage').then(m => ({ default: m.DrawingPage })))
const NotificationsPage = lazy(() => import('../features/notifications/NotificationsPage').then(m => ({ default: m.NotificationsPage })))
const RatingsPage = lazy(() => import('../features/ratings/RatingsPage').then(m => ({ default: m.RatingsPage })))
const TestLibraryPage = lazy(() => import('../features/testing/TestLibraryPage').then(m => ({ default: m.TestLibraryPage })))
const TestDefinitionFormPage = lazy(() => import('../features/testing/TestDefinitionFormPage').then(m => ({ default: m.TestDefinitionFormPage })))
const TestDefinitionDetailPage = lazy(() => import('../features/testing/TestDefinitionDetailPage').then(m => ({ default: m.TestDefinitionDetailPage })))
const RecordResultsPage = lazy(() => import('../features/testing/RecordResultsPage').then(m => ({ default: m.RecordResultsPage })))
const PlayerTestProfilePage = lazy(() => import('../features/testing/PlayerTestProfilePage').then(m => ({ default: m.PlayerTestProfilePage })))
const TeamMonitoringPage = lazy(() => import('../features/testing/TeamMonitoringPage').then(m => ({ default: m.TeamMonitoringPage })))
const ForgotPasswordPage = lazy(() => import('../features/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('../features/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))

function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      {children}
    </Suspense>
  )
}

function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

function AdminRoute() {
  const { isAdmin } = useAuthStore()
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />
}

function HeadCoachRoute() {
  const { isHeadCoach } = useAuthStore()
  return isHeadCoach ? <Outlet /> : <Navigate to="/" replace />
}

function CoachRoute() {
  const { isCoach } = useAuthStore()
  return isCoach ? <Outlet /> : <Navigate to="/" replace />
}

function SuspenseLayout() {
  return (
    <LazyPage>
      <Outlet />
    </LazyPage>
  )
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/forgot-password',
    element: <LazyPage><ForgotPasswordPage /></LazyPage>,
  },
  {
    path: '/reset-password',
    element: <LazyPage><ResetPasswordPage /></LazyPage>,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            element: <SuspenseLayout />,
            children: [
              { path: '/', element: <DashboardPage /> },
              { path: '/trainings', element: <TrainingsPage /> },
              // Training create/edit: Coach+
              {
                element: <CoachRoute />,
                children: [
                  { path: '/trainings/new', element: <TrainingFormPage /> },
                  { path: '/trainings/:id/edit', element: <TrainingFormPage /> },
                ],
              },
              { path: '/activities', element: <ActivitiesPage /> },
              { path: '/activities/new', element: <ActivityFormPage /> },
              { path: '/activities/:id/edit', element: <ActivityFormPage /> },
              { path: '/appointments', element: <AppointmentsPage /> },
              { path: '/ratings', element: <RatingsPage /> },
              // Testing: Coach+
              {
                element: <CoachRoute />,
                children: [
                  { path: '/testing', element: <TestLibraryPage /> },
                  { path: '/testing/new', element: <TestDefinitionFormPage /> },
                  { path: '/testing/:id', element: <TestDefinitionDetailPage /> },
                  { path: '/testing/:id/edit', element: <TestDefinitionFormPage /> },
                  { path: '/testing/:id/record', element: <RecordResultsPage /> },
                  { path: '/testing/player/:memberId', element: <PlayerTestProfilePage /> },
                  { path: '/testing/team/:teamId', element: <TeamMonitoringPage /> },
                ],
              },
              // Teams: Coach+
              {
                element: <CoachRoute />,
                children: [
                  { path: '/teams', element: <TeamsPage /> },
                ],
              },
              // Team create/edit, User management: HeadCoach+
              {
                element: <HeadCoachRoute />,
                children: [
                  { path: '/teams/new', element: <TeamFormPage /> },
                  { path: '/teams/:id/edit', element: <TeamFormPage /> },
                  { path: '/users', element: <AdminUsersPage /> },
                ],
              },
              { path: '/drawing', element: <DrawingPage /> },
              { path: '/notifications', element: <NotificationsPage /> },
              { path: '/profile', element: <ProfilePage /> },
              { path: '/settings', element: <ProfilePage /> },
              // HeadCoach+ routes
              {
                element: <HeadCoachRoute />,
                children: [
                  { path: '/members', element: <MembersPage /> },
                  { path: '/members/:id', element: <MemberDetailPage /> },
                ],
              },
              // Admin-only routes
              {
                element: <AdminRoute />,
                children: [
                  { path: '/clubs', element: <ClubsPage /> },
                  { path: '/places', element: <PlacesPage /> },
                  { path: '/equipment', element: <EquipmentPage /> },
                  { path: '/seasons', element: <SeasonsPage /> },
                  { path: '/seasons/new', element: <SeasonFormPage /> },
                  { path: '/seasons/:id/edit', element: <SeasonFormPage /> },
                  { path: '/tags', element: <TagsPage /> },
                ],
              },
              // Legacy redirect
              { path: '/admin/users', element: <Navigate to="/users" replace /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
], { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' })
