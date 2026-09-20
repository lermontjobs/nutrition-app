'use client'

interface MacroBarProps {
  label: string
  value: number
  target: number
  color: string
  unit?: string
}

export function MacroBar({ label, value, target, color, unit = 'ג' }: MacroBarProps) {
  const pct = Math.min(100, target > 0 ? (value / target) * 100 : 0)
  const over = value > target

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
        <span className="font-medium">{label}</span>
        <span className={over ? 'text-red-500 font-semibold' : ''}>
          {Math.round(value)}/{target}{unit}
        </span>
      </div>
      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color} ${over ? 'opacity-70' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
