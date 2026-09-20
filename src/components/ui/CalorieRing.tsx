'use client'

interface CalorieRingProps {
  eaten: number
  target: number
  planned: number
}

export function CalorieRing({ eaten, target, planned }: CalorieRingProps) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const eatenPct = Math.min(1, target > 0 ? eaten / target : 0)
  const plannedPct = Math.min(1, target > 0 ? planned / target : 0)
  const remaining = Math.max(0, target - eaten)
  const over = eaten > target

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          {/* Background */}
          <circle cx="64" cy="64" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" className="dark:stroke-slate-700" />
          {/* Planned */}
          <circle
            cx="64" cy="64" r={radius} fill="none"
            stroke="#bfdbfe" strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - plannedPct)}
            strokeLinecap="round"
          />
          {/* Eaten */}
          <circle
            cx="64" cy="64" r={radius} fill="none"
            stroke={over ? '#ef4444' : '#22c55e'} strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - eatenPct)}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-800 dark:text-white">{Math.round(remaining)}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">נותרו</span>
          <span className="text-xs text-slate-400">קק"ל</span>
        </div>
      </div>
      <div className="flex gap-4 mt-2 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
          <span>נאכל: {Math.round(eaten)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-blue-200 inline-block"></span>
          <span>תוכנן: {Math.round(planned)}</span>
        </div>
      </div>
    </div>
  )
}
