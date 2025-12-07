import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing } from '../theme/spacing';
import { colors } from '../theme/colors';
import { fontSizes, fontWeights } from '../theme/typography';

interface FeatureItemProps {
  emoji: string;
  text: string;
}

export const FeatureItem: React.FC<FeatureItemProps> = ({ emoji, text }) => (
  <View style={styles.row}>
    <Text style={styles.emoji}>{emoji}</Text>
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
