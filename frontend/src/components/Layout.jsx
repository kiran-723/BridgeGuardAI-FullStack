import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, GitBranch, Activity, BrainCircuit, BarChart3,
  Bell, LogOut, Menu, X, Shield,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/bridges', label: 'Bridge Management', icon: GitBranch },
  { to: '/monitoring', label: 'Health Monitoring', icon: Activity },
  { to: '/prediction', label: 'Prediction', icon: BrainCircuit },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/notifications', label: 'Notifications', icon: Bell },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={`fixed z-30 inset-y-0 left-0 w-64 bg-navy text-white flex flex-col
          transform transition-transform duration-200 lg:translate-x-0 lg:static
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center gap-2 px-5 h-16 border-b border-white/10">
          <Shield className="w-6 h-6 text-steel-light" strokeWidth={2.2} />
          <span className="font-bold text-lg tracking-tight">BridgeGuard <span className="text-steel-light">AI</span></span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="text-xs text-slate-400 mb-2 truncate">
            Signed in as <span className="text-slate-200 font-medium">{user?.full_name || user?.username}</span>
            <span className="block uppercase tracking-wide text-[10px] text-steel-light mt-0.5">{user?.role}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium
              text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10">
          <button
            className="lg:hidden text-navy"
            onClick={() => setSidebarOpen((s) => !s)}
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="hidden lg:block text-sm text-slate-500 font-medium">
            Bridge Infrastructure Management System
          </div>
          <div className="flex items-center gap-3">
            <span className="badge badge-safe hidden sm:inline-flex">Live</span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 bg-surface">{children}</main>
      </div>
    </div>
  )
}
