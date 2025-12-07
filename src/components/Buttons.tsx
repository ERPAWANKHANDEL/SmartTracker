import React from 'react';
import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontSizes, fontWeights } from '../theme/typography';

interface ButtonProps {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export const PrimaryButton: React.FC<ButtonProps> = ({ label, onPress, style, disabled }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.primary, style, disabled && styles.disabled]}
    disabled={disabled}
    activeOpacity={0.9}
  >
    <Text style={styles.primaryLabel}>{label}</Text>
  </TouchableOpacity>
);

export const SecondaryButton: React.FC<ButtonProps> = ({ label, onPress, style, disabled }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.secondary, style, disabled && styles.disabledSecondary]}
    disabled={disabled}
    activeOpacity={0.8}
  >
    <Text style={styles.secondaryLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryLabel: {
    color: colors.surface,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
  },
  secondary: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryLabel: {
    color: colors.textTertiary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
  },
  disabled: {
    opacity: 0.6,
  },
  disabledSecondary: {
    opacity: 0.6,
  },
});
