export function StatCard({ title, value, subtitle, icon, trend, color = 'blue', targetValue, currentValue, targetLabel }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    teal: 'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
  }

  const bgColors = {
    blue: 'bg-blue-500',
    teal: 'bg-teal-500',
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
    amber: 'bg-amber-500',
    purple: 'bg-purple-500',
  }

  const progressPct = (targetValue && currentValue !== undefined && targetValue > 0)
    ? Math.min(100, Math.max(0, (currentValue / targetValue) * 100))
    : 0;

  return (
    <div className="app-panel-shell p-6">
      <div className="flex items-center gap-4">
        <div className={`app-panel-icon w-12 h-12 flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
          {icon || (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{value}</div>
        </div>
      </div>
      
      {targetValue !== undefined && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {progressPct.toFixed(1)}% Tercapai
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {targetLabel || `Target: ${targetValue}%`}
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${bgColors[color]}`} 
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {(subtitle || trend) && !targetValue && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          {trend && (
            <span className={`font-medium ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
          <span className="text-slate-500 dark:text-slate-400">{subtitle}</span>
        </div>
      )}
    </div>
  )
}
