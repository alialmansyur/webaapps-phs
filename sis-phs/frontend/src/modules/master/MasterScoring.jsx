import { useMemo, useState } from 'react'
import { Calculator, Download, Eye, FileUp, PencilLine, Plus, RefreshCcw } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { FilterBar } from '../../components/ui/FilterBar'
import { DataTable } from '../../components/ui/DataTable'
import { FilterPanel } from '../../components/ui/FilterPanel'
import { Modal } from '../../components/ui/Modal'
import { AdminDataPageSkeleton } from '../../components/ui/AdminDataPageSkeleton'
import { TableActionButton } from '../../components/ui/TableActionButton'
import { useAdminPageSkeleton } from '../../hooks/useAdminPageSkeleton'
import {
  getMasterScoringOptions,
  getMasterScoringRecords,
  getMasterScoringStats,
} from '../../services/adminData'

const defaultFilters = {
  formulaType: '',
  status: '',
  questionnaire: '',
  version: '',
}

export default function MasterScoring() {
  const { isLoading, triggerSkeleton } = useAdminPageSkeleton()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(defaultFilters)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(true)
  const [selectedRule, setSelectedRule] = useState(null)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const options = getMasterScoringOptions()

  const { data, meta } = useMemo(() => getMasterScoringRecords({
    page,
    perPage: 5,
    search,
    formulaType: filters.formulaType,
    status: filters.status,
    questionnaire: filters.questionnaire,
    version: filters.version,
  }), [filters.formulaType, filters.questionnaire, filters.status, filters.version, page, search])

  const stats = useMemo(() => getMasterScoringStats(), [])
  const activeFilterCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0)

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(1)
  }

  const handleReset = () => {
    setSearch('')
    setFilters(defaultFilters)
    setPage(1)
  }

  if (isLoading) {
    return (
      <AdminDataPageSkeleton
        title="Algoritma Skoring"
        description="Master formula scoring, aturan not applicable, dan versioning logika IKS per questionnaire."
        icon={<Calculator size={22} />}
        filterFieldCount={4}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="master-card-shell flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-6">
        <div className="flex items-start gap-3">
          <div className="master-primary-icon p-3">
            <Calculator size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Algoritma Skoring</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Master formula scoring, aturan not applicable, dan versioning logika IKS per questionnaire.</p>
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
            Import Rule
          </button>
          <button
            type="button"
            onClick={() => setShowFormModal(true)}
            className="master-primary-btn px-4 py-3 text-sm font-semibold transition-colors"
          >
            <Plus size={16} />
            Tambah Rule
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Total Rule" value={String(stats.total)} subtitle="Aturan scoring tersimpan" color="blue" icon={<Calculator size={22} />} />
        <StatCard title="Rule Aktif" value={String(stats.active)} subtitle="Dipakai untuk perhitungan aktif" color="emerald" icon={<Calculator size={22} />} />
        <StatCard title="Questionnaire" value={String(stats.questionnaireCount)} subtitle="Periode instrumen tercover" color="amber" icon={<Calculator size={22} />} />
        <StatCard title="Jenis Formula" value={String(stats.formulaTypes)} subtitle="Variasi rule aktif/nonaktif" color="teal" icon={<Calculator size={22} />} />
      </div>

      <div className="master-card-shell flex flex-col overflow-hidden">
        <FilterBar
          placeholder="Cari nama rule, formula, questionnaire, atau versi..."
          onSearch={(value) => {
            setSearch(value)
            setPage(1)
          }}
          leftSlot={<div className="text-xs font-medium text-slate-500 dark:text-slate-400">{activeFilterCount > 0 ? `${activeFilterCount} filter aktif` : 'Belum ada filter aktif'}</div>}
        >
          <select
            value={filters.formulaType}
            onChange={(event) => handleFilterChange('formulaType', event.target.value)}
            className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 dark:text-white"
          >
            <option value="">Semua Formula</option>
            {options.formulaTypes.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <button
            type="button"
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Download size={14} className="inline mr-2" />
            Export Rule
          </button>
        </FilterBar>

        <FilterPanel
          isOpen={showFilters}
          onToggle={() => setShowFilters((value) => !value)}
          onReset={handleReset}
          description="Saring rule scoring berdasarkan formula, status, questionnaire, dan versi rule."
          columns={4}
        >
          <SelectField
            label="Jenis Formula"
            value={filters.formulaType}
            onChange={(value) => handleFilterChange('formulaType', value)}
            options={[{ value: '', label: 'Semua Formula' }, ...options.formulaTypes]}
          />
          <SelectField
            label="Status"
            value={filters.status}
            onChange={(value) => handleFilterChange('status', value)}
            options={[{ value: '', label: 'Semua Status' }, ...options.statuses]}
          />
          <SelectField
            label="Questionnaire"
            value={filters.questionnaire}
            onChange={(value) => handleFilterChange('questionnaire', value)}
            options={[{ value: '', label: 'Semua Questionnaire' }, ...options.questionnaires]}
          />
          <SelectField
            label="Versi Rule"
            value={filters.version}
            onChange={(value) => handleFilterChange('version', value)}
            options={[{ value: '', label: 'Semua Versi' }, ...options.versions]}
          />
        </FilterPanel>

        <div className="p-6">
          <DataTable
            headers={['Nama Rule', 'Questionnaire', 'Formula', 'Bobot', 'Not Applicable', 'Status', 'Aksi']}
            pagination={meta}
            onPageChange={setPage}
            emptyState="Tidak ada rule scoring yang cocok dengan filter saat ini."
          >
            {data.map((record) => (
              <tr key={record.id} className="align-top hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-800 dark:text-white">{record.name}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{record.version}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.questionnaireTitle}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.formulaType}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.weightRule}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.notApplicableRule}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-bold ${record.isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200'}`}>
                    {record.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <TableActionButton icon={<Eye size={16} />} label="Detail Rule" onClick={() => setSelectedRule(record)} />
                    <TableActionButton icon={<PencilLine size={16} />} label="Edit Rule" onClick={() => setShowFormModal(true)} tone="primary" />
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      </div>

      <Modal
        open={Boolean(selectedRule)}
        onClose={() => setSelectedRule(null)}
        title={selectedRule ? `Detail Rule ${selectedRule.name}` : 'Detail Rule'}
        description="Ringkasan formula, logika passing, dan aturan not applicable."
        footer={(
          <button
            type="button"
            onClick={() => setSelectedRule(null)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Tutup
          </button>
        )}
      >
        {selectedRule ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoBlock label="Nama Rule" value={selectedRule.name} />
              <InfoBlock label="Versi" value={selectedRule.version} />
              <InfoBlock label="Questionnaire" value={selectedRule.questionnaireTitle} />
              <InfoBlock label="Formula" value={selectedRule.formulaType} />
              <InfoBlock label="Weight Rule" value={selectedRule.weightRule} />
              <InfoBlock label="Status" value={selectedRule.isActive ? 'Aktif' : 'Nonaktif'} />
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 bg-slate-50 dark:bg-slate-900/40 space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-300"><strong>Not Applicable:</strong> {selectedRule.notApplicableRule}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300"><strong>Passing Logic:</strong> {selectedRule.passingLogic}</p>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={showFormModal}
        onClose={() => setShowFormModal(false)}
        title="Form Rule Scoring"
        description="Baseline modal tambah/edit aturan scoring."
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
              onClick={() => setShowFormModal(false)}
              className="master-primary-btn px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Simpan
            </button>
          </>
        )}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Nama Rule" placeholder="All-or-Nothing IKS" />
          <InputField label="Versi" placeholder="v2026.1" />
          <SelectField
            label="Questionnaire"
            value=""
            onChange={() => {}}
            options={[{ value: '', label: 'Pilih Questionnaire' }, ...options.questionnaires]}
          />
          <SelectField
            label="Formula"
            value=""
            onChange={() => {}}
            options={[{ value: '', label: 'Pilih Formula' }, ...options.formulaTypes]}
          />
          <InputField label="Weight Rule" placeholder="1/N indikator applicable" />
          <InputField label="Not Applicable Rule" placeholder="Aturan pengecualian indikator" />
        </div>
      </Modal>

      <Modal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Rule Scoring"
        description="Upload template rule scoring untuk pembaruan massal."
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
            Drag & drop file template scoring
          </div>
          <ul className="space-y-2">
            <li>Kolom minimum: `name`, `formula_type`, `questionnaire`, `weight_rule`, `is_active`.</li>
            <li>Backend perlu validasi bahwa rule aktif hanya boleh satu untuk kombinasi questionnaire dan versi produksi.</li>
          </ul>
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
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}

function InputField({ label, placeholder }) {
  return (
    <label className="space-y-2 text-sm">
      <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <input
        type="text"
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
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
