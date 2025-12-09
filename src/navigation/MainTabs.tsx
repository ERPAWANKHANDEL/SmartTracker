import React from 'react';
import { Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';
import { fontSizes } from '../theme/typography';

const Tab = createBottomTabNavigator();

export const MainTabs = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 56 + insets.bottom,
          paddingBottom: Platform.OS === 'android' ? insets.bottom : 0,
          paddingTop: 0,
        },
        tabBarLabelStyle: {
          fontSize: fontSizes.sm,
          fontWeight: '600',
          marginTop: -4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="dashboard" size={size} tintColor={color} />
          ),
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="History"
        component={TransactionHistoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="history" size={size} tintColor={color} />
          ),
          tabBarLabel: 'History',
        }}
      />
    </Tab.Navigator>
  );
};
