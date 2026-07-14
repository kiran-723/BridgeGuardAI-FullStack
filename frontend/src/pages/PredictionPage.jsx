import React, { useEffect, useState } from 'react'
import { BrainCircuit, Printer, Loader2 } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import client from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function PredictionPage() {
  const { user } = useAuth()
  const canRun = user?.role === 'admin' || user?.role === 'inspector'

  const [bridges, setBridges] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [result, setResult] = useState(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])

  useEffect(() => {
    client.get('/bridges', { params: { page: 1, page_size: 200 } })
      .then(({ data }) => setBridges(data.items))
      .catch(() => setError('Could not load bridge list.'))
  }, [])

  useEffect(() => {
    client.get('/predictions/history', { params: { limit: 20 } })
      .then(({ data }) => setHistory(data))
      .catch(() => {})
  }, [result])

  const runPrediction = async () => {
    if (!selectedId) return
    setRunning(true)
    setError('')
    setResult(null)
    try {
      const { data } = await client.post('/predictions/run', { bridge_id: Number(selectedId) })
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed.')
    } finally {
      setRunning(false)
    }
  }

  const selectedBridge = bridges.find((b) => String(b.id) === String(selectedId))

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-dark">Prediction</h1>
        <p className="text-sm text-slate-500 mt-1">
          Run the structural risk-scoring engine for a selected bridge using its current dataset values.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1">
          <h3 className="font-semibold text-navy-dark mb-4">Select Bridge</h3>
          <select
            value={selectedId}
            onChange={(e) => { setSelectedId(e.target.value); setResult(null) }}
            className="input-field mb-4"
          >
            <option value="">Choose a bridge…</option>
            {bridges.map((b) => (
              <option key={b.id} value={b.id}>{b.bridge_id} — {b.location || 'Unknown location'}</option>
            ))}
          </select>

          {selectedBridge && (
            <div className="text-sm text-slate-600 space-y-1.5 mb-4 border-t border-slate-100 pt-4">
              <Row label="Material" value={selectedBridge.material} />
              <Row label="Age" value={selectedBridge.age ? `${selectedBridge.age} yrs` : '—'} />
              <Row label="Load / Capacity" value={`${selectedBridge.current_load_kn ?? '—'} / ${selectedBridge.design_capacity_kn ?? '—'} kN`} />
              <Row label="Corrosion" value={selectedBridge.corrosion} />
              <Row label="Current status" value={<StatusBadge status={selectedBridge.status} />} />
            </div>
          )}

          <button onClick={runPrediction} disabled={!selectedId || running || !canRun} className="btn-primary w-full">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
            {running ? 'Analyzing…' : 'Run Prediction'}
          </button>
          {!canRun && <p className="text-xs text-slate-400 mt-2">Your role has read-only access to predictions.</p>}
          {error && <p className="text-xs text-critical mt-2">{error}</p>}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {result ? (
            <div className="card" id="prediction-report">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-navy-dark">Prediction Result — {selectedBridge?.bridge_id}</h3>
                <button onClick={() => window.print()} className="btn-secondary !px-3 !py-1.5 text-xs">
                  <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                <Metric label="Health Score" value={`${result.health_score}`} suffix="/100" tone="safe" />
                <Metric label="Risk" value={`${result.risk_percentage}%`} tone="warning" />
                <Metric label="Confidence" value={`${result.confidence_score}%`} tone="navy" />
                <Metric label="Remaining Life" value={`${result.remaining_life_years}`} suffix="yrs" tone="navy" />
                <Metric label="Failure Probability" value={`${result.failure_probability}%`} tone="critical" />
                <Metric label="Risk Level" value={result.risk_level} tone="navy" />
              </div>

              <div className="rounded-lg bg-slate-50 border border-slate-100 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                  AI Recommendation
                </p>
                <p className="text-sm text-navy-dark">{result.recommendation}</p>
              </div>

              <p className="text-xs text-slate-400 mt-4">
                Scored using a transparent rule-based engine over load ratio, age, stress, crack width,
                corrosion, and vibration — see backend README for methodology.
              </p>
            </div>
          ) : (
            <div className="card h-64 flex items-center justify-center text-center text-slate-400 text-sm px-8">
              Select a bridge and run a prediction to see the health score, risk level, and recommendation here.
            </div>
          )}

          <div className="card">
            <h3 className="font-semibold text-navy-dark mb-4">Recent Predictions</h3>
            {history.length === 0 ? (
              <p className="text-sm text-slate-400">No predictions have been run yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-slate-400">
                    <tr>
                      <th className="text-left py-2 pr-4">Date</th>
                      <th className="text-left py-2 pr-4">Health</th>
                      <th className="text-left py-2 pr-4">Risk</th>
                      <th className="text-left py-2 pr-4">Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map((h) => (
                      <tr key={h.id}>
                        <td className="py-2 pr-4 text-slate-500">{new Date(h.created_at).toLocaleString()}</td>
                        <td className="py-2 pr-4 font-mono">{h.health_score}</td>
                        <td className="py-2 pr-4 font-mono">{h.risk_percentage}%</td>
                        <td className="py-2 pr-4">{h.risk_level}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-navy-dark">{value ?? '—'}</span>
    </div>
  )
}

function Metric({ label, value, suffix, tone }) {
  const toneClass = { safe: 'text-safe', warning: 'text-warning', critical: 'text-critical', navy: 'text-navy' }[tone]
  return (
    <div className="rounded-lg border border-slate-100 p-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">{label}</p>
      <p className={`text-lg font-bold font-mono ${toneClass}`}>{value}<span className="text-xs font-normal text-slate-400 ml-0.5">{suffix}</span></p>
    </div>
  )
}
