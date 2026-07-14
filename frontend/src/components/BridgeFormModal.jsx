import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const EMPTY_FORM = {
  bridge_id: '', name: '', location: '', type: '', material: '',
  age: '', span_m: '', width_m: '', current_load_kn: '', design_capacity_kn: '',
  year_built: '', no_of_spans: '', latitude: '', longitude: '',
  temperature_c: '', humidity_pct: '', stress_mpa: '', strain_micro: '',
  vibration_hz: '', crack_width_mm: '', corrosion: 'Low',
  last_inspection: '', next_inspection: '',
}

const NUMERIC_KEYS = new Set([
  'age', 'span_m', 'width_m', 'current_load_kn', 'design_capacity_kn',
  'year_built', 'no_of_spans', 'latitude', 'longitude', 'temperature_c',
  'humidity_pct', 'stress_mpa', 'strain_micro', 'vibration_hz', 'crack_width_mm',
])

export default function BridgeFormModal({ open, onClose, onSubmit, initialData, submitting }) {
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (initialData) {
      const next = { ...EMPTY_FORM }
      Object.keys(next).forEach((k) => {
        if (initialData[k] !== undefined && initialData[k] !== null) next[k] = initialData[k]
      })
      setForm(next)
    } else {
      setForm(EMPTY_FORM)
    }
  }, [initialData, open])

  if (!open) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {}
    Object.entries(form).forEach(([k, v]) => {
      if (v === '') return
      payload[k] = NUMERIC_KEYS.has(k) ? Number(v) : v
    })
    onSubmit(payload)
  }

  const isEdit = Boolean(initialData)

  const fieldGroups = [
    { title: 'Identity', fields: ['bridge_id', 'name', 'location', 'type', 'material'] },
    { title: 'Structure', fields: ['age', 'span_m', 'width_m', 'no_of_spans', 'year_built'] },
    { title: 'Load', fields: ['current_load_kn', 'design_capacity_kn'] },
    { title: 'Location', fields: ['latitude', 'longitude'] },
    { title: 'Sensor readings', fields: ['temperature_c', 'humidity_pct', 'stress_mpa', 'strain_micro', 'vibration_hz', 'crack_width_mm', 'corrosion'] },
    { title: 'Inspection', fields: ['last_inspection', 'next_inspection'] },
  ]

  const labelFor = (key) => key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace('Kn', '(kN)').replace('M', '(m)').replace('Mpa', '(MPa)').replace('Hz', '(Hz)').replace('Mm', '(mm)').replace('C', '(°C)').replace('Pct', '(%)')

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-elevated w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="font-semibold text-lg text-navy-dark">{isEdit ? 'Edit Bridge' : 'Add Bridge'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {fieldGroups.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">{group.title}</p>
              <div className="grid grid-cols-2 gap-3">
                {group.fields.map((key) => (
                  <div key={key} className={key === 'bridge_id' || key === 'name' || key === 'location' ? 'col-span-2' : ''}>
                    <label className="text-xs text-slate-500 mb-1 block">{labelFor(key)}{key === 'bridge_id' && ' *'}</label>
                    {key === 'corrosion' ? (
                      <select name={key} value={form[key]} onChange={handleChange} className="input-field">
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    ) : (
                      <input
                        name={key}
                        value={form[key]}
                        onChange={handleChange}
                        required={key === 'bridge_id'}
                        disabled={key === 'bridge_id' && isEdit}
                        type={NUMERIC_KEYS.has(key) ? 'number' : key.includes('inspection') ? 'date' : 'text'}
                        step="any"
                        className="input-field disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-2 sticky bottom-0 bg-white">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add bridge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
