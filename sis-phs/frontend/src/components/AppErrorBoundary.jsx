import { Component } from 'react'

export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Terjadi kesalahan saat membuka halaman.',
    }
  }

  componentDidCatch(error) {
    console.error('AppErrorBoundary caught error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 dark:bg-slate-900">
          <div className="w-full max-w-lg rounded-[2rem] border border-rose-200 bg-white p-8 text-center shadow-sm dark:border-rose-900/40 dark:bg-slate-800">
            <div className="text-sm font-bold uppercase tracking-[0.25em] text-rose-500">UI Error</div>
            <h1 className="mt-3 text-2xl font-black text-slate-900 dark:text-white">Halaman gagal dimuat</h1>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{this.state.message}</p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-2xl bg-teal-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-700"
              >
                Reload
              </button>
              <button
                type="button"
                onClick={() => window.location.assign('/')}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
