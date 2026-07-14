import React, { useEffect, useState } from 'react'
import { GitBranch, ShieldCheck, AlertTriangle, Activity } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import Layout from '../components/Layout.jsx'
import StatCard from '../components/StatCard.jsx'
import client from '../api/client.js'

const STATUS_COLORS = { Safe: '#16A34A', Warning: '#D97706', Critical: '#DC2626', Unknown: '#94A3B8' }

export default function DashboardPage() {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get('/analytics/summary')
      .then(({ data }) => setSummary(data))
      .catch(() => setError('Could not load dashboard data. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  const statusData = summary
    ? Object.entries(summary.status_counts).map(([name, value]) => ({ name, value }))
    : []

  const ageData = summary
    ? Object.entries(summary.age_distribution).map(([name, value]) => ({ name, value }))
    : []

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-dark">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Portfolio-wide overview of bridge health and risk.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-critical">
          {error}
        </div>
      )}

      {loading ? (
        <SkeletonGrid />
      ) : summary && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Bridges" value={summary.total_bridges} icon={GitBranch} tone="navy" />
            <StatCard label="Avg Health Score" value={`${summary.avg_health_score}`} sublabel="out of 100" icon={ShieldCheck} tone="safe" />
            <StatCard label="Avg Risk" value={`${summary.avg_risk_percentage}%`} icon={AlertTriangle} tone="warning" />
            <StatCard label="Predictions Run" value={summary.total_predictions} icon={Activity} tone="navy" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold text-navy-dark mb-4">Bridge Status Distribution</h3>
              {statusData.length === 0 ? (
                <EmptyState message="No bridges yet — upload a CSV or add one from Bridge Management." />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3}>
                      {statusData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#94A3B8'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="flex gap-4 justify-center mt-2 text-xs text-slate-500">
                {statusData.map((s) => (
                  <span key={s.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[s.name] || '#94A3B8' }} />
                    {s.name} ({s.value})
                  </span>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-navy-dark mb-4">Age Distribution</h3>
              {ageData.length === 0 ? (
                <EmptyState message="No age data yet." />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={ageData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94A3B8" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94A3B8" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2F80ED" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}

function EmptyState({ message }) {
  return (
    <div className="h-[260px] flex items-center justify-center text-center text-sm text-slate-400 px-6">
      {message}
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card h-24 animate-pulse bg-slate-100" />
      ))}
    </div>
  )
}
