import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Download, Eye, FileUp, PencilLine, Plus, RefreshCcw, UserCog, Users, KeyRound, Power, PowerOff } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { FilterBar } from '../../components/ui/FilterBar'
import { DataTable } from '../../components/ui/DataTable'
import { FilterPanel } from '../../components/ui/FilterPanel'
import { Modal } from '../../components/ui/Modal'
import { AdminDataPageSkeleton } from '../../components/ui/AdminDataPageSkeleton'
import { TableActionButton } from '../../components/ui/TableActionButton'
import { useAdminPageSkeleton } from '../../hooks/useAdminPageSkeleton'
import {
  fetchUserKaderOptions,
  fetchUserKaderRecords,
  fetchUserKaderStats,
  searchFaskes,
  searchVillagesByFaskes,
} from '../../services/liveAdminApi'
import { apiRequest } from '../../services/api' // using apiRequest directly for mutating
import { toast } from 'react-toastify'

const defaultFilters = {
  village: null, // {value, label}
  puskesmas: null, // {value, label}
  status: '',
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function UserKader() {
  const { isLoading, triggerSkeleton } = useAdminPageSkeleton()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(defaultFilters)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [options, setOptions] = useState({ statuses: [] })
  const [data, setData] = useState([])
  const [meta, setMeta] = useState({ page: 1, perPage: 5, total: 0, totalPages: 1, from: 0, to: 0 })
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, totalSurveys: 0 })
  
  const [isTableLoading, setIsTableLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    id: null, full_name: '', username: '', phone: '', kader_code: '', coverage_area: '',
    puskesmas: null, village: null, is_active: true, password: ''
  })
  const [actionModal, setActionModal] = useState({ open: false, type: '', record: null })

  useEffect(() => {
    let alive = true
    Promise.all([
      fetchUserKaderOptions(),
      fetchUserKaderStats(),
    ]).then(([nextOptions, nextStats]) => {
      if (!alive) return
      setOptions(nextOptions)
      setStats(nextStats)
    }).catch(() => {})
    return () => { alive = false }
  }, [])

  const fetchRecords = useCallback(() => {
    let alive = true
    setIsTableLoading(true)
    fetchUserKaderRecords({
      page,
      per_page: 5,
      search,
      village_id: filters.village?.value || '',
      puskesmas_id: filters.puskesmas?.value || '',
      status: filters.status,
    }).then((response) => {
      if (!alive) return
      setData(response?.data || [])
      setMeta(response?.meta || { page: 1, perPage: 5, total: 0, totalPages: 1, from: 0, to: 0 })
      setIsTableLoading(false)
    }).catch(() => {
      if (alive) setIsTableLoading(false)
    })
    return () => { alive = false }
  }, [filters.puskesmas, filters.village, filters.status, page, search])

  useEffect(() => {
    return fetchRecords()
  }, [fetchRecords])

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0)

  const handleFilterChange = (key, value) => {
    setFilters((current) => {
      const next = { ...current, [key]: value }
      if (key === 'puskesmas') {
        next.village = null
      }
      return next
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
      id: null, full_name: '', username: '', phone: '', kader_code: '', coverage_area: '',
      puskesmas: null, village: null, is_active: true, password: ''
    })
    setShowFormModal(true)
  }

  const handleEditClick = (record) => {
    setFormData({
      id: record.id,
      full_name: record.fullName,
      username: record.username,
      phone: record.phone || '',
      kader_code: record.kaderCode || record.code || '',
      coverage_area: record.coverageArea || '',
      puskesmas: record.puskesmasId ? { value: record.puskesmasId, label: record.puskesmasName } : null,
      village: record.villageId ? { value: record.villageId, label: record.villageName } : null,
      is_active: record.isActive,
      password: ''
    })
    setShowFormModal(true)
  }

  const handleFormSubmit = async () => {
    setIsSubmitting(true)
    try {
      const payload = {
        full_name: formData.full_name,
        username: formData.username,
        phone: formData.phone,
        kader_code: formData.kader_code,
        coverage_area: formData.coverage_area,
        puskesmas_id: formData.puskesmas?.value,
        village_id: formData.village?.value,
        is_active: formData.is_active,
      }
      if (formData.password) payload.password = formData.password
      
      if (formData.id) {
        await apiRequest(`/admin/users/kader/${formData.id}`, { method: 'PUT', body: payload })
      } else {
        await apiRequest('/admin/users/kader', { method: 'POST', body: payload })
      }
      
      setShowFormModal(false)
      const nextStats = await fetchUserKaderStats()
      setStats(nextStats)
      setPage(1)
      if (page === 1) fetchRecords()
      toast.success(formData.id ? 'Data kader berhasil diperbarui.' : 'Kader baru berhasil ditambahkan.')
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.message || err?.message || 'Terjadi kesalahan saat menyimpan data.')
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
        await apiRequest(`/admin/users/kader/${record.id}/status`, { method: 'PATCH', body: { is_active: !record.isActive } })
        fetchRecords()
        const nextStats = await fetchUserKaderStats()
        setStats(nextStats)
        setActionModal({ open: false, type: '', record: null })
        toast.success(`Status kader berhasil ${!record.isActive ? 'diaktifkan' : 'dinonaktifkan'}.`)
      } else if (type === 'reset') {
        const res = await apiRequest(`/admin/users/kader/${record.id}/reset-password`, { method: 'POST' })
        toast.success(`Berhasil mereset password. Token reset: ${res.data?.token || '-'}`)
        setActionModal({ open: false, type: '', record: null })
      }
    } catch (err) {
      console.error(err)
      toast.error(`Gagal ${type === 'status' ? 'mengubah status' : 'mereset password'}. ${err?.response?.data?.message || ''}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <AdminDataPageSkeleton
        title="Direktori Kader"
        description="Manajemen akun kader, penugasan wilayah, dan import batch pengguna lapangan."
        icon={<Users size={22} />}
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
            <Users size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Direktori Kader</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Manajemen akun kader, penugasan wilayah, dan import batch pengguna lapangan.</p>
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
            Import Kader
          </button>
          <button
            type="button"
            onClick={handleAddClick}
            className="master-primary-btn px-4 py-3 text-sm font-semibold transition-colors"
          >
            <Plus size={16} />
            Tambah Kader
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Total Kader" value={String(stats.total)} subtitle="Akun kader pada master user" color="blue" icon={<Users size={22} />} />
        <StatCard title="Kader Aktif" value={String(stats.active)} subtitle="Siap menerima penugasan" color="emerald" icon={<UserCog size={22} />} />
        <StatCard title="Kader Nonaktif" value={String(stats.inactive)} subtitle="Perlu review akun atau penempatan" color="amber" icon={<Users size={22} />} />
        <StatCard title="Total Survei" value={String(stats.totalSurveys)} subtitle="Kontribusi seluruh kader" color="teal" icon={<Download size={22} />} />
      </div>

      <div className="master-card-shell flex flex-col overflow-hidden">
        <FilterBar
          placeholder="Cari kode kader, nama, username, puskesmas..."
          onSearch={(value) => {
            setSearch(value)
            setPage(1)
          }}
          leftSlot={<div className="text-xs font-medium text-slate-500 dark:text-slate-400">{activeFilterCount > 0 ? `${activeFilterCount} filter aktif` : 'Belum ada filter aktif'}</div>}
        >
          <select
            value={filters.status}
            onChange={(event) => handleFilterChange('status', event.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:text-white"
          >
            <option value="">Semua Status</option>
            {options.statuses.map((item) => (
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
          <AsyncSelectField
            label="Puskesmas"
            placeholder="Ketik 3 huruf..."
            value={filters.puskesmas}
            onChange={(val) => handleFilterChange('puskesmas', val)}
            fetchFn={searchFaskes}
          />
          <AsyncSelectField
            label="Desa"
            placeholder={filters.puskesmas ? "Ketik 3 huruf..." : "Pilih puskesmas dulu..."}
            value={filters.village}
            onChange={(val) => handleFilterChange('village', val)}
            fetchFn={(query) => searchVillagesByFaskes(filters.puskesmas?.value, query)}
            disabled={!filters.puskesmas}
          />
          <SelectField
            label="Status User"
            value={filters.status}
            onChange={(value) => handleFilterChange('status', value)}
            options={[{ value: '', label: 'Semua Status' }, ...options.statuses]}
          />
        </FilterPanel>

        <div className="p-6">
          <DataTable
            headers={['Kode', 'Nama Kader', 'Puskesmas', 'Area Tugas', 'Survei', 'Sinkronisasi', 'Status', 'Aksi']}
            pagination={meta}
            onPageChange={setPage}
            emptyState="Tidak ada data kader yang sesuai dengan filter saat ini."
            isLoading={isTableLoading}
          >
            {data.map((record) => (
              <tr key={record.id} className="align-top hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-mono text-sm text-slate-800 dark:text-white">{record.code || record.kaderCode}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">@{record.username}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-800 dark:text-white">{record.fullName}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{record.phone}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                  <div>{record.puskesmasName}</div>
                  <div className="text-slate-500 dark:text-slate-400">{record.districtName}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                  <div>{record.villageName}</div>
                  <div className="text-slate-500 dark:text-slate-400">{record.coverageArea}</div>
                </td>
                <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white">{record.surveyCount || 0}</td>
                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{formatDateTime(record.lastSyncAt)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-bold ${record.isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200'}`}>
                    {record.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <TableActionButton icon={<Eye size={16} />} label="Detail Kader" onClick={() => setSelectedUser(record)} />
                    <TableActionButton icon={<PencilLine size={16} />} label="Edit Kader" onClick={() => handleEditClick(record)} tone="primary" />
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
        title={selectedUser ? `Detail Kader ${selectedUser.fullName}` : 'Detail Kader'}
        description="Ringkasan akun, wilayah kerja, dan aktivitas sinkronisasi terakhir."
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
              <InfoBlock label="Kode Kader" value={selectedUser.code || selectedUser.kaderCode} />
              <InfoBlock label="Nama" value={selectedUser.fullName} />
              <InfoBlock label="Username" value={selectedUser.username} />
              <InfoBlock label="Telepon" value={selectedUser.phone} />
              <InfoBlock label="Puskesmas" value={selectedUser.puskesmasName} />
              <InfoBlock label="Wilayah Tugas" value={`${selectedUser.villageName} - ${selectedUser.coverageArea}`} />
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 bg-slate-50 dark:bg-slate-900/40">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Pada integrasi backend nanti, panel ini akan terhubung ke riwayat sinkronisasi, serta daftar keluarga yang menjadi binaan kader.
              </p>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={showFormModal}
        onClose={() => setShowFormModal(false)}
        title="Form Kader"
        description="Modal input ini digunakan untuk menambah/mengedit user kader beserta area tugasnya."
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
          <InputField label="Nama Lengkap" placeholder="Nama kader" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} />
          <InputField label="Username" placeholder="username.login" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
          <InputField label="Nomor Telepon" placeholder="08xxxxxxxxxx" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
          <InputField label="Kode Kader" placeholder="KD-XXXX" value={formData.kader_code} onChange={(e) => setFormData({...formData, kader_code: e.target.value})} />
          <InputField label="Area Tugas" placeholder="RT/RW binaan" value={formData.coverage_area} onChange={(e) => setFormData({...formData, coverage_area: e.target.value})} />
          <AsyncSelectField
            label="Puskesmas"
            placeholder="Ketik 3 huruf..."
            value={formData.puskesmas}
            onChange={(val) => setFormData({...formData, puskesmas: val, village: null})}
            fetchFn={searchFaskes}
          />
          <AsyncSelectField
            label="Desa"
            placeholder={formData.puskesmas ? "Ketik 3 huruf..." : "Pilih puskesmas dulu..."}
            value={formData.village}
            onChange={(val) => setFormData({...formData, village: val})}
            fetchFn={(query) => searchVillagesByFaskes(formData.puskesmas?.value, query)}
            disabled={!formData.puskesmas}
          />
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
        title="Import User Kader"
        description="Upload template akun kader untuk registrasi atau pembaruan data massal."
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
            Drag & drop file template user kader
          </div>
          <ul className="space-y-2">
            <li>Kolom minimum: `full_name`, `username`, `puskesmas_id`, `village_id`, `is_active`.</li>
            <li>Backend perlu menambahkan validasi unique username dan role `kader` dari `m_roles`.</li>
          </ul>
        </div>
      </Modal>

      <Modal
        open={actionModal.open}
        onClose={() => setActionModal({ open: false, type: '', record: null })}
        title={actionModal.type === 'status' ? "Konfirmasi Status" : "Konfirmasi Reset Password"}
        description={actionModal.type === 'status' ? "Ubah status akses kader." : "Reset password kader ke token acak."}
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
            <p>Anda akan <strong>{actionModal.record?.isActive ? 'menonaktifkan' : 'mengaktifkan'}</strong> kader <strong>{actionModal.record?.username}</strong>. Lanjutkan?</p>
          ) : (
            <p>Password akun kader <strong>{actionModal.record?.username}</strong> akan direset. Anda akan menerima token baru setelah ini.</p>
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
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
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
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
      />
    </label>
  )
}

function AsyncSelectField({ label, placeholder, value, onChange, fetchFn, disabled }) {
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
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
      setOptions([])
      return
    }
    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetchFn(query)
        setOptions(res?.data?.map(item => ({ value: item.id, label: item.name })) || [])
      } catch (err) {
        setOptions([])
      } finally {
        setIsLoading(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [query, isOpen, fetchFn])

  return (
    <div className="space-y-2 text-sm relative" ref={wrapperRef}>
      <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <div 
        className={`w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus-within:ring-2 focus-within:ring-teal-500/50 flex items-center ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}`}
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
      
      {isOpen && !disabled && (query.length >= 3 || isLoading) && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="p-3 text-center text-slate-500">Mencari...</div>
          ) : options.length > 0 ? (
            options.map((opt) => (
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

function InfoBlock({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-800 dark:text-white">{value}</div>
    </div>
  )
}
