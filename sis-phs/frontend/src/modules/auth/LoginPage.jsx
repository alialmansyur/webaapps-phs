import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mapMeResponse, saveAuthSession } from '../../services/auth';
import { getRoleHomePath } from '../navigation/config';
import { apiRequest, ApiError } from '../../services/api';
import { User, Lock, Activity, ChevronRight, Eye, EyeOff } from 'lucide-react';

const BENEFITS = [
  "Pantau Data Kesehatan secara Real-time",
  "Akses Laporan Terintegrasi",
  "Kelola Data dengan Cepat dan Akurat",
  "Mendukung Keputusan Berbasis Data",
  "Sistem Pencatatan yang Aman dan Terpercaya"
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentBenefitIndex, setCurrentBenefitIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentBenefitIndex((prev) => (prev + 1) % BENEFITS.length);
        setFade(true);
      }, 500);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: {
          username: username.trim(),
          password,
          device_name: 'frontend-web',
        },
      })

      const mappedUser = mapMeResponse(response?.user || {})
      const role = response?.user?.roles?.[0] || 'kader'
      const nextSession = {
        token: response?.token,
        user: {
          ...response?.user,
          ...mappedUser,
          username: response?.user?.username,
          duty_location: response?.user?.duty_location,
        },
      }

      setError('')
      saveAuthSession(nextSession)

      navigate(getRoleHomePath(role, nextSession))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login gagal. Periksa koneksi backend.')
    } finally {
      setIsSubmitting(false)
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Side: Background & Floating Text */}
      <div className="relative hidden w-1/2 items-center justify-center lg:flex bg-slate-900">
        <div className="absolute inset-0">
          <img
            src="/backdrop.png"
            alt="SIS-PHS Background"
            className="h-full w-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
        </div>
        <div className="relative z-10 flex flex-col items-center px-12 text-center">
          <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-500/90 text-white backdrop-blur-sm shadow-lg">
            <Activity size={40} />
          </div>
          <h2 className="mb-6 text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
            Sistem Informasi <br/>
            <span className="text-teal-400">Kesehatan Digital</span>
          </h2>
          <div className="h-20 flex items-center justify-center">
            <p
              className={`text-xl font-medium text-slate-200 transition-opacity duration-500 ease-in-out ${
                fade ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {BENEFITS[currentBenefitIndex]}
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex w-full items-center justify-center lg:w-1/2 p-8 sm:p-12 lg:p-16 bg-slate-50 lg:bg-white">
        <div className="w-full max-w-md rounded-[2rem] bg-white p-8 sm:p-10 lg:p-0 lg:rounded-none lg:bg-transparent shadow-xl lg:shadow-none">
          <div className="mb-8 text-center lg:text-left">
            <div className="lg:hidden mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-md">
              <Activity size={32} />
            </div>
            <h1 className="mb-2 text-3xl font-black tracking-tight text-slate-800">Masuk ke SIS-PHS</h1>
            <p className="text-sm font-medium leading-6 text-slate-500">
              Gunakan akun Anda untuk mengakses dashboard dan modul kerja sesuai hak akses.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <User size={20} />
                  </div>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    className="w-full rounded-2xl bg-slate-50 lg:bg-slate-100 py-4 pl-12 pr-4 font-medium text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 border border-slate-200 lg:border-none focus:border-teal-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Lock size={20} />
                  </div>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full rounded-2xl bg-slate-50 lg:bg-slate-100 py-4 pl-12 pr-12 font-medium text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 border border-slate-200 lg:border-none focus:border-teal-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-slate-600"
                    title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 border border-rose-100">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-white transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${
                isSubmitting ? 'cursor-wait bg-teal-500/80' : 'bg-teal-500 hover:bg-teal-600'
              }`}
            >
                {isSubmitting ? (
                <>
                  <span className="h-5 w-5 rounded-full border-2 border-white/35 border-t-white animate-spin" />
                  <span className="font-bold">Memproses...</span>
                </>
              ) : (
                <>
                  <span className="font-bold">Masuk ke Sistem</span>
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
