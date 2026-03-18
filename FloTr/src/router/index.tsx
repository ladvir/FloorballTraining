import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { AppLayout } from '../components/layout/AppLayout'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { TrainingsPage } from '../features/trainings/TrainingsPage'
import { TrainingFormPage } from '../features/trainings/TrainingFormPage'
import { ActivitiesPage } from '../features/activities/ActivitiesPage'
import { ActivityFormPage } from '../features/activities/ActivityFormPage'
import { TeamsPage } from '../features/teams/TeamsPage'
import { TeamFormPage } from '../features/teams/TeamFormPage'
import { SeasonFormPage } from '../features/seasons/SeasonFormPage'
import { ClubsPage } from '../features/clubs/ClubsPage'
import { MembersPage } from '../features/members/MembersPage'
import { AppointmentsPage } from '../features/appointments/AppointmentsPage'
import { EquipmentPage } from '../features/equipment/EquipmentPage'
import { PlacesPage } from '../features/places/PlacesPage'
import { SeasonsPage } from '../features/seasons/SeasonsPage'
import { TagsPage } from '../features/tags/TagsPage'
import { ProfilePage } from '../features/auth/ProfilePage'
import { AdminUsersPage } from '../features/admin/AdminUsersPage'
import { DrawingPage } from '../features/drawing/DrawingPage'

function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

function AdminRoute() {
  const { isAdmin } = useAuthStore()
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/trainings', element: <TrainingsPage /> },
          { path: '/trainings/new', element: <TrainingFormPage /> },
          { path: '/trainings/:id/edit', element: <TrainingFormPage /> },
          { path: '/activities', element: <ActivitiesPage /> },
          { path: '/activities/new', element: <ActivityFormPage /> },
          { path: '/activities/:id/edit', element: <ActivityFormPage /> },
          { path: '/appointments', element: <AppointmentsPage /> },
          { path: '/teams', element: <TeamsPage /> },
          {
            element: <AdminRoute />,
            children: [
              { path: '/teams/new', element: <TeamFormPage /> },
              { path: '/teams/:id/edit', element: <TeamFormPage /> },
            ],
          },
          { path: '/drawing', element: <DrawingPage /> },
          { path: '/equipment', element: <EquipmentPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/settings', element: <ProfilePage /> },
          // Admin-only routes
          {
            element: <AdminRoute />,
            children: [
              { path: '/clubs', element: <ClubsPage /> },
              { path: '/members', element: <MembersPage /> },
              { path: '/places', element: <PlacesPage /> },
              { path: '/seasons', element: <SeasonsPage /> },
              { path: '/seasons/new', element: <SeasonFormPage /> },
              { path: '/seasons/:id/edit', element: <SeasonFormPage /> },
              { path: '/tags', element: <TagsPage /> },
              { path: '/admin/users', element: <AdminUsersPage /> },
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
