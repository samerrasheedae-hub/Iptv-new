import { colors, radius, typography } from '@/design/tokens';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';

export function SettingsRow({ icon, title, subtitle }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string }) {
  return (
    <AnimatedPressable style={styles.row}>
      <View style={styles.icon}><Ionicons name={icon} size={21} color={colors.text} /></View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16, marginBottom: 12 },
  icon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft },
  copy: { flex: 1 },
  title: { color: colors.text, fontWeight: '900', fontSize: typography.body },
  subtitle: { color: colors.textMuted, fontWeight: '600', fontSize: typography.caption, marginTop: 3 },
});
