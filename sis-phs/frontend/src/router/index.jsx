import { Navigate, Route, Routes } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState } from 'react'

import {
  getAuthSession,
  getBearerToken,
  getCurrentRole,
  isAuthenticated as checkIsAuthenticated,
  mapMeResponse,
  saveAuthSession,
  subscribeAuthChange,
} from '../services/auth'
import { canAccessRoute, getRoleHomePath } from '../modules/navigation/config'
import { apiRequest } from '../services/api'
import { AppErrorBoundary } from '../components/AppErrorBoundary'

const isAuthenticated = () => checkIsAuthenticated()
const getUserRole = () => getCurrentRole()

// Layout
import { AdminLayout } from '../layout/AdminLayout'

// Base Lazy Loaded Modules
const LoginPage = lazy(() => import('../modules/auth/LoginPage').then(m => ({ default: m.default })))
const DashboardSurveyor = lazy(() => import('../modules/dashboard/DashboardSurveyor').then(m => ({ default: m.default })))
const WizardForm = lazy(() => import('../modules/surveys/WizardForm').then(m => ({ default: m.default })))

// Surveyor Lazy Pages
const DraftSurveys = lazy(() => import('../modules/surveys/DraftSurveys'))
const HistorySurveys = lazy(() => import('../modules/surveys/HistorySurveys'))
const SurveySummary = lazy(() => import('../modules/surveys/SurveySummary'))
const InterventionSchedule = lazy(() => import('../modules/interventions/InterventionSchedule'))
const InterventionLog = lazy(() => import('../modules/interventions/InterventionLog'))
const WilayahBinaan = lazy(() => import('../modules/profile/WilayahBinaan'))
const ProfileKader = lazy(() => import('../modules/profile/ProfileKader'))
const DashboardPuskesmas = lazy(() => import('../modules/dashboard/DashboardPuskesmas'))
const DashboardAdmin = lazy(() => import('../modules/dashboard/DashboardAdmin'))
const DashboardDinkes = lazy(() => import('../modules/dashboard/DashboardDinkes'))
const ReportDesa = lazy(() => import('../modules/reports/ReportDesa'))
const ReportAggregate = lazy(() => import('../modules/reports/ReportAggregate'))
const ReportRankings = lazy(() => import('../modules/reports/ReportRankings'))

// Admin Lazy Pages
const SurveyValidation = lazy(() => import('../modules/surveys/SurveyValidation'))
const SurveyDatabase = lazy(() => import('../modules/surveys/SurveyDatabase'))
const InterventionMonitoring = lazy(() => import('../modules/interventions/InterventionMonitoring'))
const MasterQuestions = lazy(() => import('../modules/master/MasterQuestions'))
const MasterScoring = lazy(() => import('../modules/master/MasterScoring'))
const MasterRegions = lazy(() => import('../modules/master/MasterRegions'))
const MasterFaskes = lazy(() => import('../modules/master/MasterFaskes'))
const UserKader = lazy(() => import('../modules/users/UserKader'))
const UserAdmin = lazy(() => import('../modules/users/UserAdmin'))
const ReportIKS = lazy(() => import('../modules/reports/ReportIKS'))
const ReportSurveyProgress = lazy(() => import('../modules/reports/ReportSurveyProgress'))
const ReportSurveyIndicators = lazy(() => import('../modules/reports/ReportSurveyIndicators'))
const ReportPHSKabupaten = lazy(() => import('../modules/reports/ReportPHSKabupaten'))
const SystemSettings = lazy(() => import('../modules/settings/SystemSettings'))
const MasterRoleMenu = lazy(() => import('../modules/settings/MasterRoleMenu'))
const AuditLogs = lazy(() => import('../modules/settings/AuditLogs'))

function ProtectedRoute({ children, allowedRoles }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  const role = getUserRole()
  const currentPath = window.location.pathname
  const session = getAuthSession()
  const hasMenuTree = (session?.user?.menu_tree || []).length > 0

  if (currentPath && hasMenuTree && !canAccessRoute(currentPath, session)) {
    return <Navigate to={getRoleHomePath(role, session)} replace />
  }

  if (!hasMenuTree && allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={getRoleHomePath(role)} replace />
  }

  return children
}

function LegacyRedirect() {
  return <Navigate to={getRoleHomePath(getUserRole())} replace />
}

