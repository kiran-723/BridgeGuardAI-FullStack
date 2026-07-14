import React from 'react'

export default function StatCard({ label, value, sublabel, icon: Icon, tone = 'navy' }) {
  const toneClasses = {
    navy: 'bg-navy/5 text-navy',
    safe: 'bg-green-50 text-safe',
    warning: 'bg-amber-50 text-warning',
    critical: 'bg-red-50 text-critical',
  }[tone]

  return (
    <div className="card flex items-center justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-1.5 text-2xl font-bold text-navy-dark font-mono">{value}</p>
        {sublabel && <p className="mt-1 text-xs text-slate-400">{sublabel}</p>}
      </div>
      {Icon && (
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${toneClasses}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  )
}
