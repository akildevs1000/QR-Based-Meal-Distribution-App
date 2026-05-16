import { useEffect, useState } from 'react'
import { useMe, useUpdateSupplierProfile, useUpdateSupplierPassword } from '../api/queries'

const inputCls =
  'w-full bg-surface-container-high/50 border border-outline-variant/30 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 hover:bg-surface-container-high/70 hover:border-outline-variant/50 focus:bg-surface-container-high focus:border-blue-400 focus:ring-1 focus:ring-blue-400/60 focus:outline-none transition-all'

export default function SupplierProfile() {
  const { data: me } = useMe()
  const updateProfile = useUpdateSupplierProfile()
  const updatePassword = useUpdateSupplierPassword()

  const [form, setForm] = useState({ name: '', email: '' })
  const [profileMsg, setProfileMsg] = useState(null)
  const [profileErr, setProfileErr] = useState(null)

  const [pwd, setPwd] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [pwdMsg, setPwdMsg] = useState(null)
  const [pwdErr, setPwdErr] = useState(null)

  useEffect(() => {
    if (me?.type === 'supplier') setForm({ name: me.name || '', email: me.email || '' })
  }, [me])

  const onSaveProfile = async (e) => {
    e.preventDefault()
    setProfileMsg(null); setProfileErr(null)
    try {
      await updateProfile.mutateAsync(form)
      setProfileMsg('Profile updated.')
    } catch (err) {
      const errors = err?.response?.data?.errors
      const first = errors ? Object.values(errors)[0]?.[0] : null
      setProfileErr(first || err?.response?.data?.message || 'Update failed')
    }
  }

  const onSavePassword = async (e) => {
    e.preventDefault()
    setPwdMsg(null); setPwdErr(null)
    if (pwd.password !== pwd.password_confirmation) {
      setPwdErr('Passwords do not match.')
      return
    }
    try {
      await updatePassword.mutateAsync(pwd)
      setPwdMsg('Password updated.')
      setPwd({ current_password: '', password: '', password_confirmation: '' })
    } catch (err) {
      const errors = err?.response?.data?.errors
      const first = errors ? Object.values(errors)[0]?.[0] : null
      setPwdErr(first || err?.response?.data?.message || 'Update failed')
    }
  }

  return (
    <div className="space-y-md max-w-2xl">
      <header>
        <h1 className="font-h1 text-h1 text-slate-100">Profile</h1>
        <p className="font-body-md text-body-md text-slate-400 mt-1">
          {me?.supplier?.name} · <span className="font-mono">{me?.supplier?.supplier_code}</span> · role: <span className="capitalize">{me?.role}</span>
        </p>
      </header>

      <section className="bg-surface-container-low border border-outline-variant/50 rounded-lg p-lg">
        <h2 className="text-h3 font-h3 text-slate-100 mb-md">Personal details</h2>
        <form onSubmit={onSaveProfile} className="space-y-md">
          <div>
            <label className="block text-label-md text-slate-300 mb-1.5">Name</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-label-md text-slate-300 mb-1.5">Email</label>
            <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
          </div>
          {profileErr && <div className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded px-3 py-2">{profileErr}</div>}
          {profileMsg && <div className="text-xs text-green-400 bg-green-900/20 border border-green-800/40 rounded px-3 py-2">{profileMsg}</div>}
          <div className="flex justify-end">
            <button type="submit" disabled={updateProfile.isPending}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 disabled:opacity-60">
              {updateProfile.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </section>

      <section className="bg-surface-container-low border border-outline-variant/50 rounded-lg p-lg">
        <h2 className="text-h3 font-h3 text-slate-100 mb-md">Change password</h2>
        <form onSubmit={onSavePassword} className="space-y-md">
          <div>
            <label className="block text-label-md text-slate-300 mb-1.5">Current password</label>
            <input required type="password" value={pwd.current_password} onChange={e => setPwd({ ...pwd, current_password: e.target.value })} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="block text-label-md text-slate-300 mb-1.5">New password (min 8)</label>
              <input required type="password" minLength={8} value={pwd.password} onChange={e => setPwd({ ...pwd, password: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-label-md text-slate-300 mb-1.5">Confirm new password</label>
              <input required type="password" minLength={8} value={pwd.password_confirmation} onChange={e => setPwd({ ...pwd, password_confirmation: e.target.value })} className={inputCls} />
            </div>
          </div>
          {pwdErr && <div className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded px-3 py-2">{pwdErr}</div>}
          {pwdMsg && <div className="text-xs text-green-400 bg-green-900/20 border border-green-800/40 rounded px-3 py-2">{pwdMsg}</div>}
          <div className="flex justify-end">
            <button type="submit" disabled={updatePassword.isPending}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 disabled:opacity-60">
              {updatePassword.isPending ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
