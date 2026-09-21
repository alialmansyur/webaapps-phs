import { useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Shield,
  Trash2,
} from 'lucide-react'
import { AdminDataPageSkeleton } from '../../components/ui/AdminDataPageSkeleton'
import { Modal } from '../../components/ui/Modal'
import { useAdminPageSkeleton } from '../../hooks/useAdminPageSkeleton'
import { getRoleOptions } from '../../services/settingsAdminData'
import { ApiError } from '../../services/api'
import { getCurrentRole, refreshAuthSession } from '../../services/auth'
import {
  createRole,
  deleteRole,
  fetchRbacMatrix,
  saveRbacMatrix,
  updateRole,
} from '../../services/liveAdminApi'
import { toast } from 'react-toastify'

const defaultFilters = {
  group: '',
}

const defaultRoleForm = {
  name: '',
  key: '',
  description: '',
  status: 'ACTIVE',
}

function mapRoles(response) {
  return (response?.roles || []).map((role) => ({
    id: role.code,
    name: role.name,
    description: role.description,
    status: role.status,
    isSystem: Boolean(role.is_system),
    canDelete: Boolean(role.can_delete),
  }))
}

async function syncSidebarIfCurrentRoleChanged(roleCode) {
  if (!roleCode || getCurrentRole() !== roleCode) return
  await refreshAuthSession()
}

