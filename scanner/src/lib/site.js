import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = 'counter_site'

export function useSite() {
  const [site, setSite] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!alive) return
        try {
          const parsed = raw ? JSON.parse(raw) : null
          if (parsed && typeof parsed === 'object' && parsed.id) setSite(parsed)
        } catch {}
        setLoaded(true)
      })
      .catch(() => alive && setLoaded(true))
    return () => { alive = false }
  }, [])

  const save = async (next) => {
    if (next) await AsyncStorage.setItem(KEY, JSON.stringify(next))
    else await AsyncStorage.removeItem(KEY)
    setSite(next)
  }

  return { site, save, loaded }
}
