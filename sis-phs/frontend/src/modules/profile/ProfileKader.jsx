import { useEffect, useState } from 'react'
import { KeyRound, ShieldCheck, Smartphone, UserCog2 } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { AdminDataPageSkeleton } from '../../components/ui/AdminDataPageSkeleton'
import { getSyncStatusMeta } from '../../services/operationalData'
import { InfoBlock, ToneBadge } from '../reports/reportComponents'
import { fetchKaderProfile, updateKaderPassword, updateKaderProfile } from '../../services/profile'
import { toast } from 'react-toastify'

function getFieldErrors(error) {
  const details = error?.details
  if (!details || typeof details !== 'object' || !details.errors || typeof details.errors !== 'object') {
    return {}
  }

  return Object.entries(details.errors).reduce((carry, [key, value]) => {
    if (Array.isArray(value) && value.length > 0) {
      carry[key] = value[0]
    } else if (typeof value === 'string') {
      carry[key] = value
    }

    return carry
  }, {})
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

export default function ProfileKader() {
  const [isLoading, setIsLoading] = useState(true)
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('profil')
  const [summary, setSummary] = useState(null)
  
  // Form states
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '', email: '' })
  const [passwordForm, setPasswordForm] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [profileErrors, setProfileErrors] = useState({})
  const [passwordErrors, setPasswordErrors] = useState({})
  
  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      const data = await fetchKaderProfile()
      setSummary(data)
      setProfileForm({
        full_name: data.fullName || '',
        phone: data.phone || '',
        email: data.email || ''
      })
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileChange = (e) => {
    setProfileErrors((current) => ({ ...current, [e.target.name]: '' }))
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value })
  }

  const handlePasswordChange = (e) => {
    setPasswordErrors((current) => ({ ...current, [e.target.name]: '' }))
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value })
  }

  const submitProfile = async () => {
    const nextErrors = {}
    if (!profileForm.full_name.trim()) nextErrors.full_name = 'Nama lengkap wajib diisi.'
    if (!profileForm.phone.trim()) nextErrors.phone = 'Nomor telepon wajib diisi.'
    if (!profileForm.email.trim()) {
      nextErrors.email = 'Email wajib diisi.'
    } else if (!/\S+@\S+\.\S+/.test(profileForm.email)) {
      nextErrors.email = 'Format email tidak valid.'
    }

    setProfileErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error('Periksa kembali data profil yang belum valid.')
      return
    }

    try {
      setIsSubmitting(true)
      setProfileErrors({})
      await updateKaderProfile(profileForm)
      setEditProfileOpen(false)
      toast.success('Profil berhasil diperbarui.')
      await loadProfile() // reload data
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      setProfileErrors(fieldErrors)
      toast.error(err.message || 'Gagal memperbarui profil.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitPassword = async () => {
    const nextErrors = {}
    if (!passwordForm.current_password) nextErrors.current_password = 'Password lama wajib diisi.'
    if (!passwordForm.password) nextErrors.password = 'Password baru wajib diisi.'
    if (passwordForm.password && passwordForm.password.length < 8) nextErrors.password = 'Password baru minimal 8 karakter.'
    if (!passwordForm.password_confirmation) {
      nextErrors.password_confirmation = 'Konfirmasi password baru wajib diisi.'
    } else if (passwordForm.password !== passwordForm.password_confirmation) {
      nextErrors.password_confirmation = 'Konfirmasi password baru tidak cocok.'
    }

    setPasswordErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error('Periksa kembali data password yang belum valid.')
      return
    }

    try {
      setIsSubmitting(true)
      setPasswordErrors({})
      await updateKaderPassword(passwordForm)
      setChangePasswordOpen(false)
      toast.success('Password berhasil diubah.')
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' })
    } catch (err) {
      const fieldErrors = getFieldErrors(err)
      setPasswordErrors(fieldErrors)
      toast.error(err.message || 'Gagal mengubah password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const syncMeta = getSyncStatusMeta(summary?.syncStatus || 'OFFLINE')
  const tabs = [
    { id: 'profil', label: 'Profil', icon: <UserCog2 size={16} /> },
    { id: 'keamanan', label: 'Keamanan', icon: <KeyRound size={16} /> },
    { id: 'status', label: 'Status', icon: <ShieldCheck size={16} /> },
    { id: 'perangkat', label: 'Perangkat', icon: <Smartphone size={16} /> },
  ]

  if (isLoading || !summary) {
    return (
      <AdminDataPageSkeleton
        title="Pengaturan Akun"
        description="Kelola akun, tugas, dan perangkat."
        icon={<UserCog2 size={22} />}
        statCount={0}
        filterFieldCount={0}
        tableColumnCount={0}
        actionCount={2}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="master-card-shell flex flex-col justify-between gap-4 p-6 xl:flex-row xl:items-center">
        <div className="flex items-start gap-4">
          <div className="master-primary-icon flex h-16 w-16 items-center justify-center rounded-[1.5rem] text-xl font-bold">
            {summary.fullName ? summary.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('') : 'U'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{summary.fullName}</h2>
              <ToneBadge tone="info">{summary.role}</ToneBadge>
              <span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-bold ${syncMeta.tone}`}>{syncMeta.label}</span>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">Kelola akun, tugas, dan perangkat.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setEditProfileOpen(true) }} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">
            Edit Profil
          </button>
          <button type="button" onClick={() => { setChangePasswordOpen(true) }} className="master-primary-btn px-4 py-3 text-sm font-semibold">
            Ubah Password
          </button>
        </div>
      </div>

      <section className="app-panel-shell overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-700 sm:px-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-teal-500 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'profil' ? (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Profil & Penugasan</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Data identitas dan area kerja kader.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoBlock label="Nama Lengkap" value={summary.fullName} />
                <InfoBlock label="Username" value={summary.username} />
                <InfoBlock label="Email" value={summary.email} />
                <InfoBlock label="No. Telepon" value={summary.phone} />
                <InfoBlock label="Puskesmas" value={summary.puskesmasName} />
                <InfoBlock label="Kecamatan" value={summary.districtName} />
                <InfoBlock label="Area Tugas" value={summary.coverageArea} />
                <InfoBlock label="Desa Binaan" value={(summary.villages || []).join(', ')} />
              </div>
            </div>
          ) : null}

          {activeTab === 'keamanan' ? (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Keamanan Akun</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Kontrol akses dan pembaruan password.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoBlock label="Status Akun" value="Aktif" tone="success" />
                <InfoBlock label="Role" value={summary.role} />
                <InfoBlock label="Email Login" value={summary.email} />
                <InfoBlock label="Metode Keamanan" value="Password" />
              </div>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                Ubah password secara berkala dan pastikan perangkat kerja tidak dipakai bersama akun lain.
              </div>
              <div>
                <button type="button" onClick={() => { setChangePasswordOpen(true) }} className="master-primary-btn px-4 py-2.5 text-sm font-medium">
                  Ubah Password
                </button>
              </div>
            </div>
          ) : null}

          {activeTab === 'status' ? (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Status Akun</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ringkasan akses, aktivitas, dan sinkronisasi.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoBlock label="Status Sinkron" value={syncMeta.label} tone={summary.syncStatus === 'SYNCED' ? 'success' : 'warning'} />
                <InfoBlock label="Sinkron Terakhir" value={formatDateTime(summary.lastSyncAt)} />
                <InfoBlock label="Total Survei Terkirim" value={String(summary.totalSubmittedSurveys || 0)} />
                <InfoBlock label="Draft Aktif" value={String(summary.pendingDrafts || 0)} tone={summary.pendingDrafts > 0 ? 'warning' : 'success'} />
                <InfoBlock label="Total Survei Kelolaan" value={String(summary.totalManagedHouseholds || 0)} />
                <InfoBlock label="Terdaftar Sejak" value={formatDateTime(summary.joinedAt)} />
              </div>
            </div>
          ) : null}

          {activeTab === 'perangkat' ? (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Perangkat</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Pantau perangkat aktif dan kesiapan sinkronisasi.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoBlock label="Perangkat Aktif" value={summary.deviceLabel} />
                <InfoBlock label="Status Sinkron" value={syncMeta.label} tone={summary.syncStatus === 'SYNCED' ? 'success' : 'warning'} />
                <InfoBlock label="Sinkron Terakhir" value={formatDateTime(summary.lastSyncAt)} />
                <InfoBlock label="Area Tugas Aktif" value={summary.coverageArea} />
              </div>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                Saat backend aktif, tab ini bisa menampung reset sinkronisasi, ganti perangkat, dan histori konflik data lapangan.
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <Modal
        open={editProfileOpen}
        onClose={() => {
          setProfileErrors({})
          setEditProfileOpen(false)
        }}
        title="Edit Profil Kader"
        description="Perbarui informasi identitas dan kontak."
        footer={(
          <>
            <button type="button" onClick={() => {
              setProfileErrors({})
              setEditProfileOpen(false)
            }} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">
              Batal
            </button>
            <button type="button" disabled={isSubmitting} onClick={submitProfile} className="master-primary-btn px-4 py-2.5 text-sm font-medium">
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Nama Lengkap</span>
              <input autoComplete="off" name="full_name" value={profileForm.full_name} onChange={handleProfileChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
              {profileErrors.full_name ? <div className="text-xs font-medium text-rose-600">{profileErrors.full_name}</div> : null}
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-700 dark:text-slate-200">No. Telepon</span>
              <input autoComplete="off" name="phone" value={profileForm.phone} onChange={handleProfileChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
              {profileErrors.phone ? <div className="text-xs font-medium text-rose-600">{profileErrors.phone}</div> : null}
            </label>
            <label className="space-y-2 text-sm md:col-span-2">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Email</span>
              <input autoComplete="off" type="email" name="email" value={profileForm.email} onChange={handleProfileChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
              {profileErrors.email ? <div className="text-xs font-medium text-rose-600">{profileErrors.email}</div> : null}
            </label>
          </div>
        </div>
      </Modal>

      <Modal
        open={changePasswordOpen}
        onClose={() => {
          setPasswordErrors({})
          setChangePasswordOpen(false)
        }}
        size="sm"
        title="Ubah Password"
        description="Ganti password Anda secara berkala untuk menjaga keamanan."
        footer={(
          <>
            <button type="button" onClick={() => {
              setPasswordErrors({})
              setChangePasswordOpen(false)
            }} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">
              Batal
            </button>
            <button type="button" disabled={isSubmitting} onClick={submitPassword} className="master-primary-btn px-4 py-2.5 text-sm font-medium">
              {isSubmitting ? 'Menyimpan...' : 'Simpan Password'}
            </button>
          </>
        )}
      >
        <div className="space-y-4">
          <label className="space-y-2 text-sm block">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Password Lama</span>
            <input autoComplete="off" type="password" name="current_password" value={passwordForm.current_password} onChange={handlePasswordChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            {passwordErrors.current_password ? <div className="text-xs font-medium text-rose-600">{passwordErrors.current_password}</div> : null}
          </label>
          <label className="space-y-2 text-sm block">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Password Baru</span>
            <input autoComplete="off" type="password" name="password" value={passwordForm.password} onChange={handlePasswordChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            {passwordErrors.password ? <div className="text-xs font-medium text-rose-600">{passwordErrors.password}</div> : null}
          </label>
          <label className="space-y-2 text-sm block">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Konfirmasi Password Baru</span>
            <input autoComplete="off" type="password" name="password_confirmation" value={passwordForm.password_confirmation} onChange={handlePasswordChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            {passwordErrors.password_confirmation ? <div className="text-xs font-medium text-rose-600">{passwordErrors.password_confirmation}</div> : null}
          </label>
        </div>
      </Modal>
    </div>
  )
}

