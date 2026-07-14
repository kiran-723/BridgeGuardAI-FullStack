import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Shield, Lock, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function LoginPage() {
  const { user, login, error, loading } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ok = await login(username, password)
    if (ok) navigate('/')
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand / hero side */}
      <div className="hidden lg:flex flex-col justify-between bg-navy text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 400 400" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="400" height="400" fill="url(#grid)" />
          </svg>
        </div>
        <div className="relative flex items-center gap-2">
          <Shield className="w-7 h-7 text-steel-light" />
          <span className="font-bold text-xl">BridgeGuard <span className="text-steel-light">AI</span></span>
        </div>
        <div className="relative">
          <h1 className="text-3xl font-bold leading-snug mb-4">
            Structural health monitoring<br />and load capacity prediction,<br />in one system.
          </h1>
          <p className="text-slate-300 max-w-md">
            Track bridge condition data, run risk assessments, and manage inspection
            workflows from a single infrastructure management platform.
          </p>
        </div>
        <p className="relative text-xs text-slate-400">© {new Date().getFullYear()} BridgeGuard AI. Internal use only.</p>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center p-6 sm:p-10 bg-surface">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Shield className="w-6 h-6 text-navy" />
            <span className="font-bold text-lg text-navy-dark">BridgeGuard AI</span>
          </div>

          <h2 className="text-2xl font-bold text-navy-dark mb-1">Sign in</h2>
          <p className="text-sm text-slate-500 mb-6">Access the bridge management dashboard.</p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-sm text-critical">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Username</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field pl-9"
                  placeholder="admin"
                  autoFocus
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-9"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-500">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-slate-300 text-navy focus:ring-navy"
                />
                Remember me
              </label>
              <button
                type="button"
                className="text-steel font-medium hover:underline"
                onClick={() => alert('Contact your system administrator to reset your password.')}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-xs text-slate-400 text-center">
            Default demo credentials: <span className="font-mono">admin / Admin@123</span>
          </p>
        </div>
      </div>
    </div>
  )
}
