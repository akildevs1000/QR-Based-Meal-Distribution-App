import { useEffect, useRef, useState } from 'react'
import {
  useMe,
  useSettings,
  useSaveSettings,
  useUploadLogo,
  useDeleteLogo,
  useUpdateProfile,
  useUpdatePassword,
} from '../api/queries'

const inputCls =
  'w-full bg-surface-container-lowest border border-outline-variant/50 rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none transition-all'

const tabs = [
  { id: 'profile', label: 'Profile', icon: 'person' },
  { id: 'security', label: 'Security', icon: 'lock' },
  { id: 'branding', label: 'Branding', icon: 'palette' },
]

function Section({ title, subtitle, children }) {
  return (
    <section className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-6">
      <header className="mb-5">
        <h2 className="text-base font-semibold text-slate-100">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </header>
      {children}
    </section>
  )
}

function Banner({ kind, children }) {
  if (!children) return null
  const cls =
    kind === 'error'
      ? 'text-xs text-red-400 bg-red-900/20 border border-red-800/40'
      : 'text-xs text-emerald-400 bg-emerald-900/20 border border-emerald-800/40'
  return <div className={`${cls} rounded px-3 py-2`}>{children}</div>
}

function ProfileTab() {
  const { data: me } = useMe()
  const update = useUpdateProfile()
  const [form, setForm] = useState({ name: '', email: '' })
  const [msg, setMsg] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    if (me) setForm({ name: me.name || '', email: me.email || '' })
  }, [me])

  const onSubmit = async (e) => {
    e.preventDefault()
    setMsg(null)
    setErr(null)
    try {
      await update.mutateAsync(form)
      setMsg('Profile updated.')
    } catch (e) {
      const errs = e?.response?.data?.errors
      setErr(errs ? Object.values(errs).flat().join(' ') : e?.response?.data?.message || e?.message || 'Could not update profile.')
    }
  }

  return (
    <Section title="Your profile" subtitle="Name and email shown across the admin console.">
      <form onSubmit={onSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">Name</label>
          <input
            className={inputCls}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">Email</label>
          <input
            type="email"
            className={inputCls}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <Banner kind="error">{err}</Banner>
        <Banner kind="success">{msg}</Banner>
        <button
          type="submit"
          disabled={update.isPending}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded px-4 py-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {update.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </Section>
  )
}

function SecurityTab() {
  const update = useUpdatePassword()
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [msg, setMsg] = useState(null)
  const [err, setErr] = useState(null)

  const onSubmit = async (e) => {
    e.preventDefault()
    setMsg(null)
    setErr(null)
    if (form.password !== form.password_confirmation) {
      setErr('New password and confirmation do not match.')
      return
    }
    try {
      await update.mutateAsync(form)
      setMsg('Password changed.')
      setForm({ current_password: '', password: '', password_confirmation: '' })
    } catch (e) {
      const errs = e?.response?.data?.errors
      setErr(errs ? Object.values(errs).flat().join(' ') : e?.response?.data?.message || e?.message || 'Could not change password.')
    }
  }

  return (
    <Section title="Change password" subtitle="At least 8 characters. You will stay signed in after the change.">
      <form onSubmit={onSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">Current password</label>
          <input
            type="password"
            className={inputCls}
            value={form.current_password}
            onChange={(e) => setForm({ ...form, current_password: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">New password</label>
          <input
            type="password"
            className={inputCls}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={8}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">Confirm new password</label>
          <input
            type="password"
            className={inputCls}
            value={form.password_confirmation}
            onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
            minLength={8}
            required
          />
        </div>
        <Banner kind="error">{err}</Banner>
        <Banner kind="success">{msg}</Banner>
        <button
          type="submit"
          disabled={update.isPending}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded px-4 py-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {update.isPending ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </Section>
  )
}

function BrandingTab() {
  const { data: settings } = useSettings()
  const save = useSaveSettings()
  const upload = useUploadLogo()
  const delLogo = useDeleteLogo()
  const fileRef = useRef(null)
  const [form, setForm] = useState({ company_name: '', company_tagline: '' })
  const [msg, setMsg] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    if (settings) {
      setForm({
        company_name: settings.company_name || '',
        company_tagline: settings.company_tagline || '',
      })
    }
  }, [settings])

  const onSaveText = async (e) => {
    e.preventDefault()
    setMsg(null)
    setErr(null)
    try {
      await save.mutateAsync(form)
      setMsg('Branding updated.')
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || 'Could not save.')
    }
  }

  const onPickFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMsg(null)
    setErr(null)
    try {
      await upload.mutateAsync(file)
      setMsg('Logo uploaded.')
    } catch (e) {
      const errs = e?.response?.data?.errors
      setErr(errs ? Object.values(errs).flat().join(' ') : e?.response?.data?.message || e?.message || 'Upload failed.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const onRemoveLogo = async () => {
    setMsg(null)
    setErr(null)
    try {
      await delLogo.mutateAsync()
      setMsg('Logo removed.')
    } catch (e) {
      setErr(e?.response?.data?.message || 'Could not remove logo.')
    }
  }

  return (
    <div className="space-y-6">
      <Section title="Company identity" subtitle="Shown in the admin sidebar, top bar, scanner, and counter apps.">
        <form onSubmit={onSaveText} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs text-slate-300 mb-1.5">Company name</label>
            <input
              className={inputCls}
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              placeholder="e.g. Acme Catering"
              maxLength={120}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1.5">Tagline (optional)</label>
            <input
              className={inputCls}
              value={form.company_tagline}
              onChange={(e) => setForm({ ...form, company_tagline: e.target.value })}
              placeholder="e.g. Meal distribution, simplified"
              maxLength={160}
            />
          </div>
          <button
            type="submit"
            disabled={save.isPending}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded px-4 py-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {save.isPending ? 'Saving…' : 'Save'}
          </button>
        </form>
      </Section>

      <Section title="Company logo" subtitle="PNG, JPG, WEBP, or SVG. Max 2 MB. Recommended: square or wide transparent PNG.">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="h-24 w-24 rounded-lg border border-outline-variant/50 bg-surface-container-lowest flex items-center justify-center overflow-hidden">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="material-symbols-outlined text-slate-600" style={{ fontSize: 40 }}>image</span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={onPickFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={upload.isPending}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded px-4 py-2 transition-colors disabled:opacity-60"
            >
              {upload.isPending ? 'Uploading…' : settings?.logo_url ? 'Replace logo' : 'Upload logo'}
            </button>
            {settings?.logo_url && (
              <button
                type="button"
                onClick={onRemoveLogo}
                disabled={delLogo.isPending}
                className="border border-outline-variant/50 hover:bg-surface-container-highest/40 text-slate-300 text-sm rounded px-4 py-2 transition-colors disabled:opacity-60"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </Section>

      <Banner kind="error">{err}</Banner>
      <Banner kind="success">{msg}</Banner>
    </div>
  )
}

export default function Settings() {
  const [tab, setTab] = useState('profile')

  return (
    <>
      <header className="mb-lg">
        <h1 className="font-h1 text-h1 text-slate-100">Settings</h1>
        <p className="font-body-md text-body-md text-slate-400 mt-1">Manage your account and how the platform looks.</p>
      </header>

      <div className="flex gap-1 border-b border-outline-variant/40 mb-lg">
        {tabs.map((t) => {
          const active = t.id === tab
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                active
                  ? 'text-blue-300 border-blue-400'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                {t.icon}
              </span>
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'profile' && <ProfileTab />}
      {tab === 'security' && <SecurityTab />}
      {tab === 'branding' && <BrandingTab />}
    </>
  )
}
