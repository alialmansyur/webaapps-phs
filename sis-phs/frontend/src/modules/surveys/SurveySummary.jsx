import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, XCircle, ChevronLeft, Calendar, User, Hash, AlertTriangle, ShieldCheck, Activity } from 'lucide-react'
import { apiRequest } from '../../services/api'

export default function SurveySummary() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [surveyData, setSurveyData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setIsLoading(true)
        const response = await apiRequest(`/kader/surveys/history/${id}`)
        setSurveyData(response.data)
      } catch (err) {
        setError(err.message || 'Gagal memuat ringkasan survei')
      } finally {
        setIsLoading(false)
      }
    }
    
    if (id) {
      fetchSummary()
    }
  }, [id])

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600"></div>
          <p className="text-sm font-bold text-slate-500 animate-pulse">Menyiapkan Ringkasan Survei...</p>
        </div>
      </div>
    )
  }

  if (error || !surveyData) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center space-y-4 bg-white dark:bg-slate-800 p-8 rounded-3xl border border-rose-100 dark:border-rose-900/30 max-w-md w-full mx-4 shadow-xl shadow-rose-100/20 dark:shadow-rose-900/10">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Data Tidak Ditemukan</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{error || 'Gagal mengambil data survei'}</p>
          <button 
            onClick={() => navigate('/kader/surveys/history')} 
            className="mt-6 w-full px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Kembali ke Riwayat
          </button>
        </div>
      </div>
    )
  }

  const {
    respondentNik,
    respondentName,
    householdNo,
    householdHead,
    submittedAt,
    iksScore,
    healthStatus
  } = surveyData

  const isSehat = healthStatus === 'SEHAT'
  const scorePercent = Math.round(iksScore * 100)

  return (
    <div className="max-w-4xl mx-auto px-4 pb-24 sm:pb-8 pt-6">
      {/* Header Section */}
      <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-gradient-to-tr from-teal-400 to-emerald-400 text-white shadow-lg shadow-teal-500/30">
          <CheckCircle2 size={40} className="stroke-[2.5]" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white mb-3">Survei Selesai!</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg mx-auto">
          Data survei berhasil disimpan ke dalam sistem. Berikut adalah ringkasan hasil penilaian Indeks Data Sehat (IKS).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
        
        {/* IKS Status Card (Main Focus) */}
        <div className="md:col-span-5 flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
          <div className={`flex-1 rounded-3xl p-8 border ${
            isSehat 
              ? 'bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-200/60 dark:from-emerald-950/40 dark:to-teal-900/20 dark:border-emerald-800/50' 
              : 'bg-gradient-to-br from-rose-50 to-orange-50/50 border-rose-200/60 dark:from-rose-950/40 dark:to-orange-900/20 dark:border-rose-800/50'
          } relative overflow-hidden flex flex-col items-center justify-center text-center`}>
            
            {/* Background Decoration */}
            <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full blur-3xl opacity-50 pointer-events-none ${
              isSehat ? 'bg-emerald-400/30' : 'bg-rose-400/30'
            }`}></div>
            <div className={`absolute -left-6 -bottom-6 w-32 h-32 rounded-full blur-3xl opacity-50 pointer-events-none ${
              isSehat ? 'bg-teal-400/30' : 'bg-orange-400/30'
            }`}></div>

            <div className={`w-24 h-24 rounded-3xl mb-6 flex items-center justify-center transform rotate-3 shadow-lg ${
              isSehat 
                ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-emerald-500/30' 
                : 'bg-gradient-to-br from-rose-400 to-red-500 text-white shadow-rose-500/30'
            }`}>
              {isSehat ? <ShieldCheck size={48} className="stroke-[2]" /> : <Activity size={48} className="stroke-[2]" />}
            </div>

            <h3 className={`text-sm font-black tracking-widest uppercase mb-2 ${
              isSehat ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              Status IKS
            </h3>
            
            <div className="flex items-baseline gap-1 mb-2">
              <span className={`text-6xl font-black tracking-tight ${
                isSehat ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
              }`}>
                {scorePercent}
              </span>
              <span className={`text-2xl font-bold ${
                isSehat ? 'text-emerald-600/70 dark:text-emerald-400/70' : 'text-rose-600/70 dark:text-rose-400/70'
              }`}>%</span>
            </div>

            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-sm ${
              isSehat 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' 
                : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
            }`}>
              {isSehat ? 'SEHAT' : 'TIDAK SEHAT'}
            </div>

            <p className={`mt-6 text-sm font-medium px-4 ${
              isSehat ? 'text-emerald-800/70 dark:text-emerald-200/60' : 'text-rose-800/70 dark:text-rose-200/60'
            }`}>
              {isSehat 
                ? 'Semua indikator telah terpenuhi (100% Sesuai).' 
                : 'Terdapat minimal 1 indikator yang tidak terpenuhi.'}
            </p>
          </div>
        </div>

        {/* Respondent Info Card */}
        <div className="md:col-span-7 flex flex-col animate-in fade-in slide-in-from-right-4 duration-700 delay-200">
          <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/60 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <User className="text-teal-500" size={20} />
              Informasi Responden
            </h3>

            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50 group">
                <span className="text-sm font-medium text-slate-500 flex items-center gap-2 mb-1 sm:mb-0">
                  <Hash size={16} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
                  ID Responden / NIK
                </span>
                <div className="text-right flex flex-col">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{householdNo}</span>
                  <span className="text-xs font-semibold text-slate-400">{respondentNik}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50 group">
                <span className="text-sm font-medium text-slate-500 flex items-center gap-2 mb-1 sm:mb-0">
                  <User size={16} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
                  Nama Responden
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-right">
                  {respondentName}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50 group">
                <span className="text-sm font-medium text-slate-500 flex items-center gap-2 mb-1 sm:mb-0">
                  <User size={16} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
                  Nama Responden
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-right">
                  {householdHead}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 group">
                <span className="text-sm font-medium text-slate-500 flex items-center gap-2 mb-1 sm:mb-0">
                  <Calendar size={16} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
                  Waktu Submit
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-right bg-slate-50 dark:bg-slate-900/50 px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-700">
                  {new Intl.DateTimeFormat('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(submittedAt))} WIB
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
        <button
          onClick={() => navigate('/kader/dashboard')}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 dark:hover:border-slate-600 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
        >
          <ChevronLeft size={20} />
          Beranda
        </button>
        <button
          onClick={() => navigate('/kader/surveys/history')}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold border-2 border-teal-500 bg-teal-500 text-white shadow-lg shadow-teal-500/20 hover:bg-teal-600 hover:border-teal-600 transition-all"
        >
          Lihat Riwayat Survei
        </button>
      </div>
    </div>
  )
}

