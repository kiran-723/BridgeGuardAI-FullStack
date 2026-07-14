import React from 'react'

const STYLES = {
  Safe: 'badge-safe',
  Warning: 'badge-warning',
  Critical: 'badge-critical',
}

export default function StatusBadge({ status }) {
  const cls = STYLES[status] || 'bg-slate-100 text-slate-500'
  return <span className={`badge ${cls}`}>{status || 'Unknown'}</span>
}
