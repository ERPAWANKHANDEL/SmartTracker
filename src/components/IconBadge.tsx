import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Icon } from './Icon';
import { colors } from '../theme/colors';

interface IconBadgeProps {
  iconName: keyof typeof import('./Icon')['iconSources'] | string;
  useEmoji?: boolean;
  size?: number;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
}

export const IconBadge: React.FC<IconBadgeProps> = ({
  iconName,
  useEmoji = false,
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
    {useEmoji ? (
      <Text style={[styles.icon, { fontSize: size * 0.53 }]}>{iconName}</Text>
    ) : (
      <Icon 
        name={iconName as any} 
        size={size * 0.53} 
        tintColor={colors.primary}
      />
    )}
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
