import { X } from 'lucide-react'

export function Modal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  size = 'lg',
}) {
  if (!open) return null

  const sizeClass = {
    sm: 'max-w-lg',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  }[size] || 'max-w-3xl'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup modal"
        className="absolute inset-0 bg-slate-950/60"
        onClick={onClose}
      />
      <div className={`relative w-full ${sizeClass} rounded-[2rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden`}>
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
            {description ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto custom-scroll">
          {children}
        </div>

        {footer ? (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 flex flex-wrap justify-end gap-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}
