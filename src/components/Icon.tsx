import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, ViewStyle, ImageStyle } from 'react-native';

// Icon mappings
const iconSources: Record<string, ImageSourcePropType> = {
  dashboard: require('../assests/icons/dashboard.png'),
  checklist: require('../assests/icons/checklist.png'),
  profit: require('../assests/icons/profit.png'),
  filter: require('../assests/icons/filter.png'),
  history: require('../assests/icons/history.png'),
  arrow: require('../assests/icons/arrow.png'),
  transaction: require('../assests/icons/transaction.png'),
};

interface IconProps {
  name: keyof typeof iconSources;
  size?: number;
  style?: ImageStyle;
  tintColor?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 24, style, tintColor }) => {
  const source = iconSources[name];
  
  if (!source) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return (
    <Image
      source={source}
      style={[
        {
          width: size,
          height: size,
          tintColor,
        },
        style,
      ]}
      resizeMode="contain"
    />
  );
};

export const iconNames = Object.keys(iconSources) as Array<keyof typeof iconSources>;
