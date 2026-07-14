import React, { useEffect, useState } from 'react'
import { Thermometer, Droplets, Gauge, Waves, Ruler, ShieldAlert } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import client from '../api/client.js'

export default function MonitoringPage() {
  const [bridges, setBridges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    client.get('/bridges', { params: { page: 1, page_size: 100 } })
      .then(({ data }) => setBridges(data.items))
      .catch(() => setError('Could not load monitoring data. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-dark">Structural Health Monitoring</h1>
        <p className="text-sm text-slate-500 mt-1">Live sensor readings per bridge, sourced from the current dataset.</p>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-critical mb-4">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="card h-48 animate-pulse bg-slate-100" />)}
        </div>
      ) : bridges.length === 0 ? (
        <div className="card text-center text-slate-400 py-10">No bridges to monitor yet — add one or upload a CSV.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {bridges.map((b) => (
            <div key={b.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono font-semibold text-navy-dark">{b.bridge_id}</p>
                  <p className="text-xs text-slate-400">{b.location || 'Unknown location'}</p>
                </div>
                <StatusBadge status={b.status} />
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-sm">
                <Reading icon={Thermometer} label="Temp" value={b.temperature_c} unit="°C" />
                <Reading icon={Droplets} label="Humidity" value={b.humidity_pct} unit="%" />
                <Reading icon={Gauge} label="Stress" value={b.stress_mpa} unit="MPa" />
                <Reading icon={Waves} label="Vibration" value={b.vibration_hz} unit="Hz" />
                <Reading icon={Ruler} label="Crack Width" value={b.crack_width_mm} unit="mm" />
                <Reading icon={ShieldAlert} label="Corrosion" value={b.corrosion} unit="" />
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-400">
                <span>Last inspected: {b.last_inspection || '—'}</span>
                <span>Next due: {b.next_inspection || '—'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}

function Reading({ icon: Icon, label, value, unit }) {
  return (
    <div className="flex items-center gap-2 text-slate-600">
      <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <span className="text-xs text-slate-400">{label}:</span>
      <span className="font-mono text-xs font-medium text-navy-dark">
        {value === null || value === undefined || value === '' ? '—' : `${value}${unit}`}
      </span>
    </div>
  )
}
