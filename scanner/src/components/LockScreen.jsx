import { useState } from 'react'
import { View, Text, StyleSheet, Pressable, Vibration, ActivityIndicator } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { verifySitePin } from '../api/client'
import { useTheme, radii, spacing } from '../lib/theme'

const PIN_MAX = 12
const PIN_MIN = 4
const DOT_COUNT = PIN_MIN

export default function LockScreen({ site, onUnlock }) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const push = (ch) => {
    if (busy) return
    setError(null)
    setPin((p) => (p.length >= PIN_MAX ? p : p + ch))
  }
  const back = () => {
    if (busy) return
    setError(null)
    setPin((p) => p.slice(0, -1))
  }

  const submit = async () => {
    if (busy || pin.length < PIN_MIN) return
    setBusy(true)
    try {
      const ok = await verifySitePin(site.id, pin)
      if (ok) {
        onUnlock()
      } else {
        setError('Incorrect PIN')
        Vibration.vibrate(120)
        setPin('')
      }
    } catch {
      setError('Could not verify. Check network.')
    } finally {
      setBusy(false)
    }
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
  const overflow = Math.max(0, pin.length - DOT_COUNT)

  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <View style={styles.lockBadge}>
          <Ionicons name="lock-closed" size={36} color={colors.primary} />
        </View>
        <Text style={styles.title}>Scanner locked</Text>
        <Text style={styles.subtitle}>
          Enter the PIN for <Text style={styles.siteName}>{site.name}</Text>
        </Text>
        <Text style={styles.siteCode}>{site.site_code}</Text>

        <View style={styles.dots}>
          {Array.from({ length: DOT_COUNT }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i < pin.length ? styles.dotFilled : null]}
            />
          ))}
          {overflow > 0 && <Text style={styles.overflow}>+{overflow}</Text>}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : <View style={styles.errorSpacer} />}
      </View>

      <View style={styles.pad}>
        {keys.map((k) => (
          <Pressable
            key={k}
            onPress={() => push(k)}
            style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
            android_ripple={{ color: colors.surfaceContainerHigh, borderless: true }}
          >
            <Text style={styles.keyText}>{k}</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={back}
          style={({ pressed }) => [styles.key, styles.keyAux, pressed && { opacity: 0.6 }]}
          android_ripple={{ color: colors.surfaceContainerHigh, borderless: true }}
        >
          <Ionicons name="backspace-outline" size={26} color={colors.onSurfaceVariant} />
        </Pressable>
        <Pressable
          onPress={() => push('0')}
          style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
          android_ripple={{ color: colors.surfaceContainerHigh, borderless: true }}
        >
          <Text style={styles.keyText}>0</Text>
        </Pressable>
        <Pressable
          onPress={submit}
          disabled={busy || pin.length < PIN_MIN}
          style={({ pressed }) => [
            styles.key,
            styles.keySubmit,
            (busy || pin.length < PIN_MIN) && styles.keyDisabled,
            pressed && styles.keyPressed,
          ]}
          android_ripple={{ color: '#1d4ed8', borderless: true }}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons name="arrow-forward" size={26} color="#fff" />
          )}
        </Pressable>
      </View>
    </View>
  )
}

const KEY_GAP = 12

const makeStyles = (colors) => StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0, right: 0, bottom: 0, left: 0,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'space-between',
    zIndex: 90,
  },
  top: { alignItems: 'center', paddingTop: spacing.xl * 2 },
  lockBadge: {
    width: 72, height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { color: colors.onSurface, fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { color: colors.onSurfaceVariant, fontSize: 14, marginTop: spacing.sm, textAlign: 'center' },
  siteName: { color: colors.primary, fontWeight: '700' },
  siteCode: { color: colors.textMuted, fontFamily: 'monospace', fontSize: 12, marginTop: 2, letterSpacing: 1 },
  dots: { flexDirection: 'row', gap: 14, marginTop: spacing.xl, alignItems: 'center' },
  dot: {
    width: 14, height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: colors.primary, borderColor: colors.primary },
  overflow: { color: colors.textMuted, fontSize: 13, marginLeft: 6, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 14, fontWeight: '600', marginTop: spacing.md },
  errorSpacer: { height: 14, marginTop: spacing.md },

  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: KEY_GAP,
    paddingBottom: spacing.xl,
  },
  key: {
    width: 88, height: 72,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: { backgroundColor: colors.surfaceContainerHigh },
  keyText: { color: colors.onSurface, fontSize: 26, fontWeight: '600' },
  keyAux: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keySubmit: { backgroundColor: colors.primaryAccent, borderColor: colors.primaryAccent },
  keyDisabled: { opacity: 0.4 },
})
