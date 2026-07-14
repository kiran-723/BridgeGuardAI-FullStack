import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Search, Upload, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import BridgeFormModal from '../components/BridgeFormModal.jsx'
import client from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

const PAGE_SIZE = 10

export default function BridgesPage() {
  const { user } = useAuth()
  const canEdit = user?.role === 'admin' || user?.role === 'inspector'
  const canDelete = user?.role === 'admin'

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [materialFilter, setMaterialFilter] = useState('')
  const [sortBy, setSortBy] = useState('bridge_id')
  const [sortDir, setSortDir] = useState('asc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingBridge, setEditingBridge] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const fileInputRef = useRef(null)

  const fetchBridges = useCallback(() => {
    setLoading(true)
    client.get('/bridges', {
      params: {
        search: search || undefined,
        status: statusFilter || undefined,
        material: materialFilter || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
        page,
        page_size: PAGE_SIZE,
      },
    })
      .then(({ data }) => {
        setRows(data.items)
        setTotal(data.total)
        setError('')
      })
      .catch(() => setError('Could not load bridges. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [search, statusFilter, materialFilter, sortBy, sortDir, page])

  useEffect(() => { fetchBridges() }, [fetchBridges])

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    setUploadMsg('Uploading…')
    try {
      const { data } = await client.post('/bridges/csv/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setUploadMsg(`Done: ${data.inserted} added, ${data.updated} updated, ${data.skipped_rows} skipped.`)
      fetchBridges()
    } catch (err) {
      setUploadMsg(err.response?.data?.detail || 'Upload failed.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
      setTimeout(() => setUploadMsg(''), 6000)
    }
  }

  const openAdd = () => { setEditingBridge(null); setModalOpen(true) }
  const openEdit = (bridge) => { setEditingBridge(bridge); setModalOpen(true) }

  const handleSubmit = async (payload) => {
    setSubmitting(true)
    try {
      if (editingBridge) {
        await client.put(`/bridges/${editingBridge.id}`, payload)
      } else {
        await client.post('/bridges', payload)
      }
      setModalOpen(false)
      fetchBridges()
    } catch (err) {
      alert(err.response?.data?.detail || 'Save failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (bridge) => {
    if (!confirm(`Delete bridge ${bridge.bridge_id}? This cannot be undone.`)) return
    try {
      await client.delete(`/bridges/${bridge.id}`)
      fetchBridges()
    } catch (err) {
      alert(err.response?.data?.detail || 'Delete failed.')
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const columns = [
    { key: 'bridge_id', label: 'Bridge ID' },
    { key: 'location', label: 'Location' },
    { key: 'material', label: 'Material' },
    { key: 'age', label: 'Age' },
    { key: 'design_capacity_kn', label: 'Capacity (kN)' },
    { key: 'status', label: 'Status' },
  ]

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-dark">Bridge Management</h1>
          <p className="text-sm text-slate-500 mt-1">{total} bridge{total === 1 ? '' : 's'} in the dataset.</p>
        </div>
        {canEdit && (
          <div className="flex gap-3">
            <label className="btn-secondary cursor-pointer">
              <Upload className="w-4 h-4" /> Upload CSV
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleUpload} />
            </label>
            <button onClick={openAdd} className="btn-primary">
              <Plus className="w-4 h-4" /> Add Bridge
            </button>
          </div>
        )}
      </div>

      {uploadMsg && (
        <div className="mb-4 rounded-lg bg-steel/10 border border-steel/20 px-4 py-2.5 text-sm text-navy">
          {uploadMsg}
        </div>
      )}

      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value) }}
              placeholder="Search by Bridge ID, name, or location…"
              className="input-field pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setPage(1); setStatusFilter(e.target.value) }}
            className="input-field md:w-44"
          >
            <option value="">All statuses</option>
            <option value="Safe">Safe</option>
            <option value="Warning">Warning</option>
            <option value="Critical">Critical</option>
          </select>
          <input
            value={materialFilter}
            onChange={(e) => { setPage(1); setMaterialFilter(e.target.value) }}
            placeholder="Filter by material…"
            className="input-field md:w-48"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-sm text-critical">{error}</div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="text-left px-4 py-3 font-semibold whitespace-nowrap">
                    <button className="flex items-center gap-1 hover:text-navy" onClick={() => toggleSort(col.key)}>
                      {col.label} <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                ))}
                {canEdit && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td></tr>
                ))
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No bridges match your filters.</td></tr>
              ) : (
                rows.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-navy-dark whitespace-nowrap">{b.bridge_id}</td>
                    <td className="px-4 py-3 text-slate-600">{b.location || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{b.material || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{b.age ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono">{b.design_capacity_kn ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button onClick={() => openEdit(b)} className="text-slate-400 hover:text-navy p-1.5" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        {canDelete && (
                          <button onClick={() => handleDelete(b)} className="text-slate-400 hover:text-critical p-1.5" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm text-slate-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-secondary !px-3 !py-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-secondary !px-3 !py-1.5"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <BridgeFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingBridge}
        submitting={submitting}
      />
    </Layout>
  )
}
