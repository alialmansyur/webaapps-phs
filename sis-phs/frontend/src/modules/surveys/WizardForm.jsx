import { useMemo, useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ChevronRight, ChevronLeft, Save, User, MapPin, Hash, Activity } from 'lucide-react'
import { toast } from 'react-toastify'
import Select from 'react-select'
import { apiRequest } from '../../services/api'

export default function WizardForm() {
  const panelClass = 'bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700'
  const fieldClass = 'w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-white font-medium transition-all'

  const [step, setStep] = useState(1)
  const [questionsData, setQuestionsData] = useState({ questionnaire_id: null, title: '', questions: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fetchError, setFetchError] = useState(null)

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setError,
    clearErrors,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      gender: 'L',
    },
  })
  const navigate = useNavigate()
  const ageValue = Number(watch('umur') || 0)

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true)
        const response = await apiRequest('/kader/surveys/questions')
        setQuestionsData(response)
        setFetchError(null)
      } catch (error) {
        setFetchError(error.message || 'Gagal memuat kuesioner')
      } finally {
        setIsLoading(false)
      }
    }
    fetchQuestions()
  }, [])

  const visibleQuestions = useMemo(() => (
    questionsData.questions.filter((question) => {
      if (question.condition?.type === 'age_max') return ageValue <= Number(question.condition.value || 0)
      if (question.condition?.type === 'age_min') return ageValue >= Number(question.condition.value || 0)
      return true
    })
  ), [ageValue, questionsData.questions])

  const answeredCount = visibleQuestions.filter((question) => {
    const answer = watch(`q_${question.id}`)
    return Boolean(answer)
  }).length

  const progressPercent = visibleQuestions.length > 0
    ? Math.round((answeredCount / visibleQuestions.length) * 100)
    : 0
  const canSubmit = visibleQuestions.length > 0 && answeredCount === visibleQuestions.length

  const onSubmit = async (data) => {
    let hasMissingAnswers = false

    visibleQuestions.forEach((question) => {
      const answer = data[`q_${question.id}`]
      if (question.is_mandatory && !answer) {
        hasMissingAnswers = true
        setError(`q_${question.id}`, {
          type: 'required',
          message: 'Jawaban wajib dipilih.',
        })
      }
    })

    if (hasMissingAnswers) {
      return
    }

    const responses = visibleQuestions.map((question) => ({
      question_item_id: question.id,
      answer: data[`q_${question.id}`] || null,
    }))

    const finalPayload = {
      questionnaire_id: questionsData.questionnaire_id,
      respondent: {
        no_kk: data.no_kk,
        nik: data.nik,
        nama: data.nama,
        umur: Number(data.umur || 0),
        gender: data.gender,
        rt: data.rt,
        rw: data.rw,
        alamat: data.alamat,
      },
      responses,
    }

    try {
      setIsSubmitting(true)
      const response = await apiRequest('/kader/surveys', {
        method: 'POST',
        body: finalPayload,
      })
      toast.success('Survei berhasil disimpan!')
      navigate(`/kader/surveys/summary/${response.survey_id}`)
    } catch (error) {
      toast.error('Terjadi kesalahan: ' + (error.message || 'Gagal menyimpan survei'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const openQuestionnaireStep = async () => {
    const isValid = await trigger(['no_kk', 'nik', 'nama', 'umur', 'gender', 'rt', 'rw', 'alamat'])
    if (!isValid) return

    try {
      const nik = watch('nik')
      const response = await apiRequest('/kader/surveys/check-nik', {
        method: 'POST',
        body: { nik },
      })
      if (response.exists) {
        toast.warning(response.message || 'NIK ini sudah mengisi survei bulan ini.')
        return
      }
    } catch (error) {
      toast.error('Gagal mengecek validasi NIK. Silakan coba lagi.')
      return
    }

    setStep(2)
  }

  const handleFormSubmit = async (event) => {
    if (step === 1) {
      event.preventDefault()
      await openQuestionnaireStep()
      return
    }

    await handleSubmit(onSubmit)(event)
  }

  const prevStep = () => {
    setStep(1)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600"></div>
          <p className="text-sm font-medium text-slate-500">Memuat Kuesioner PHS...</p>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-rose-500 font-bold">{fetchError}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-semibold hover:bg-slate-200">
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-2 pb-24 sm:pb-8 pt-4">
      <div className={`${panelClass} mb-6 flex items-center gap-4 p-5`}>
        <div className="w-12 h-12 bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Activity size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Survei PHS Baru</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{questionsData.title}</p>
        </div>
      </div>

      <div className="mb-8 relative flex justify-between items-center px-4">
        <div className="absolute top-1/2 left-4 right-4 h-1.5 bg-slate-100 dark:bg-slate-800 -z-10 rounded-full transform -translate-y-1/2"></div>
        <div 
          className="absolute top-1/2 left-4 h-1.5 bg-teal-500 -z-10 rounded-full transform -translate-y-1/2 transition-all duration-500" 
          style={{ width: step === 1 ? '0%' : '100%' }}
        ></div>
        
        {[1, 2].map(num => (
          <div key={num} className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base transition-colors border-4 border-slate-50 dark:border-slate-900 ${
              step >= num 
                ? 'bg-teal-500 text-white' 
                : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
            }`}>
              {step > num ? <CheckCircle2 size={20} /> : num}
            </div>
            <span className={`mt-2 text-xs font-bold ${step >= num ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500'}`}>
              {num === 1 ? 'Identitas Responden' : 'Kuesioner PHS'}
            </span>
          </div>
        ))}
      </div>

      <form autoComplete="off" onSubmit={handleFormSubmit} onKeyDown={(event) => {
        if (event.key === 'Enter' && step === 1 && event.target.tagName !== 'TEXTAREA') {
          event.preventDefault()
          openQuestionnaireStep()
        }
      }} className="space-y-6">
        
        {step === 1 && (
          <div className={`${panelClass} animate-in fade-in slide-in-from-bottom-4 duration-500 p-6`}>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Identitas Responden</h2>
              <p className="text-sm text-slate-500 font-medium">Data dasar peserta survei.</p>
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">ID Responden</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Hash size={18} />
                    </div>
                    <input
                      autoComplete="off"
                      inputMode="numeric"
                      {...register('no_kk', {
                        required: 'ID Responden wajib diisi',
                        pattern: { value: /^[0-9]{16}$/, message: 'ID Responden harus 16 digit angka' },
                      })}
                      className={`${fieldClass} pl-11 pr-4 py-3.5 placeholder-slate-400`}
                      placeholder="Contoh: 3172012301000001"
                    />
                  </div>
                  {errors.no_kk && <p className="mt-2 text-sm font-medium text-rose-500">{errors.no_kk.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">NIK</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Hash size={18} />
                    </div>
                    <input
                      autoComplete="off"
                      inputMode="numeric"
                      {...register('nik', {
                        required: 'NIK wajib diisi',
                        pattern: { value: /^[0-9]{16}$/, message: 'NIK harus 16 digit angka' },
                      })}
                      className={`${fieldClass} pl-11 pr-4 py-3.5 placeholder-slate-400`}
                      placeholder="Contoh: 317201xxxxxxxxxx"
                    />
                  </div>
                  {errors.nik && <p className="mt-2 text-sm font-medium text-rose-500">{errors.nik.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nama Lengkap</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <User size={18} />
                  </div>
                  <input autoComplete="off" {...register("nama", { required: 'Nama wajib diisi' })} className={`${fieldClass} pl-11 pr-4 py-3.5 placeholder-slate-400`} placeholder="Contoh: Budi Santoso" />
                </div>
                {errors.nama && <p className="mt-2 text-sm font-medium text-rose-500">{errors.nama.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Umur</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Hash size={18} />
                    </div>
                    <input autoComplete="off" type="number" {...register("umur", { required: 'Umur wajib diisi', min: { value: 0, message: 'Umur tidak valid' } })} className={`${fieldClass} pl-11 pr-4 py-3.5 placeholder-slate-400`} placeholder="Tahun" />
                  </div>
                  {errors.umur && <p className="mt-2 text-sm font-medium text-rose-500">{errors.umur.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Jenis Kelamin</label>
                  <select {...register("gender", { required: true })} className={`${fieldClass} px-4 py-3.5`}>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">RT</label>
                  <Controller
                    name="rt"
                    control={control}
                    rules={{ required: 'RT wajib dipilih' }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={Array.from({ length: 99 }, (_, i) => {
                          const val = String(i + 1).padStart(3, '0')
                          return { value: val, label: val }
                        })}
                        placeholder="Pilih RT..."
                        className="text-slate-800"
                        value={field.value ? { value: field.value, label: field.value } : null}
                        onChange={(selected) => field.onChange(selected ? selected.value : '')}
                        isClearable
                      />
                    )}
                  />
                  {errors.rt && <p className="mt-2 text-sm font-medium text-rose-500">{errors.rt.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">RW</label>
                  <Controller
                    name="rw"
                    control={control}
                    rules={{ required: 'RW wajib dipilih' }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={Array.from({ length: 99 }, (_, i) => {
                          const val = String(i + 1).padStart(3, '0')
                          return { value: val, label: val }
                        })}
                        placeholder="Pilih RW..."
                        className="text-slate-800"
                        value={field.value ? { value: field.value, label: field.value } : null}
                        onChange={(selected) => field.onChange(selected ? selected.value : '')}
                        isClearable
                      />
                    )}
                  />
                  {errors.rw && <p className="mt-2 text-sm font-medium text-rose-500">{errors.rw.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Alamat</label>
                <div className="relative">
                  <div className="absolute top-4 left-0 pl-4 flex items-start pointer-events-none text-slate-400">
                    <MapPin size={18} />
                  </div>
                  <textarea {...register("alamat", { required: 'Alamat wajib diisi' })} className={`${fieldClass} pl-11 pr-4 py-3.5 placeholder-slate-400`} rows="3" placeholder="Contoh: Jl. Mawar No. 12, Dusun Mawar"></textarea>
                </div>
                {errors.alamat && <p className="mt-2 text-sm font-medium text-rose-500">{errors.alamat.message}</p>}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={`${panelClass} animate-in fade-in slide-in-from-bottom-4 duration-500 p-6`}>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Kuesioner Indikator Sehat</h2>
              <p className="text-sm text-slate-500 font-medium">Jawab berdasarkan observasi atau wawancara. Pertanyaan difilter sesuai umur responden.</p>
            </div>

            <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100">Progres Pengisian</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {answeredCount} dari {visibleQuestions.length} pertanyaan sudah dijawab
                  </div>
                </div>
                <div className="text-sm font-bold text-teal-600 dark:text-teal-300">{progressPercent}%</div>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-teal-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              {visibleQuestions.map((q, idx) => (
                <div key={q.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-black text-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-teal-300">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-base font-extrabold leading-7 text-slate-800 dark:text-slate-100">{q.text}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Pilih satu jawaban yang paling sesuai.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {q.options && q.options.length > 0 ? q.options.map(opt => (
                      <label key={opt.id} className="relative cursor-pointer">
                        <input
                          type="radio"
                          value={opt.value}
                          {...register(`q_${q.id}`, {
                            onChange: () => clearErrors(`q_${q.id}`),
                          })}
                          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                        <div className={`flex min-h-[72px] w-full items-center justify-center rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-center text-sm font-bold text-slate-500 transition-all peer-checked:border-teal-500 peer-checked:bg-teal-50 peer-checked:text-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:peer-checked:bg-teal-500/20 dark:peer-checked:text-teal-300`}>
                          {opt.label}
                        </div>
                      </label>
                    )) : (
                      <div className="col-span-2">
                        <input
                           autoComplete="off"
                           type="text"
                           {...register(`q_${q.id}`, {
                             onChange: () => clearErrors(`q_${q.id}`),
                           })}
                           className={`${fieldClass} px-4 py-3.5`}
                           placeholder="Jawaban..."
                        />
                      </div>
                    )}
                  </div>
                  {errors[`q_${q.id}`] && (
                    <p className="mt-3 text-sm font-medium text-rose-500">{errors[`q_${q.id}`].message}</p>
                  )}
                </div>
              ))}
              {visibleQuestions.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                  Belum ada pertanyaan yang cocok dengan umur responden saat ini. Ubah data identitas jika diperlukan.
                </div>
              )}
            </div>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 sm:static bg-white dark:bg-slate-900 sm:bg-transparent border-t border-slate-200 dark:border-slate-800 sm:border-none p-4 sm:p-0 z-40">
          <div className={`max-w-4xl mx-auto flex gap-4 ${step === 2 ? 'sm:items-center sm:justify-between' : ''}`}>
            {step === 2 && (
              <button
                type="button"
                onClick={prevStep}
                disabled={isSubmitting}
                className="flex-1 sm:w-[260px] sm:flex-none flex items-center justify-center gap-2 py-4 sm:px-6 rounded-2xl font-bold border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                <ChevronLeft size={20} />
                Kembali
              </button>
            )}
            
            {step === 1 ? (
              <button
                type="button"
                onClick={openQuestionnaireStep}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold border border-teal-500 bg-teal-500 hover:bg-teal-600 text-white transition-colors"
              >
                Lanjut ke Kuesioner
                <ChevronRight size={20} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className={`flex-[2] sm:w-[320px] sm:flex-none flex items-center justify-center gap-2 py-4 sm:px-8 rounded-2xl font-bold border transition-colors ${
                  canSubmit && !isSubmitting
                    ? 'border-emerald-500 bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'border-slate-200 bg-slate-200 text-slate-400 cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500'
                }`}
              >
                {isSubmitting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <Save size={20} />
                )}
                {isSubmitting ? 'Menyimpan...' : (canSubmit ? 'Simpan Hasil' : 'Lengkapi Semua Jawaban')}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

