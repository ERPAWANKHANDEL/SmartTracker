import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { spacing } from '../theme/spacing';
import { colors } from '../theme/colors';
import { fontSizes, fontWeights } from '../theme/typography';

interface FeatureItemProps {
  iconName?: keyof typeof import('./Icon')['iconSources'];
  emoji?: string;
  text: string;
}

export const FeatureItem: React.FC<FeatureItemProps> = ({ iconName, emoji, text }) => (
  <View style={styles.row}>
    {iconName ? (
      <View style={styles.iconContainer}>
        <Icon name={iconName} size={20} tintColor={colors.primary} />
      </View>
    ) : emoji ? (
      <Text style={styles.emoji}>{emoji}</Text>
    ) : null}
    <Text style={styles.text}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.mutedBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  emoji: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  text: {
    flex: 1,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    fontWeight: fontWeights.regular,
  },
});
