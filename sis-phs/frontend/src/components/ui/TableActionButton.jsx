export function TableActionButton({
  icon,
  label,
  onClick,
  tone = 'default',
  disabled = false,
}) {
  const tones = {
    default: 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700',
    primary: 'border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-900/50 dark:text-teal-300 dark:hover:bg-teal-500/10',
    success: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-500/10',
    warning: 'border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-500/10',
    danger: 'border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-500/10',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone] || tones.default}`}
    >
      {icon}
    </button>
  )
}
