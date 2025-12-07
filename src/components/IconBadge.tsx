import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors } from '../theme/colors';

interface IconBadgeProps {
  icon: string;
  size?: number;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
}

export const IconBadge: React.FC<IconBadgeProps> = ({
  icon,
  size = 120,
  backgroundColor = colors.mutedBackground,
  style,
}) => (
  <View
    style={[
      styles.container,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor,
      },
      style,
    ]}
  >
    <Text style={[styles.icon, { fontSize: size * 0.53 }]}>{icon}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  icon: {
    textAlign: 'center',
  },
});
