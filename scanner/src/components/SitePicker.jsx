import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native'
import { fetchSites } from '../api/client'
import { useTheme, radii, spacing } from '../lib/theme'

export default function SitePicker({ currentId = null, onPick, onCancel }) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const [sites, setSites] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    fetchSites()
      .then((list) => { if (alive) setSites(list) })
      .catch(() => { if (alive) setError('Could not load sites.') })
    return () => { alive = false }
  }, [])

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Text style={styles.title}>Select site</Text>
        <Text style={styles.subtitle}>Pick the site this scanner serves.</Text>

        {sites === null && !error && (
          <View style={styles.state}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}

        {error && (
          <Text style={styles.error}>{error}</Text>
        )}

        {sites && sites.length === 0 && (
          <Text style={styles.empty}>No sites available. Create one in the admin panel first.</Text>
        )}

        {sites && sites.length > 0 && (
          <ScrollView style={styles.list} contentContainerStyle={{ gap: spacing.sm }}>
            {sites.map((s) => {
              const isCurrent = currentId === s.id
              return (
                <Pressable
                  key={s.id}
                  onPress={() => onPick(s)}
                  style={({ pressed }) => [
                    styles.row,
                    isCurrent && styles.rowActive,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName}>{s.name}</Text>
                    <Text style={styles.rowCode}>{s.site_code}</Text>
                  </View>
                  {isCurrent && <Text style={styles.check}>✓</Text>}
                </Pressable>
              )
            })}
          </ScrollView>
        )}

        {onCancel && (
          <Pressable onPress={onCancel} style={({ pressed }) => [styles.cancel, pressed && { opacity: 0.7 }]}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

const makeStyles = (colors) => StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.scrim,
    justifyContent: 'center',
    padding: spacing.lg,
    zIndex: 100,
  },
  card: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.lg,
  },
  title: { color: colors.onSurface, fontSize: 24, fontWeight: '700', letterSpacing: -0.4 },
  subtitle: { color: colors.onSurfaceVariant, fontSize: 14, marginTop: 4, marginBottom: spacing.lg },
  state: { paddingVertical: spacing.xl, alignItems: 'center' },
  error: { color: colors.danger, textAlign: 'center', paddingVertical: spacing.xl },
  empty: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl },
  list: { maxHeight: 360 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  rowActive: { borderColor: colors.primary, backgroundColor: colors.surfaceContainerHigh },
  rowPressed: { backgroundColor: colors.surfaceContainerHigh },
  rowName: { color: colors.onSurface, fontSize: 16, fontWeight: '600' },
  rowCode: { color: colors.textMuted, fontSize: 11, marginTop: 2, letterSpacing: 0.5 },
  check: { color: colors.primary, fontSize: 20, fontWeight: '700' },
  cancel: {
    marginTop: spacing.lg,
    alignSelf: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.md,
  },
  cancelText: { color: colors.onSurfaceVariant, fontSize: 14 },
})
