/**
 * SmartTracker - Track Your Expenses Smartly
 * @format
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { store } from './src/store';

import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import PermissionsScreen from './src/screens/PermissionsScreen';
import BiometricLockScreen from './src/screens/BiometricLockScreen';
import HomeScreen from './src/screens/HomeScreen';
import ManualExpenseScreen from './src/screens/ManualExpenseScreen';
import TransactionHistoryScreen from './src/screens/TransactionHistoryScreen';
import { SmsTestScreen } from './src/screens/SmsTestScreen';

type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Permissions: undefined;
  BiometricSetup: undefined;
  BiometricLock: undefined;
  Home: undefined;
  ManualExpense: undefined;
  TransactionHistory: undefined;
  SmsTest: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const ONBOARDING_COMPLETED_KEY = '@onboarding_completed';
const BIOMETRIC_ENABLED_KEY = '@biometric_enabled';

function App() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const onboardingCompleted = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      const biometricEnabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);

      if (!onboardingCompleted) {
        setInitialRoute('Splash');
      } else if (biometricEnabled === 'true') {
        setInitialRoute('BiometricLock');
      } else {
        setInitialRoute('Home');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setInitialRoute('Splash');
    }
  };

  if (!initialRoute) {
    return null; // Or a loading screen
  }

  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          <NavigationContainer>
          <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={{
              headerShown: false,
              animation: 'fade',
            }}
          >
            <Stack.Screen name="Splash" component={SplashScreenWrapper} />
            <Stack.Screen name="Onboarding" component={OnboardingScreenWrapper} />
            <Stack.Screen name="Permissions" component={PermissionsScreenWrapper} />
            <Stack.Screen name="BiometricSetup" component={BiometricSetupWrapper} />
            <Stack.Screen name="BiometricLock" component={BiometricLockWrapper} />
            <Stack.Screen name="ManualExpense" component={ManualExpenseScreen} />
            <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
            <Stack.Screen name="SmsTest" component={SmsTestScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
    </Provider>
  );
}

// Screen Wrappers with Navigation
const SplashScreenWrapper = ({ navigation }: any) => (
  <SplashScreen onFinish={() => navigation.replace('Onboarding')} />
);

const OnboardingScreenWrapper = ({ navigation }: any) => (
  <OnboardingScreen onComplete={() => navigation.replace('Permissions')} />
);

const PermissionsScreenWrapper = ({ navigation }: any) => (
  <PermissionsScreen onComplete={() => navigation.replace('BiometricSetup')} />
);

const BiometricSetupWrapper = ({ navigation }: any) => {
  const handleComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    navigation.replace('Home');
  };

  return (
    <BiometricLockScreen
      onSuccess={handleComplete}
      onSkip={handleComplete}
      isSetup={true}
    />
  );
};

const BiometricLockWrapper = ({ navigation }: any) => (
  <BiometricLockScreen
    onSuccess={() => navigation.replace('Home')}
    isSetup={false}
  />
);

export default App;
