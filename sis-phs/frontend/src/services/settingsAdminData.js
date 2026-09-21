import { MOCK_ROLE_MENUS } from './mockMenus'

const initialPeriodRecords = [
  {
    id: 'PER-2026-01',
    year: 2026,
    name: 'Periode Pendataan Semester 1',
    type: 'REGULAR',
    startDate: '2026-01-10',
    endDate: '2026-06-30',
    targetHouseholds: 14500,
    targetPercentage: 82,
    status: 'ACTIVE',
    note: 'Periode utama pendataan keluarga sehat semester 1.',
    updatedAt: '2026-06-09T14:30:00+07:00',
    updatedBy: 'Super Admin',
  },
  {
    id: 'PER-2026-02',
    year: 2026,
    name: 'Follow Up Intervensi Semester 2',
    type: 'FOLLOW_UP',
    startDate: '2026-07-10',
    endDate: '2026-11-30',
    targetHouseholds: 8200,
    targetPercentage: 48,
    status: 'DRAFT',
    note: 'Disiapkan untuk monitoring keluarga prioritas.',
    updatedAt: '2026-06-08T10:15:00+07:00',
    updatedBy: 'Admin Kabupaten',
  },
  {
    id: 'PER-2025-01',
    year: 2025,
    name: 'Periode Pendataan Tahunan 2025',
    type: 'REGULAR',
    startDate: '2025-01-15',
    endDate: '2025-10-30',
    targetHouseholds: 13800,
    targetPercentage: 96,
    status: 'CLOSED',
    note: 'Periode selesai dan terkunci untuk finalisasi rekap.',
    updatedAt: '2025-12-22T16:05:00+07:00',
    updatedBy: 'Super Admin',
  },
  {
    id: 'PER-2025-02',
    year: 2025,
    name: 'Pilot Validasi Wilayah Sulit',
    type: 'PILOT',
    startDate: '2025-11-05',
    endDate: '2025-12-20',
    targetHouseholds: 2600,
    targetPercentage: 22,
    status: 'CLOSED',
    note: 'Pilot untuk desa dengan backlog validasi tertinggi.',
    updatedAt: '2025-12-28T09:20:00+07:00',
    updatedBy: 'Admin Dinkes',
  },
  {
    id: 'PER-2024-01',
    year: 2024,
    name: 'Periode Pendataan Tahunan 2024',
    type: 'REGULAR',
    startDate: '2024-02-01',
    endDate: '2024-11-15',
    targetHouseholds: 13200,
    targetPercentage: 91,
    status: 'CLOSED',
    note: 'Data historis baseline sebelum implementasi penuh admin.',
    updatedAt: '2024-11-20T11:40:00+07:00',
    updatedBy: 'Super Admin',
  },
  {
    id: 'PER-2026-03',
    year: 2026,
    name: 'Periode Validasi Cepat Triwulan 4',
    type: 'SPECIAL',
    startDate: '2026-10-01',
    endDate: '2026-12-15',
    targetHouseholds: 4100,
    targetPercentage: 35,
    status: 'DRAFT',
    note: 'Aktivasi menunggu keputusan final target tambahan.',
    updatedAt: '2026-06-10T08:20:00+07:00',
    updatedBy: 'Admin Kabupaten',
  },
]