function RoleRoute({ path, element, title, allowedRoles }) {
  return (
    <Route path={path} element={
      <ProtectedRoute allowedRoles={allowedRoles}>
        <AdminLayout title={title}>{element}</AdminLayout>
      </ProtectedRoute>
    } />
  )
}

function RoleBasedReportsRedirect() {
  const role = getUserRole()
  if (role === 'puskesmas') return <Navigate to="/puskesmas/reports/desa" replace />
  if (role === 'dinkes') return <Navigate to="/dinkes/reports/aggregate" replace />
  if (role === 'admin') return <Navigate to="/admin/reports/survey-progress" replace />
  return <Navigate to={getRoleHomePath(role)} replace />
}

export function AppRouter() {
  const [authState, setAuthState] = useState(() => ({
    authenticated: isAuthenticated(),
    version: 0,
  }))

  useEffect(() => {
    const unsubscribe = subscribeAuthChange(() => {
      setAuthState((current) => ({
        authenticated: isAuthenticated(),
        version: current.version + 1,
      }))
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    let alive = true

    const bootstrapAuth = async () => {
      if (!authState.authenticated) return

      const session = getAuthSession()
      const token = getBearerToken()
      if (!session?.token || !token) return

      try {
        const response = await apiRequest('/auth/me')
        if (!alive) return

        const mappedUser = mapMeResponse(response)
        saveAuthSession({
          token: session.token,
          user: {
            ...response,
            ...mappedUser,
          },
        })
      } catch {
        // Auth cleanup is handled centrally by apiRequest.
      }
    }

    bootstrapAuth()

    return () => {
      alive = false
    }
  }, [authState.authenticated])

  return (
    <AppErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin"></div>
        </div>
      }>
        <Routes>
          <Route path="/login" element={authState.authenticated ? <Navigate to="/" replace /> : <LoginPage />} />
        
        {RoleRoute({ path: "/kader/dashboard", element: <DashboardSurveyor />, title: "Dashboard Kader", allowedRoles: ['kader', 'admin'] })}
        {RoleRoute({ path: "/kader/surveys/new", element: <WizardForm />, title: "Mulai Survei Baru", allowedRoles: ['kader', 'admin'] })}
        {RoleRoute({ path: "/kader/surveys/drafts", element: <DraftSurveys />, title: "Draft Survei", allowedRoles: ['kader', 'admin'] })}
        {RoleRoute({ path: "/kader/surveys/history", element: <HistorySurveys />, title: "Riwayat Survei Saya", allowedRoles: ['kader', 'admin'] })}
        {RoleRoute({ path: "/kader/surveys/summary/:id", element: <SurveySummary />, title: "Ringkasan Survei", allowedRoles: ['kader', 'admin'] })}
        {RoleRoute({ path: "/kader/interventions/schedule", element: <InterventionSchedule />, title: "Jadwal Intervensi", allowedRoles: ['kader', 'admin'] })}
        {RoleRoute({ path: "/kader/interventions/log", element: <InterventionLog />, title: "Log Edukasi", allowedRoles: ['kader', 'admin'] })}
        {RoleRoute({ path: "/kader/profile/wilayah", element: <WilayahBinaan />, title: "Wilayah Binaan", allowedRoles: ['kader', 'admin'] })}
        {RoleRoute({ path: "/kader/profile/account", element: <ProfileKader />, title: "Pengaturan Akun" })}

        {RoleRoute({ path: "/puskesmas/dashboard", element: <DashboardPuskesmas />, title: "Dashboard Puskesmas", allowedRoles: ['puskesmas', 'admin'] })}
        {RoleRoute({ path: "/puskesmas/surveys/verification", element: <SurveyValidation />, title: "Verifikasi Data", allowedRoles: ['puskesmas', 'admin'] })}
        {RoleRoute({ path: "/puskesmas/interventions", element: <InterventionMonitoring />, title: "Pantauan Intervensi", allowedRoles: ['puskesmas', 'admin'] })}
        {RoleRoute({ path: "/puskesmas/reports/desa", element: <ReportDesa />, title: "Laporan Capaian Desa", allowedRoles: ['puskesmas', 'admin'] })}
        {RoleRoute({ path: "/puskesmas/users/kader", element: <UserKader />, title: "Kader Wilayah", allowedRoles: ['puskesmas', 'admin'] })}

        {RoleRoute({ path: "/dinkes/dashboard", element: <DashboardDinkes />, title: "Dashboard Analytics Dinkes", allowedRoles: ['dinkes', 'admin'] })}
        {RoleRoute({ path: "/dinkes/reports/aggregate", element: <ReportAggregate />, title: "Laporan Agregat Wilayah", allowedRoles: ['dinkes', 'admin'] })}
        {RoleRoute({ path: "/dinkes/reports/rankings", element: <ReportRankings />, title: "Ranking Puskesmas", allowedRoles: ['dinkes', 'admin'] })}

        {RoleRoute({ path: "/admin/dashboard", element: <DashboardAdmin />, title: "Dashboard Admin", allowedRoles: ['admin'] })}
        {RoleRoute({ path: "/admin/surveys/validation", element: <SurveyValidation />, title: "Validasi Data", allowedRoles: ['admin'] })}
        {RoleRoute({ path: "/admin/surveys/database", element: <SurveyDatabase />, title: "Database Survei", allowedRoles: ['admin'] })}
        {RoleRoute({ path: "/admin/surveys/interventions", element: <InterventionMonitoring />, title: "Monitoring Intervensi", allowedRoles: ['admin'] })}
        {RoleRoute({ path: "/admin/master/questions", element: <MasterQuestions />, title: "Kuesioner Survei", allowedRoles: ['admin'] })}
        {RoleRoute({ path: "/admin/master/scoring", element: <MasterScoring />, title: "Algoritma Skoring", allowedRoles: ['admin'] })}
        {RoleRoute({ path: "/admin/master/regions", element: <MasterRegions />, title: "Master Wilayah", allowedRoles: ['admin', 'dinkes', 'puskesmas'] })}
        {RoleRoute({ path: "/admin/master/faskes", element: <MasterFaskes />, title: "Fasilitas Kesehatan", allowedRoles: ['admin'] })}
        {RoleRoute({ path: "/admin/users/kader", element: <UserKader />, title: "Pengguna Kader", allowedRoles: ['admin'] })}
        {RoleRoute({ path: "/admin/users/admin", element: <UserAdmin />, title: "Admin Internal", allowedRoles: ['admin'] })}
        <Route path="/admin/reports" element={<Navigate to="/admin/reports/survey-progress" replace />} />
        {RoleRoute({ path: "/admin/reports/survey-progress", element: <ReportSurveyProgress />, title: "Progress & Coverage Survey", allowedRoles: ['admin'] })}
        {RoleRoute({ path: "/admin/reports/survey-indicators", element: <ReportSurveyIndicators />, title: "Capaian Indikator Survey", allowedRoles: ['admin'] })}
        {RoleRoute({ path: "/admin/reports/phs-kabupaten", element: <ReportPHSKabupaten />, title: "Rekap PHBS Kabupaten", allowedRoles: ['admin'] })}
        {RoleRoute({ path: "/admin/reports/iks-wilayah", element: <ReportIKS />, title: "Laporan IKS Wilayah", allowedRoles: ['admin'] })}
        {RoleRoute({ path: "/admin/settings/periods", element: <SystemSettings />, title: "Periode & Target Tahunan", allowedRoles: ['admin', 'dinkes', 'puskesmas'] })}
        {RoleRoute({ path: "/admin/settings/rbac", element: <MasterRoleMenu />, title: "Manajemen Role & Menu", allowedRoles: ['admin'] })}
        {RoleRoute({ path: "/admin/settings/audit", element: <AuditLogs />, title: "Audit Trail", allowedRoles: ['admin'] })}

        <Route path="/dashboard" element={<LegacyRedirect />} />
        <Route path="/survey/new" element={<Navigate to="/kader/surveys/new" replace />} />
        <Route path="/surveyor/draft" element={<Navigate to="/kader/surveys/drafts" replace />} />
        <Route path="/surveyor/history" element={<Navigate to="/kader/surveys/history" replace />} />
        <Route path="/surveyor/intervensi/jadwal" element={<Navigate to="/kader/interventions/schedule" replace />} />
        <Route path="/surveyor/intervensi/log" element={<Navigate to="/kader/interventions/log" replace />} />
        <Route path="/surveyor/wilayah-binaan" element={<Navigate to="/kader/profile/wilayah" replace />} />
        <Route path="/surveyor/profil" element={<Navigate to="/kader/profile/account" replace />} />
        <Route path="/reports" element={<RoleBasedReportsRedirect />} />

        {/* Root Redirect Logic */}
        <Route path="/" element={
          authState.authenticated ? (
            <Navigate to={getRoleHomePath(getUserRole())} replace />
          ) : <Navigate to="/login" replace />
        } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppErrorBoundary>
  )
}

