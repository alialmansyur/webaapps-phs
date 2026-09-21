import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Download, Eye, FileUp, PencilLine, Plus, RefreshCcw, ShieldCheck, UserCog, KeyRound, Power, PowerOff } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { FilterBar } from '../../components/ui/FilterBar'
import { DataTable } from '../../components/ui/DataTable'
import { FilterPanel } from '../../components/ui/FilterPanel'
import { Modal } from '../../components/ui/Modal'
import { AdminDataPageSkeleton } from '../../components/ui/AdminDataPageSkeleton'
import { TableActionButton } from '../../components/ui/TableActionButton'
import { useAdminPageSkeleton } from '../../hooks/useAdminPageSkeleton'
import {
  fetchUserAdminOptions,
  fetchUserAdminRecords,
  fetchUserAdminStats,
  createUserAdmin,
  updateUserAdmin,
  updateUserAdminStatus,
  resetUserAdminPassword,
  searchFaskes,
} from '../../services/liveAdminApi'
import { toast } from 'react-toastify'

const defaultFilters = {
  role: '',
  status: '',
  puskesmas: null,
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function UserAdmin() {
  const { isLoading, triggerSkeleton } = useAdminPageSkeleton()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(defaultFilters)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [options, setOptions] = useState({ roles: [], statuses: [], districts: [], puskesmas: [] })
  const [data, setData] = useState([])
  const [meta, setMeta] = useState({ page: 1, perPage: 5, total: 0, totalPages: 1, from: 0, to: 0 })
  const [stats, setStats] = useState({ total: 0, active: 0, puskesmasAdmins: 0, districtLevel: 0 })
  const [isTableLoading, setIsTableLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    id: null, full_name: '', username: '', email: '', phone: '',
    role_code: '', district_id: '', puskesmas_id: '', is_active: true, password: ''
  })
  const [actionModal, setActionModal] = useState({ open: false, type: '', record: null })

  useEffect(() => {
    let alive = true

    Promise.all([
      fetchUserAdminOptions(),
      fetchUserAdminStats(),
    ]).then(([nextOptions, nextStats]) => {
      if (!alive) return
      setOptions(nextOptions)
      setStats(nextStats)
    }).catch(() => {})

    return () => {
      alive = false
    }
  }, [])

  const fetchRecords = useCallback(() => {
    let alive = true
    setIsTableLoading(true)
    fetchUserAdminRecords({
      page,
      per_page: 5,
      search,
      role: filters.role,
      status: filters.status,
      puskesmas_id: filters.puskesmas?.value || '',
    }).then((response) => {
      if (!alive) return
      setData(response?.data || [])
      setMeta(response?.meta || { page: 1, perPage: 5, total: 0, totalPages: 1, from: 0, to: 0 })
      setIsTableLoading(false)
    }).catch(() => {
      if (alive) setIsTableLoading(false)
    })
    return () => { alive = false }
  }, [filters.puskesmas, filters.role, filters.status, page, search])

  useEffect(() => {
    return fetchRecords()
  }, [fetchRecords])
  const activeFilterCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0)

  const handleFilterChange = (key, value) => {
    setFilters((current) => {
      return { ...current, [key]: value }
    })
    setPage(1)
  }

  const handleReset = () => {
    setSearch('')
    setFilters(defaultFilters)
    setPage(1)
  }

  const handleAddClick = () => {
    setFormData({
      id: null, full_name: '', username: '', email: '', phone: '',
      role_code: '', district_id: '', puskesmas_id: '', is_active: true, password: ''
    })
    setShowFormModal(true)
  }

  const handleEditClick = (record) => {
    setFormData({
      id: record.id,
      full_name: record.fullName,
      username: record.username,
      email: record.email || '',
      phone: record.phone || '',
      role_code: record.roleCode || '',
      district_id: record.districtId || '',
      puskesmas_id: String(record.puskesmasId || ''),
      is_active: record.isActive,
      password: '' // Kosongkan agar tidak mengubah password
    })
    setShowFormModal(true)
  }

  const handleFormSubmit = async () => {
    setIsSubmitting(true)
    try {
      const payload = { ...formData }
      if (!payload.puskesmas_id) payload.puskesmas_id = null
      if (!payload.district_id) payload.district_id = null
      
      if (formData.id) {
        await updateUserAdmin(formData.id, payload)
      } else {
        await createUserAdmin(payload)
      }
      setShowFormModal(false)
      
      const nextStats = await fetchUserAdminStats()
      setStats(nextStats)
      setPage(1)
      if (page === 1) fetchRecords()
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = (record) => {
    setActionModal({ open: true, type: 'status', record })
  }

  const handleResetPassword = (record) => {
    setActionModal({ open: true, type: 'reset', record })
  }

  const confirmAction = async () => {
    const { type, record } = actionModal
    if (!record) return

    setIsSubmitting(true)
    try {
      if (type === 'status') {
        await updateUserAdminStatus(record.id, !record.isActive)
        fetchRecords()
        const nextStats = await fetchUserAdminStats()
        setStats(nextStats)
        setActionModal({ open: false, type: '', record: null })
      } else if (type === 'reset') {
        const res = await resetUserAdminPassword(record.id)
        toast.success(`Berhasil mereset password. Token reset: ${res.data?.token || '-'}`)
        setActionModal({ open: false, type: '', record: null })
      }
    } catch (err) {
      toast.error(`Gagal ${type === 'status' ? 'mengubah status' : 'mereset password'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <AdminDataPageSkeleton
        title="Admin Internal"
        description="Manajemen akun admin pusat, dinkes, dan puskesmas untuk kebutuhan operasional."
        icon={<ShieldCheck size={22} />}
        tableColumnCount={8}
        filterFieldCount={4}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="master-card-shell flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-6">
        <div className="flex items-start gap-3">
          <div className="master-primary-icon p-3">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Admin Internal</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Manajemen akun admin pusat, dinkes, dan puskesmas untuk kebutuhan operasional.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              handleReset()
              triggerSkeleton()
            }}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCcw size={16} />
            Refresh Filter
          </button>
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <FileUp size={16} />
            Import Admin
          </button>
          <button
            type="button"
            onClick={handleAddClick}
            className="master-primary-btn px-4 py-3 text-sm font-semibold transition-colors"
          >
            <Plus size={16} />
            Tambah Admin
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Total Admin" value={String(stats.total)} subtitle="Akun internal terdaftar" color="blue" icon={<ShieldCheck size={22} />} />
        <StatCard title="Admin Aktif" value={String(stats.active)} subtitle="Dapat mengakses sistem" color="emerald" icon={<UserCog size={22} />} />
        <StatCard title="Admin Puskesmas" value={String(stats.puskesmasAdmins)} subtitle="Berbasis unit layanan" color="amber" icon={<ShieldCheck size={22} />} />
        <StatCard title="Akses Kabupaten" value={String(stats.districtLevel)} subtitle="Ruang lingkup dinkes/pusat" color="teal" icon={<ShieldCheck size={22} />} />
      </div>

      <div className="master-card-shell flex flex-col overflow-hidden">
        <FilterBar
          placeholder="Cari username, nama, role, instansi, atau cakupan..."
          onSearch={(value) => {
            setSearch(value)
            setPage(1)
          }}
          leftSlot={<div className="text-xs font-medium text-slate-500 dark:text-slate-400">{activeFilterCount > 0 ? `${activeFilterCount} filter aktif` : 'Belum ada filter aktif'}</div>}
        >
          <select
            value={filters.role}
            onChange={(event) => handleFilterChange('role', event.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white"
          >
            <option value="">Semua Role</option>
            {options.roles.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <button
            type="button"
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Download size={14} className="inline mr-2" />
            Export User
          </button>
        </FilterBar>

        <FilterPanel
          isOpen={showFilters}
          onToggle={() => setShowFilters((value) => !value)}
          onReset={handleReset}
          description="Filter berfungsi untuk menyaring data agar tampilan informasi lebih spesifik dan relevan."
        >
          <SelectField
            label="Role"
            value={filters.role}
            onChange={(value) => handleFilterChange('role', value)}
            options={[{ value: '', label: 'Semua Role' }, ...options.roles]}
          />
          <SelectField
            label="Status"
            value={filters.status}
            onChange={(value) => handleFilterChange('status', value)}
            options={[{ value: '', label: 'Semua Status' }, ...options.statuses]}
          />
          <AsyncSelectField
            label="Puskesmas"
            placeholder="Ketik nama puskesmas (min. 3 huruf)"
            value={filters.puskesmas}
            onChange={(val) => handleFilterChange('puskesmas', val)}
            fetchFn={searchFaskes}
          />
        </FilterPanel>

        <div className="p-6">
          <DataTable
            headers={['Username', 'Nama', 'Role', 'Instansi', 'Cakupan', 'Login Terakhir', 'Status', 'Aksi']}
            pagination={meta}
            onPageChange={setPage}
            emptyState="Tidak ada admin internal yang cocok dengan filter saat ini."
            isLoading={isTableLoading}
          >
            {data.map((record) => (
              <tr key={record.id} className="align-top hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-mono text-sm text-slate-800 dark:text-white">{record.username}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{record.email}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-800 dark:text-white">{record.fullName}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{record.phone}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.roleLabel}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.institution}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                  <div>{record.scopeLabel}</div>
                  <div className="text-slate-500 dark:text-slate-400">{record.scopeType}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{formatDateTime(record.lastLoginAt)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-bold ${record.isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200'}`}>
                    {record.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <TableActionButton icon={<Eye size={16} />} label="Detail" onClick={() => setSelectedUser(record)} />
                    <TableActionButton icon={<PencilLine size={16} />} label="Edit" onClick={() => handleEditClick(record)} tone="primary" />
                    <TableActionButton icon={record.isActive ? <PowerOff size={16} /> : <Power size={16} />} label={record.isActive ? "Nonaktifkan" : "Aktifkan"} onClick={() => handleToggleStatus(record)} tone={record.isActive ? "danger" : "success"} />
                    <TableActionButton icon={<KeyRound size={16} />} label="Reset Password" onClick={() => handleResetPassword(record)} tone="warning" />
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      </div>

      <Modal
        open={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title={selectedUser ? `Detail Admin ${selectedUser.fullName}` : 'Detail Admin'}
        description="Ringkasan role, cakupan akses, dan informasi akun internal."
        footer={(
          <button
            type="button"
            onClick={() => setSelectedUser(null)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Tutup
          </button>
        )}
      >
        {selectedUser ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoBlock label="Username" value={selectedUser.username} />
              <InfoBlock label="Nama Lengkap" value={selectedUser.fullName} />
              <InfoBlock label="Role" value={selectedUser.roleLabel} />
              <InfoBlock label="Instansi" value={selectedUser.institution} />
              <InfoBlock label="Cakupan Akses" value={selectedUser.scopeLabel} />
              <InfoBlock label="Login Terakhir" value={formatDateTime(selectedUser.lastLoginAt)} />
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 bg-slate-50 dark:bg-slate-900/40">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Tahap backend berikutnya sebaiknya menautkan panel ini ke riwayat login, audit trail, dan histori perubahan role supaya admin bisa meninjau akses dengan aman.
              </p>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={showFormModal}
        onClose={() => setShowFormModal(false)}
        title="Form Admin Internal"
        description="Baseline modal tambah/edit admin internal."
        size="lg"
        footer={(
          <>
            <button
              type="button"
              onClick={() => setShowFormModal(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleFormSubmit}
              disabled={isSubmitting}
              className="master-primary-btn px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Nama Lengkap" placeholder="Nama admin" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} />
          <InputField label="Username" placeholder="username.login" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
          <InputField label="Email" placeholder="email@domain.local" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} type="email" />
          <InputField label="Nomor Telepon" placeholder="08xxxxxxxxxx" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
          <SelectField
            label="Role"
            value={formData.role_code}
            onChange={(val) => setFormData({...formData, role_code: val})}
            options={[{ value: '', label: 'Pilih Role' }, ...options.roles]}
          />
          {formData.role_code === 'puskesmas' && (
            <SelectField
              label="Puskesmas"
              value={formData.puskesmas_id}
              onChange={(val) => setFormData({...formData, puskesmas_id: val})}
              options={[{ value: '', label: 'Pilih Puskesmas' }, ...options.puskesmas.map((item) => ({ value: String(item.id), label: item.name }))]}
            />
          )}
          {formData.role_code === 'dinkes' && (
            <SelectField
              label="Kecamatan (Opsional)"
              value={formData.district_id}
              onChange={(val) => setFormData({...formData, district_id: val})}
              options={[{ value: '', label: 'Pilih Kecamatan' }, ...options.districts.map((item) => ({ value: String(item.id), label: item.name }))]}
            />
          )}
          <InputField label={formData.id ? "Password Baru (Opsional)" : "Password"} placeholder="Ketik password" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
          <SelectField
            label="Status"
            value={formData.is_active ? 'active' : 'inactive'}
            onChange={(val) => setFormData({...formData, is_active: val === 'active'})}
            options={[{ value: 'active', label: 'Aktif' }, { value: 'inactive', label: 'Nonaktif' }]}
          />
        </div>
      </Modal>

      <Modal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Admin Internal"
        description="Upload template user admin untuk registrasi atau pembaruan massal."
        size="sm"
        footer={(
          <>
            <button
              type="button"
              onClick={() => setShowImportModal(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => setShowImportModal(false)}
              className="master-primary-btn px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Simulasikan Import
            </button>
          </>
        )}
      >
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-5 text-center bg-slate-50 dark:bg-slate-900">
            Drag & drop file template admin internal
          </div>
          <ul className="space-y-2">
            <li>Kolom minimum: `full_name`, `username`, `role_id`, `email`, `is_active`.</li>
            <li>Untuk role berbasis puskesmas, backend perlu memvalidasi `puskesmas_id` yang aktif sebelum data disimpan.</li>
          </ul>
        </div>
      </Modal>

      <Modal
        open={actionModal.open}
        onClose={() => setActionModal({ open: false, type: '', record: null })}
        title={actionModal.type === 'status' ? "Konfirmasi Status" : "Konfirmasi Reset Password"}
        description={actionModal.type === 'status' ? "Ubah status akses admin internal." : "Reset password admin ke token acak."}
        size="sm"
        footer={(
          <>
            <button
              type="button"
              onClick={() => setActionModal({ open: false, type: '', record: null })}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={confirmAction}
              disabled={isSubmitting}
              className={`px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-colors ${actionModal.type === 'status' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {isSubmitting ? 'Memproses...' : (actionModal.type === 'status' ? 'Ya, Ubah Status' : 'Ya, Reset')}
            </button>
          </>
        )}
      >
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
          {actionModal.type === 'status' ? (
            <p>Anda akan <strong>{actionModal.record?.isActive ? 'menonaktifkan' : 'mengaktifkan'}</strong> admin <strong>{actionModal.record?.username}</strong>. Lanjutkan?</p>
          ) : (
            <p>Password akun <strong>{actionModal.record?.username}</strong> akan direset. Anda akan menerima token baru setelah ini.</p>
          )}
        </div>
      </Modal>
    </div>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="space-y-2 text-sm">
      <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}

function InputField({ label, placeholder, value, onChange, type = "text" }) {
  return (
    <label className="space-y-2 text-sm">
      <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <input
        autoComplete="off"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      />
    </label>
  )
}

function InfoBlock({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-800 dark:text-white">{value}</div>
    </div>
  )
}

function AsyncSelectField({ label, placeholder, value, onChange, fetchFn, disabled }) {
  const [query, setQuery] = useState('')
  const [localOptions, setLocalOptions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLocalLoading, setIsLocalLoading] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isOpen || query.length < 3) {
      setLocalOptions([])
      return
    }
    const timer = setTimeout(async () => {
      setIsLocalLoading(true)
      try {
        const res = await fetchFn(query)
        setLocalOptions(res?.data?.map(item => ({ value: item.id, label: item.name })) || [])
      } catch (err) {
        setLocalOptions([])
      } finally {
        setIsLocalLoading(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [query, isOpen, fetchFn])

  return (
    <div className="space-y-2 text-sm relative" ref={wrapperRef}>
      <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <div 
        className={`w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus-within:ring-2 focus-within:ring-indigo-500/50 flex items-center ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}`}
        onClick={() => !disabled && setIsOpen(true)}
      >
        {value && !isOpen ? (
          <div className="flex-1 truncate" onClick={() => { setIsOpen(true); setQuery(''); }}>{value.label}</div>
        ) : (
          <input
            autoComplete="off"
            type="text"
            className="w-full bg-transparent outline-none disabled:cursor-not-allowed"
            placeholder={value ? value.label : placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            disabled={disabled}
          />
        )}
        {value && (
          <button type="button" className="ml-2 text-slate-400 hover:text-slate-600" onClick={(e) => { e.stopPropagation(); onChange(null); setQuery(''); setIsOpen(false); }}>
            &times;
          </button>
        )}
      </div>
      
      {isOpen && !disabled && (query.length >= 3 || isLocalLoading) && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-auto">
          {isLocalLoading ? (
            <div className="p-3 text-center text-slate-500">Mencari...</div>
          ) : localOptions.length > 0 ? (
            localOptions.map((opt) => (
              <div 
                key={opt.value} 
                className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-slate-700 dark:text-slate-200"
                onClick={() => {
                  onChange(opt)
                  setIsOpen(false)
                  setQuery('')
                }}
              >
                {opt.label}
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-slate-500">Tidak ada hasil</div>
          )}
        </div>
      )}
      {isOpen && !disabled && query.length > 0 && query.length < 3 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg">
          <div className="p-3 text-center text-slate-500">Ketik minimal 3 karakter...</div>
        </div>
      )}
    </div>
  )
}