const periodTypeMeta = {
  REGULAR: { label: 'Reguler', tone: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300' },
  FOLLOW_UP: { label: 'Follow Up', tone: 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300' },
  PILOT: { label: 'Pilot', tone: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300' },
  SPECIAL: { label: 'Khusus', tone: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
}

const periodStatusMeta = {
  ACTIVE: { label: 'Aktif', tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
  DRAFT: { label: 'Draft', tone: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200' },
  CLOSED: { label: 'Ditutup', tone: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' },
}

const initialRoles = [
  {
    id: 'admin',
    name: 'Super Admin',
    description: 'Akses penuh untuk konfigurasi, validasi, dan audit tingkat kabupaten.',
    status: 'ACTIVE',
    updatedAt: '2026-06-09T14:10:00+07:00',
    updatedBy: 'Root System',
  },
  {
    id: 'dinkes',
    name: 'Dinas Kesehatan',
    description: 'Mengakses dashboard, peta, rekap, dan monitoring agregat lintas wilayah.',
    status: 'ACTIVE',
    updatedAt: '2026-06-08T16:45:00+07:00',
    updatedBy: 'Super Admin',
  },
  {
    id: 'puskesmas',
    name: 'Admin Puskesmas',
    description: 'Fokus pada verifikasi, kader wilayah, dan monitoring intervensi operasional.',
    status: 'ACTIVE',
    updatedAt: '2026-06-08T09:30:00+07:00',
    updatedBy: 'Super Admin',
  },
  {
    id: 'kader',
    name: 'Surveyor / Kader',
    description: 'Akses input lapangan, riwayat survei, jadwal, dan log edukasi.',
    status: 'ACTIVE',
    updatedAt: '2026-06-07T13:20:00+07:00',
    updatedBy: 'Admin Puskesmas',
  },
  {
    id: 'auditor',
    name: 'Auditor Internal',
    description: 'Mode baca untuk audit trail, laporan, dan pengawasan perubahan penting.',
    status: 'INACTIVE',
    updatedAt: '2026-05-28T15:00:00+07:00',
    updatedBy: 'Super Admin',
  },
]

const roleBadgeMeta = {
  admin: { label: 'Admin', tone: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300' },
  dinkes: { label: 'Dinkes', tone: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300' },
  puskesmas: { label: 'Puskesmas', tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
  kader: { label: 'Kader', tone: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
}

function createMenuId(path) {
  return path
    .replace(/^\//, '')
    .replaceAll('/', '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
}

function flattenRoleMenus() {
  const uniqueMenus = new Map()
  const rolePermissions = {}
  const adminGroups = MOCK_ROLE_MENUS.admin
    .filter((item) => Array.isArray(item.children) && item.children.length > 0)
    .map((item) => ({
      id: createMenuId(`group-${item.title}`),
      title: item.title,
      children: item.children,
    }))

  Object.entries(MOCK_ROLE_MENUS).forEach(([roleId, menuItems]) => {
    const permissionIds = []

    menuItems.forEach((item) => {
      const nodes = Array.isArray(item.children) && item.children.length > 0
        ? item.children.map((child) => ({ ...child, parentTitle: item.title }))
        : [{ title: item.title, path: item.path, parentTitle: item.title }]

      nodes.forEach((node) => {
        if (!node.path) return

        const id = createMenuId(node.path)
        const current = uniqueMenus.get(id)

        if (!current) {
          uniqueMenus.set(id, {
            id,
            title: node.title,
            path: node.path,
            sourceLabel: node.parentTitle,
            roleIds: [roleId],
          })
        } else if (!current.roleIds.includes(roleId)) {
          current.roleIds.push(roleId)
        }

        permissionIds.push(id)
      })
    })

    rolePermissions[roleId] = permissionIds
  })

  const assignedMenuIds = new Set()
  const menuGroups = adminGroups.map((group) => {
    const children = group.children
      .map((child) => uniqueMenus.get(createMenuId(child.path)))
      .filter(Boolean)
      .map((item) => {
        assignedMenuIds.add(item.id)
        return {
          id: item.id,
          title: item.title,
          path: item.path,
          sourceLabel: item.sourceLabel,
          roleIds: item.roleIds.sort(),
          isDashboard: group.title === 'Dashboard',
          isSurveyFlow: group.title === 'Survei',
          isSettings: group.title === 'Pengaturan Sistem',
        }
      })

    return {
      id: group.id,
      title: group.title,
      description: '',
      children,
    }
  }).filter((group) => group.children.length > 0)

  const remainingMenus = Array.from(uniqueMenus.values())
    .filter((item) => !assignedMenuIds.has(item.id))
    .sort((left, right) => left.title.localeCompare(right.title, 'id-ID'))

  if (remainingMenus.length > 0) {
    menuGroups.push({
      id: createMenuId('group-lainnya'),
      title: 'Lainnya',
      description: '',
      children: remainingMenus.map((item) => ({
        id: item.id,
        title: item.title,
        path: item.path,
        sourceLabel: item.sourceLabel,
        roleIds: item.roleIds.sort(),
        isDashboard: false,
        isSurveyFlow: false,
        isSettings: false,
      })),
    })
  }

  return {
    menuGroups,
    permissions: {
      ...rolePermissions,
      admin: menuGroups.flatMap((group) => group.children.map((item) => item.id)),
    },
  }
}

const { menuGroups: initialMenuGroups, permissions: roleDerivedPermissions } = flattenRoleMenus()

const initialPermissions = {
  ...roleDerivedPermissions,
  auditor: [
    createMenuId('/admin/settings/audit'),
    createMenuId('/admin/reports/survey-progress'),
    createMenuId('/admin/reports/survey-indicators'),
    createMenuId('/admin/reports/iks-wilayah'),
  ],
}

const initialAuditRecords = [
  {
    id: 'AUD-20260610-001',
    timestamp: '2026-06-10T09:42:00+07:00',
    userName: 'Rina Pratiwi',
    role: 'Super Admin',
    roleKey: 'admin',
    module: 'Periode & Target Tahunan',
    moduleKey: 'settings-periods',
    actionType: 'UPDATE_PERIOD',
    actionLabel: 'Menutup periode pendataan semester 1',
    entityName: 'PER-2026-01',
    entityLabel: 'Periode Pendataan Semester 1',
    ipAddress: '10.24.18.11',
    status: 'SUCCESS',
    device: 'Chrome 137 / Windows 11',
    route: '/admin/settings/periods',
    note: 'Periode ditutup setelah seluruh backlog validasi selesai.',
    oldValue: '{"status":"ACTIVE","targetHouseholds":14500}',
    newValue: '{"status":"CLOSED","targetHouseholds":14500}',
  },
  {
    id: 'AUD-20260610-002',
    timestamp: '2026-06-10T08:25:00+07:00',
    userName: 'Yusuf Maulana',
    role: 'Admin Puskesmas',
    roleKey: 'puskesmas',
    module: 'Validasi Data',
    moduleKey: 'survey-validation',
    actionType: 'APPROVAL',
    actionLabel: 'Menyetujui survei keluarga prioritas',
    entityName: 'SV-2026-0004',
    entityLabel: 'Survei Keluarga Sulastri',
    ipAddress: '10.24.30.4',
    status: 'SUCCESS',
    device: 'Edge 136 / Windows 10',
    route: '/puskesmas/surveys/verification',
    note: 'Persetujuan validasi selesai tanpa catatan tambahan.',
    oldValue: '{"status":"SUBMITTED"}',
    newValue: '{"status":"APPROVED"}',
  },
  {
    id: 'AUD-20260609-003',
    timestamp: '2026-06-09T16:10:00+07:00',
    userName: 'Dewi Anggraini',
    role: 'Dinas Kesehatan',
    roleKey: 'dinkes',
    module: 'Laporan IKS Wilayah',
    moduleKey: 'report-iks',
    actionType: 'EXPORT',
    actionLabel: 'Export laporan IKS tingkat kecamatan',
    entityName: 'REPORT-IKS-06',
    entityLabel: 'Laporan IKS Juni 2026',
    ipAddress: '10.24.8.90',
    status: 'SUCCESS',
    device: 'Chrome 137 / macOS',
    route: '/dinkes/reports/aggregate',
    note: 'Export dipakai untuk rapat koordinasi kabupaten.',
    oldValue: '-',
    newValue: 'File XLS berhasil dibuat',
  },
  {
    id: 'AUD-20260609-004',
    timestamp: '2026-06-09T14:55:00+07:00',
    userName: 'Fajar Nugraha',
    role: 'Surveyor / Kader',
    roleKey: 'kader',
    module: 'Mulai Survei Baru',
    moduleKey: 'survey-new',
    actionType: 'CREATE',
    actionLabel: 'Menyimpan draft survei keluarga',
    entityName: 'DRF-2026-0144',
    entityLabel: 'Draft Survei Nurhayati',
    ipAddress: '172.16.1.8',
    status: 'SUCCESS',
    device: 'Chrome Android / Redmi Note',
    route: '/kader/surveys/new',
    note: 'Draft tersimpan saat koneksi jaringan tidak stabil.',
    oldValue: '-',
    newValue: '{"status":"DRAFT","household":"Nurhayati"}',
  },
  {
    id: 'AUD-20260609-005',
    timestamp: '2026-06-09T11:20:00+07:00',
    userName: 'Rina Pratiwi',
    role: 'Super Admin',
    roleKey: 'admin',
    module: 'Manajemen Role & Menu',
    moduleKey: 'settings-rbac',
    actionType: 'RBAC_SAVE',
    actionLabel: 'Menyimpan perubahan akses role auditor',
    entityName: 'ROLE-AUDITOR',
    entityLabel: 'Role Auditor Internal',
    ipAddress: '10.24.18.11',
    status: 'SUCCESS',
    device: 'Chrome 137 / Windows 11',
    route: '/admin/settings/rbac',
    note: 'Penambahan akses laporan indikator dan audit trail.',
    oldValue: '{"menus":["settings-audit","report-progress"]}',
    newValue: '{"menus":["settings-audit","report-progress","report-indicator","report-iks"]}',
  },
  {
    id: 'AUD-20260608-006',
    timestamp: '2026-06-08T19:05:00+07:00',
    userName: 'Sistem Otomatis',
    role: 'Service Account',
    roleKey: 'system',
    module: 'Sinkronisasi Data',
    moduleKey: 'sync-service',
    actionType: 'SYNC',
    actionLabel: 'Sinkronisasi batch gagal pada antrian ke-12',
    entityName: 'SYNC-QUEUE-12',
    entityLabel: 'Queue Pendataan Harian',
    ipAddress: '127.0.0.1',
    status: 'WARNING',
    device: 'Worker Laravel Queue',
    route: '/internal/jobs/sync',
    note: 'Timeout saat menarik metadata wilayah dari service internal.',
    oldValue: '{"retry":1}',
    newValue: '{"retry":2,"status":"queued"}',
  },
  {
    id: 'AUD-20260608-007',
    timestamp: '2026-06-08T09:45:00+07:00',
    userName: 'Yusuf Maulana',
    role: 'Admin Puskesmas',
    roleKey: 'puskesmas',
    module: 'Pengguna Kader',
    moduleKey: 'users-kader',
    actionType: 'LOGIN',
    actionLabel: 'Login berhasil dari kantor puskesmas',
    entityName: 'SESSION-9088',
    entityLabel: 'Sesi aplikasi aktif',
    ipAddress: '10.24.30.4',
    status: 'SUCCESS',
    device: 'Edge 136 / Windows 10',
    route: '/login',
    note: 'Login dengan MFA perangkat kantor.',
    oldValue: '-',
    newValue: '{"session":"active"}',
  },
  {
    id: 'AUD-20260607-008',
    timestamp: '2026-06-07T20:25:00+07:00',
    userName: 'Dewi Anggraini',
    role: 'Dinas Kesehatan',
    roleKey: 'dinkes',
    module: 'Rekap PHBS Kabupaten',
    moduleKey: 'report-phs',
    actionType: 'EXPORT',
    actionLabel: 'Export rekap PHBS gagal karena filter kosong',
    entityName: 'REPORT-PHS-06',
    entityLabel: 'Rekap PHBS Juni 2026',
    ipAddress: '10.24.8.90',
    status: 'FAILED',
    device: 'Chrome 137 / macOS',
    route: '/admin/reports/phs-kabupaten',
    note: 'Sistem membatalkan export karena belum ada kecamatan terpilih.',
    oldValue: '-',
    newValue: 'ValidationError: district filter required',
  },
]

const auditStatusMeta = {
  SUCCESS: { label: 'Berhasil', tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
  WARNING: { label: 'Perhatian', tone: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
  FAILED: { label: 'Gagal', tone: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' },
}

const activityTypeMeta = {
  LOGIN: 'Login',
  CREATE: 'Create',
  UPDATE_PERIOD: 'Perubahan Periode',
  APPROVAL: 'Approval',
  EXPORT: 'Export',
  RBAC_SAVE: 'Perubahan Akses',
  SYNC: 'Sinkronisasi',
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value))
}

function paginateRecords(records, page = 1, perPage = 5) {
  const total = records.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * perPage

  return {
    data: records.slice(start, start + perPage),
    meta: {
      page: currentPage,
      perPage,
      total,
      totalPages,
      from: total === 0 ? 0 : start + 1,
      to: total === 0 ? 0 : Math.min(start + perPage, total),
    },
  }
}

function keywordMatcher(record, keyword, fields) {
  if (!keyword) return true

  const haystack = fields.map((field) => record[field] ?? '').join(' ').toLowerCase()
  return haystack.includes(keyword.toLowerCase())
}

export function createInitialSettingsAdminState() {
  return {
    periods: deepClone(initialPeriodRecords),
    roles: deepClone(initialRoles),
    menuGroups: deepClone(initialMenuGroups),
    permissions: deepClone(initialPermissions),
    audits: deepClone(initialAuditRecords),
  }
}

export function getPeriodOptions(records = initialPeriodRecords) {
  const years = Array.from(new Set(records.map((item) => item.year))).sort((a, b) => b - a)

  return {
    years: years.map((value) => ({ value: String(value), label: String(value) })),
    statuses: Object.entries(periodStatusMeta).map(([value, meta]) => ({ value, label: meta.label })),
    types: Object.entries(periodTypeMeta).map(([value, meta]) => ({ value, label: meta.label })),
    targetBands: [
      { value: 'HIGH', label: '>= 80%' },
      { value: 'MEDIUM', label: '50% - 79%' },
      { value: 'LOW', label: '< 50%' },
    ],
  }
}

export function getPeriodRecords({
  records = initialPeriodRecords,
  page = 1,
  perPage = 5,
  search = '',
  year = '',
  status = '',
  type = '',
  targetBand = '',
} = {}) {
  const filtered = records
    .filter((record) => keywordMatcher(record, search, ['id', 'name', 'note', 'updatedBy']))
    .filter((record) => (year ? String(record.year) === String(year) : true))
    .filter((record) => (status ? record.status === status : true))
    .filter((record) => (type ? record.type === type : true))
    .filter((record) => {
      if (!targetBand) return true
      if (targetBand === 'HIGH') return record.targetPercentage >= 80
      if (targetBand === 'MEDIUM') return record.targetPercentage >= 50 && record.targetPercentage < 80
      return record.targetPercentage < 50
    })
    .sort((left, right) => new Date(right.startDate) - new Date(left.startDate))

  return paginateRecords(filtered, page, perPage)
}

export function getPeriodStats(records = initialPeriodRecords) {
  const activePeriods = records.filter((item) => item.status === 'ACTIVE')
  const closedPeriods = records.filter((item) => item.status === 'CLOSED')
  const currentYear = Math.max(...records.map((item) => item.year))
  const currentYearRecords = records.filter((item) => item.year === currentYear)
  const currentYearTarget = currentYearRecords
    .reduce((total, item) => total + item.targetHouseholds, 0)
  const averageTargetPercentage = currentYearRecords.length > 0
    ? Math.round(currentYearRecords.reduce((total, item) => total + (item.targetPercentage || 0), 0) / currentYearRecords.length)
    : 0

  return {
    total: records.length,
    active: activePeriods.length,
    target: currentYearTarget,
    targetPercentage: averageTargetPercentage,
    closed: closedPeriods.length,
  }
}

export function getPeriodStatusMeta(status) {
  return periodStatusMeta[status] || periodStatusMeta.DRAFT
}

export function getPeriodTypeMeta(type) {
  return periodTypeMeta[type] || periodTypeMeta.REGULAR
}

export function getRoleOptions(menuGroups = initialMenuGroups) {
  return {
    statuses: [
      { value: 'ACTIVE', label: 'Aktif' },
      { value: 'INACTIVE', label: 'Nonaktif' },
    ],
    groups: menuGroups
      .map((group) => ({ value: group.id, label: group.title }))
      .sort((left, right) => left.label.localeCompare(right.label, 'id-ID')),
  }
}

export function getRoleSummaryStats({ roles = initialRoles, permissions = initialPermissions, menuGroups = initialMenuGroups } = {}) {
  const totalMenus = menuGroups.reduce((total, group) => total + group.children.length, 0)
  const mappedMenuIds = new Set(Object.values(permissions).flat())
  const activeRoles = roles.filter((role) => role.status === 'ACTIVE').length
  const dashboardMenus = menuGroups
    .flatMap((group) => group.children)
    .filter((item) => item.isDashboard).length
  const surveyMenus = menuGroups
    .flatMap((group) => group.children)
    .filter((item) => item.isSurveyFlow).length

  return {
    totalRoles: roles.length,
    activeRoles,
    totalMenus,
    mappedMenus: mappedMenuIds.size,
    dashboardMenus,
    surveyMenus,
  }
}

export function getRoleRecords({
  roles = initialRoles,
  permissions = initialPermissions,
  menuGroups = initialMenuGroups,
  page = 1,
  perPage = 4,
  search = '',
  status = '',
} = {}) {
  const groupByMenuId = Object.fromEntries(
    menuGroups.flatMap((group) => group.children.map((menu) => [menu.id, group.title]))
  )

  const enriched = roles.map((role) => {
    const menuIds = permissions[role.id] || []
    const modules = Array.from(new Set(menuIds.map((menuId) => groupByMenuId[menuId]).filter(Boolean)))

    return {
      ...role,
      totalMenus: menuIds.length,
      primaryModules: modules.slice(0, 2).join(', ') || 'Belum ada menu',
    }
  })

  const filtered = enriched
    .filter((record) => keywordMatcher(record, search, ['name', 'description', 'updatedBy']))
    .filter((record) => (status ? record.status === status : true))
    .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))

  return paginateRecords(filtered, page, perPage)
}

export function getRoleBadgeMeta(roleId) {
  return roleBadgeMeta[roleId] || {
    label: String(roleId || 'Unknown'),
    tone: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  }
}

export function getAuditOptions(records = initialAuditRecords) {
  const roles = Array.from(new Set(records.map((item) => item.roleKey))).map((value) => {
    const match = records.find((item) => item.roleKey === value)
    return { value, label: match?.role || value }
  })

  const modules = Array.from(new Set(records.map((item) => item.moduleKey))).map((value) => {
    const match = records.find((item) => item.moduleKey === value)
    return { value, label: match?.module || value }
  })

  return {
    datePresets: [
      { value: 'ALL', label: 'Semua Waktu' },
      { value: 'TODAY', label: 'Hari Ini' },
      { value: 'LAST_7_DAYS', label: '7 Hari Terakhir' },
      { value: 'LAST_30_DAYS', label: '30 Hari Terakhir' },
    ],
    roles,
    modules,
    activityTypes: Object.entries(activityTypeMeta).map(([value, label]) => ({ value, label })),
  }
}

export function getAuditRecords({
  records = initialAuditRecords,
  page = 1,
  perPage = 6,
  search = '',
  datePreset = 'ALL',
  role = '',
  module = '',
  actionType = '',
} = {}) {
  const now = new Date('2026-06-10T23:59:59+07:00')

  const filtered = records
    .filter((record) => keywordMatcher(record, search, ['id', 'userName', 'actionLabel', 'entityLabel', 'ipAddress']))
    .filter((record) => (role ? record.roleKey === role : true))
    .filter((record) => (module ? record.moduleKey === module : true))
    .filter((record) => (actionType ? record.actionType === actionType : true))
    .filter((record) => {
      if (datePreset === 'ALL') return true
      const diffMs = now.getTime() - new Date(record.timestamp).getTime()
      const diffDays = diffMs / (1000 * 60 * 60 * 24)

      if (datePreset === 'TODAY') return diffDays < 1
      if (datePreset === 'LAST_7_DAYS') return diffDays <= 7
      if (datePreset === 'LAST_30_DAYS') return diffDays <= 30
      return true
    })
    .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))

  return paginateRecords(filtered, page, perPage)
}

export function getAuditStats(records = initialAuditRecords) {
  const startOfDay = new Date('2026-06-10T00:00:00+07:00')

  return {
    total: records.length,
    loginToday: records.filter((item) => item.actionType === 'LOGIN' && new Date(item.timestamp) >= startOfDay).length,
    dataChanges: records.filter((item) => ['CREATE', 'UPDATE_PERIOD', 'APPROVAL', 'RBAC_SAVE'].includes(item.actionType)).length,
    sensitive: records.filter((item) => ['EXPORT', 'RBAC_SAVE', 'UPDATE_PERIOD'].includes(item.actionType)).length,
  }
}

export function getAuditStatusMeta(status) {
  return auditStatusMeta[status] || auditStatusMeta.SUCCESS
}

export function getActivityTypeLabel(type) {
  return activityTypeMeta[type] || type
}
