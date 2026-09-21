import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mapMeResponse, saveAuthSession } from '../../services/auth';
import { getRoleHomePath } from '../navigation/config';
import { apiRequest, ApiError } from '../../services/api';
import { User, Lock, Activity, ChevronRight, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <section className="w-full max-w-md rounded-[2rem] bg-white p-8 sm:p-10">
          <div className="mb-8 text-center">
            <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500 text-white">
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
                    className="w-full rounded-2xl bg-slate-50 py-4 pl-12 pr-4 font-medium text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                    className="w-full rounded-2xl bg-slate-50 py-4 pl-12 pr-12 font-medium text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
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
              <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-white transition-colors ${
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
        </section>
      </div>
    </div>
  );
}
