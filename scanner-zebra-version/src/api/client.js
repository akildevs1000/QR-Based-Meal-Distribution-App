import axios from 'axios'

export const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE || 'http://192.168.1.159:8000/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 5000,
  headers: { Accept: 'application/json' },
})

export async function postScan(code, siteId = null) {
  const { data } = await api.post('/scan', { code, site_id: siteId })
  return data
}

export async function fetchSites() {
  const { data } = await api.get('/public/sites')
  return data
}

export async function fetchPublicSettings() {
  const { data } = await api.get('/public/settings')
  return data
}

export async function fetchSiteStats(siteId) {
  const { data } = await api.get(`/public/sites/${siteId}/stats`)
  return data
}

export async function fetchPublicMealRules() {
  const { data } = await api.get('/public/meal-rules')
  return Array.isArray(data) ? data : []
}

export async function fetchSiteLogs(siteId, limit = 10) {
  const { data } = await api.get(`/public/sites/${siteId}/logs`, { params: { limit } })
  return { data: data?.data ?? [], hasMore: !!data?.has_more }
}

export async function verifySitePin(siteId, pin) {
  try {
    const { data } = await api.post(`/public/sites/${siteId}/verify-pin`, { pin })
    return !!data?.ok
  } catch (e) {
    if (e?.response?.status === 422) return false
    throw e
  }
}

export function pictureUrl(path) {
  if (!path) return null
  const origin = API_BASE.replace(/\/api\/?$/, '')
  return `${origin}/storage/${path}`
}
