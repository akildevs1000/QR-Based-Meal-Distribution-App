import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLogin, usePublicSettings } from '../api/queries'

const inputCls =
  'w-full bg-surface-container-high/50 border border-outline-variant/30 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 hover:bg-surface-container-high/70 hover:border-outline-variant/50 focus:bg-surface-container-high focus:border-blue-400 focus:ring-1 focus:ring-blue-400/60 focus:outline-none transition-all'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState(null)
  const login = useLogin()
  const nav = useNavigate()
  const { data: brand } = usePublicSettings()
  const companyName = brand?.company_name || 'MealDistribute Pro'
  const tagline = brand?.company_tagline || 'Admin control center'

  const onSubmit = async (e) => {
    e.preventDefault()
    setErr(null)
    try {
      const data = await login.mutateAsync({ email, password })
      nav(data?.type === 'supplier' ? '/supplier' : '/dashboard', { replace: true })
    } catch (e) {
      setErr(e?.response?.data?.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface relative overflow-hidden font-inter">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_50%)] pointer-events-none" />
      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-sm bg-surface-container-low border border-outline-variant/50 rounded-xl p-xl space-y-md"
      >
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-600/20 border border-blue-500/30 mb-2">
            <span className="material-symbols-outlined text-blue-400" style={{ fontSize: 24 }}>restaurant</span>
          </div>
          <h1 className="text-h2 font-h2 text-slate-100">{companyName}</h1>
          <p className="text-body-md text-slate-400">{tagline}</p>
        </div>
        <div>
          <label className="block text-label-md text-slate-300 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            required
          />
        </div>
        <div>
          <label className="block text-label-md text-slate-300 mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
            required
          />
        </div>
        {err && (
          <div className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded px-3 py-2">
            {err}
          </div>
        )}
        <button
          type="submit"
          disabled={login.isPending}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded px-4 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
