import React, { useEffect, useState } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import Layout from '../components/Layout.jsx'
import StatCard from '../components/StatCard.jsx'
import client from '../api/client.js'
import { GitBranch, Layers, ShieldAlert } from 'lucide-react'

const PALETTE = ['#0F2A4A', '#2F80ED', '#16A34A', '#D97706', '#DC2626', '#7C3AED', '#0EA5E9']

function toChartData(obj) {
  return Object.entries(obj || {}).map(([name, value]) => ({ name, value }))
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    client.get('/analytics/summary')
      .then(({ data }) => setSummary(data))
      .catch(() => setError('Could not load analytics. Is the backend running?'))
  }, [])

  if (error) {
    return (
      <Layout>
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-critical">{error}</div>
      </Layout>
    )
  }

  if (!summary) {
    return (
      <Layout>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-64 animate-pulse bg-slate-100" />)}
        </div>
      </Layout>
    )
  }

  const materialData = toChartData(summary.material_counts)
  const typeData = toChartData(summary.type_counts)
  const corrosionData = toChartData(summary.corrosion_counts)
  const ageData = toChartData(summary.age_distribution)

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-dark">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Portfolio composition and risk trends, generated live from the current dataset.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Avg Load Capacity" value={`${summary.avg_load_capacity}`} sublabel="kN" icon={GitBranch} tone="navy" />
        <StatCard label="Materials Tracked" value={materialData.length} icon={Layers} tone="navy" />
        <StatCard label="Avg Risk" value={`${summary.avg_risk_percentage}%`} icon={ShieldAlert} tone="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Bridge Material">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={materialData} dataKey="value" nameKey="name" outerRadius={95} label>
                {materialData.map((d, i) => <Cell key={d.name} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Bridge Type">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={typeData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <Tooltip />
              <Bar dataKey="value" fill="#2F80ED" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Corrosion Level">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={corrosionData} dataKey="value" nameKey="name" outerRadius={95} label>
                {corrosionData.map((d) => (
                  <Cell key={d.name} fill={{ Low: '#16A34A', Medium: '#D97706', High: '#DC2626' }[d.name] || '#94A3B8'} />
                ))}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Age Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ageData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <Tooltip />
              <Bar dataKey="value" fill="#0F2A4A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </Layout>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-navy-dark mb-4">{title}</h3>
      {children}
    </div>
  )
}
