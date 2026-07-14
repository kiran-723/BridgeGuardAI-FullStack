import React, { useEffect, useState } from 'react'
import { Bell, AlertTriangle, Info, CheckCircle2 } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import client from '../api/client.js'

const ICONS = { info: Info, warning: AlertTriangle, critical: AlertTriangle }
const TONE = {
  info: 'bg-navy/5 text-navy',
  warning: 'bg-amber-50 text-warning',
  critical: 'bg-red-50 text-critical',
}

export default function NotificationsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    client.get('/notifications')
      .then(({ data }) => setItems(data))
      .catch(() => setError('Could not load notifications. Is the backend running?'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const markRead = async (id) => {
    try {
      await client.post(`/notifications/${id}/read`)
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)))
    } catch {
      /* non-critical, ignore */
    }
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-dark">Notification Center</h1>
        <p className="text-sm text-slate-500 mt-1">
          Alerts generated automatically from CSV uploads and prediction runs.
        </p>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-critical mb-4">{error}</div>}

      <div className="card p-0 divide-y divide-slate-100">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-slate-400 flex flex-col items-center gap-2">
            <Bell className="w-8 h-8 text-slate-300" />
            No notifications yet.
          </div>
        ) : (
          items.map((n) => {
            const Icon = ICONS[n.level] || Info
            return (
              <div key={n.id} className={`flex items-start gap-3 p-4 ${n.is_read ? 'opacity-60' : ''}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${TONE[n.level] || TONE.info}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-navy-dark">{n.title}</p>
                  <p className="text-sm text-slate-500">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.is_read && (
                  <button onClick={() => markRead(n.id)} className="text-xs font-medium text-steel hover:underline shrink-0 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark read
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </Layout>
  )
}