export default function MasterRoleMenu() {
  const { isLoading, triggerSkeleton } = useAdminPageSkeleton()
  const [roles, setRoles] = useState([])
  const [savedRoles, setSavedRoles] = useState([])
  const [menuGroups, setMenuGroups] = useState([])
  const [permissions, setPermissions] = useState({})
  const [savedPermissions, setSavedPermissions] = useState({})
  const [activeRoleId, setActiveRoleId] = useState('')
  const [expandedGroups, setExpandedGroups] = useState([])
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(defaultFilters)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [roleModalMode, setRoleModalMode] = useState('create')
  const [roleForm, setRoleForm] = useState(defaultRoleForm)
  const [isSubmittingRole, setIsSubmittingRole] = useState(false)
  const [isDeletingRole, setIsDeletingRole] = useState(false)

  const loadMatrix = async ({ nextActiveRoleId } = {}) => {
    const response = await fetchRbacMatrix()
    const nextRoles = mapRoles(response)
    const nextMenuGroups = response?.menu_groups || []
    const nextPermissions = response?.role_menus || {}
    const preferredRoleId = nextActiveRoleId && nextRoles.some((role) => role.id === nextActiveRoleId)
      ? nextActiveRoleId
      : nextRoles[0]?.id ?? ''

    setRoles(nextRoles)
    setSavedRoles(nextRoles)
    setMenuGroups(nextMenuGroups)
    setPermissions(nextPermissions)
    setSavedPermissions(nextPermissions)
    setActiveRoleId(preferredRoleId)
    setExpandedGroups(nextMenuGroups.map((group) => group.id))

    return response
  }

  useEffect(() => {
    loadMatrix().catch(() => {})
  }, [])

  const options = useMemo(() => getRoleOptions(menuGroups), [menuGroups])
  const activeRole = roles.find((role) => role.id === activeRoleId) || roles[0]
  const activePermissions = permissions[activeRole?.id] || []
  const hasUnsavedChanges = JSON.stringify(roles) !== JSON.stringify(savedRoles)
    || JSON.stringify(permissions) !== JSON.stringify(savedPermissions)

  const filteredGroups = useMemo(() => {
    return menuGroups
      .filter((group) => (filters.group ? group.id === filters.group : true))
      .map((group) => ({
        ...group,
        children: group.children.filter((child) => {
          if (!search) return true
          const haystack = `${group.title} ${child.title} ${child.path}`.toLowerCase()
          return haystack.includes(search.toLowerCase())
        }),
      }))
      .filter((group) => group.children.length > 0)
  }, [filters.group, menuGroups, search])

  const handleToggleGroup = (groupId) => {
    setExpandedGroups((current) => (
      current.includes(groupId)
        ? current.filter((item) => item !== groupId)
        : [...current, groupId]
    ))
  }

  const handleTogglePermission = (menuId) => {
    if (!activeRole) return

    setPermissions((current) => {
      const currentMenus = current[activeRole.id] || []
      const nextMenus = currentMenus.includes(menuId)
        ? currentMenus.filter((item) => item !== menuId)
        : [...currentMenus, menuId]

      return {
        ...current,
        [activeRole.id]: nextMenus,
      }
    })
  }

  const handleToggleGroupChildren = (group) => {
    if (!activeRole) return

    setPermissions((current) => {
      const currentMenus = current[activeRole.id] || []
      const childIds = group.children.map((item) => item.id)
      const allSelected = childIds.every((menuId) => currentMenus.includes(menuId))
      const nextMenus = allSelected
        ? currentMenus.filter((menuId) => !childIds.includes(menuId))
        : Array.from(new Set([...currentMenus, ...childIds]))

      return {
        ...current,
        [activeRole.id]: nextMenus,
      }
    })
  }

  const handleSave = () => {
    saveRbacMatrix(permissions).then(() => {
      setSavedRoles(roles)
      setSavedPermissions(permissions)
      toast.success(`Konfigurasi akses untuk role ${activeRole?.name} tersimpan.`)
      return syncSidebarIfCurrentRoleChanged(activeRole?.id)
    }).catch((error) => {
      toast.error(error instanceof ApiError ? error.message : 'Gagal menyimpan konfigurasi role.')
    })
  }

  const handleRefresh = () => {
    setSearch('')
    setFilters(defaultFilters)
    triggerSkeleton()
    loadMatrix({ nextActiveRoleId: activeRoleId }).catch(() => {})
  }

  const closeRoleModal = () => {
    setShowRoleModal(false)
    setRoleModalMode('create')
    setRoleForm(defaultRoleForm)
  }

  const openCreateRoleModal = () => {
    setRoleModalMode('create')
    setRoleForm(defaultRoleForm)
    setShowRoleModal(true)
  }

  const openEditRoleModal = () => {
    if (!activeRole) return

    setRoleModalMode('edit')
    setRoleForm({
      name: activeRole.name,
      key: activeRole.id,
      description: activeRole.description || '',
      status: activeRole.status,
    })
    setShowRoleModal(true)
  }

  const handleSubmitRole = async () => {
    const trimmedName = roleForm.name.trim()
    const normalizedKey = roleForm.key.trim().toLowerCase().replace(/\s+/g, '-')

    if (!trimmedName || !normalizedKey) return
    if (roleModalMode === 'create' && roles.some((role) => role.id === normalizedKey)) return

    setIsSubmittingRole(true)

    try {
      if (roleModalMode === 'edit' && activeRole) {
        await updateRole(activeRole.id, {
          name: trimmedName,
          description: roleForm.description.trim(),
          status: roleForm.status,
        })
        await loadMatrix({ nextActiveRoleId: activeRole.id })
        await syncSidebarIfCurrentRoleChanged(activeRole.id)
        toast.success(`Role ${trimmedName} berhasil diperbarui.`)
      } else {
        await createRole({
          code: normalizedKey,
          name: trimmedName,
          description: roleForm.description.trim() || 'Role baru untuk pengaturan akses halaman.',
          status: roleForm.status,
        })
        await loadMatrix({ nextActiveRoleId: normalizedKey })
        toast.success(`Role ${trimmedName} berhasil dibuat.`)
      }

      closeRoleModal()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal menyimpan role.')
    } finally {
      setIsSubmittingRole(false)
    }
  }

  const handleDeleteRole = async () => {
    if (!activeRole?.canDelete) return

    const confirmed = window.confirm(`Hapus role ${activeRole.name}?`)
    if (!confirmed) return

    setIsDeletingRole(true)

    try {
      await deleteRole(activeRole.id)
      await loadMatrix()
      toast.success(`Role ${activeRole.name} berhasil dihapus.`)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal menghapus role.')
    } finally {
      setIsDeletingRole(false)
    }
  }

  if (isLoading) {
    return (
      <AdminDataPageSkeleton
        title="Role Manager"
        description="Pemetaan role ke halaman sistem dalam bentuk tree table."
        icon={<Shield size={22} />}
        tableColumnCount={3}
        filterFieldCount={3}
        statCount={0}
        actionCount={2}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="master-card-shell flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="master-primary-icon p-3">
              <Shield size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Role Manager</h2>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                Pengaturan akses role dan halaman sistem.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleRefresh} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">
              <RefreshCcw size={16} />
              Refresh
            </button>

            <button type="button" onClick={openCreateRoleModal} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">
              <Plus size={16} />
              Tambah Role
            </button>
          </div>
        </div>
      </div>

      <div className="master-card-shell flex flex-col gap-4 p-6">
        <div className="grid items-end gap-3 md:grid-cols-2 xl:grid-cols-[220px_220px_1fr]">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Kategori</span>
            <select value={filters.group} onChange={(event) => setFilters((current) => ({ ...current, group: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
              <option value="">Semua Kategori</option>
              {options.groups.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Role</span>
            <select value={activeRoleId} onChange={(event) => setActiveRoleId(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
              {roles.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={openEditRoleModal} disabled={!activeRole} className="inline-flex h-[48px] items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">
              <Pencil size={16} />
              Edit Role
            </button>
            <button type="button" onClick={handleDeleteRole} disabled={!activeRole?.canDelete || isDeletingRole} className="inline-flex h-[48px] items-center justify-center gap-2 rounded-2xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/30 dark:text-rose-200 dark:hover:bg-rose-500/10">
              <Trash2 size={16} />
              {isDeletingRole ? 'Menghapus...' : 'Hapus Role'}
            </button>
            <button type="button" onClick={handleSave} disabled={!hasUnsavedChanges} className="master-primary-btn h-[48px] px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">
              <Save size={16} />
              Simpan
            </button>
          </div>
        </div>

        {hasUnsavedChanges ? (
          <div className="rounded-2xl border px-4 py-3 text-sm border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            {`Ada perubahan akses pada role ${activeRole?.name} yang belum disimpan.`}
          </div>
        ) : null}
      </div>

      <div className="master-card-shell flex flex-col overflow-hidden">
        <div className="border-b border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative w-full lg:max-w-md">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoComplete="off"
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari halaman atau route..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Menu / Halaman</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Route</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Akses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    Tidak ada halaman yang cocok dengan pencarian atau kategori aktif.
                  </td>
                </tr>
              ) : filteredGroups.map((group) => {
                const isExpanded = expandedGroups.includes(group.id)
                const childIds = group.children.map((item) => item.id)
                const activeCount = childIds.filter((menuId) => activePermissions.includes(menuId)).length
                const allSelected = childIds.length > 0 && activeCount === childIds.length

                return (
                  <FragmentRows
                    key={group.id}
                    rows={[
                      <tr key={`${group.id}-header`} className="bg-white dark:bg-slate-800">
                        <td className="px-5 py-3.5">
                          <button type="button" onClick={() => handleToggleGroup(group.id)} className="flex items-start gap-3 text-left">
                            <span className="mt-0.5 text-slate-400">
                              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </span>
                            <div className="font-semibold text-slate-800 dark:text-white">{group.title}</div>
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">-</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-center">
                            <ToggleBox checked={allSelected} onClick={() => handleToggleGroupChildren(group)} />
                          </div>
                        </td>
                      </tr>,
                      ...(isExpanded ? group.children.map((child) => {
                        const isChecked = activePermissions.includes(child.id)

                        return (
                          <tr key={child.id} className="bg-white dark:bg-slate-800">
                            <td className="px-5 py-3">
                              <div className="pl-8">
                                <div className="font-medium text-slate-800 dark:text-white">{child.title}</div>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-300">{child.path}</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center justify-center">
                                <ToggleBox checked={isChecked} onClick={() => handleTogglePermission(child.id)} />
                              </div>
                            </td>
                          </tr>
                        )
                      }) : []),
                    ]}
                  />
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={showRoleModal}
        title={roleModalMode === 'edit' ? 'Ubah Role' : 'Tambah Role Baru'}
        description={roleModalMode === 'edit'
          ? 'Perbarui identitas role tanpa mengubah struktur halaman.'
          : 'Buat role baru lalu lanjutkan pengaturan akses halaman pada tree table.'}
        onClose={closeRoleModal}
        footer={(
          <>
            <button type="button" onClick={closeRoleModal} className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">
              Batal
            </button>
            <button type="button" onClick={handleSubmitRole} disabled={isSubmittingRole || !roleForm.name.trim() || !roleForm.key.trim() || (roleModalMode === 'create' && roles.some((role) => role.id === roleForm.key.trim().toLowerCase().replace(/\s+/g, '-')))} className="master-primary-btn px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmittingRole ? 'Menyimpan...' : roleModalMode === 'edit' ? 'Simpan Perubahan' : 'Simpan Role'}
            </button>
          </>
        )}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Nama Role</span>
            <input
              autoComplete="off"
              type="text"
              value={roleForm.name}
              onChange={(event) => setRoleForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Contoh: Supervisor Wilayah"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Key Role</span>
            <input
              autoComplete="off"
              type="text"
              value={roleForm.key}
              onChange={(event) => setRoleForm((current) => ({ ...current, key: event.target.value }))}
              disabled={roleModalMode === 'edit'}
              placeholder="contoh: supervisor-wilayah"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-800"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Deskripsi</span>
            <textarea
              value={roleForm.description}
              onChange={(event) => setRoleForm((current) => ({ ...current, description: event.target.value }))}
              rows={4}
              placeholder="Jelaskan kebutuhan akses halaman untuk role ini."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Status</span>
            <select
              value={roleForm.status}
              onChange={(event) => setRoleForm((current) => ({ ...current, status: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Nonaktif</option>
            </select>
          </label>

          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400">
            {roleModalMode === 'edit'
              ? 'Key role dikunci agar integrasi route dan mapping akses tetap stabil. Pengaturan menu tetap dilakukan dari tree table utama.'
              : 'Role baru akan dibuat dengan akses halaman kosong, lalu dapat langsung Anda atur dari tree table di halaman ini.'}
          </div>
        </div>
      </Modal>
    </div>
  )
}

function ToggleBox({ checked, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-6 w-6 items-center justify-center rounded-md border transition-colors ${checked ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-300 bg-white text-transparent hover:border-slate-400 dark:border-slate-600 dark:bg-slate-900'}`}
      aria-pressed={checked}
    >
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.42l2.293 2.294 6.543-6.544a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    </button>
  )
}

function FragmentRows({ rows }) {
  return rows
}
