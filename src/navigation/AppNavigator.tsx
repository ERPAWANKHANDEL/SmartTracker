import React, { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setAuthenticated, setBiometricEnabled, setOnboardingCompleted } from '../store/authSlice';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import PermissionsScreen from '../screens/PermissionsScreen';
import BiometricLockScreen from '../screens/BiometricLockScreen';
import ManualExpenseScreen from '../screens/ManualExpenseScreen';
import { SmsTestScreen } from '../screens/SmsTestScreen';
import { MainTabs } from './MainTabs';

// Auth Stack - For unauthenticated users
type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Permissions: undefined;
  BiometricSetup: undefined;
  BiometricLock: undefined;
};

// Root Stack - For authenticated users
type RootStackParamList = {
  Main: undefined;
  ManualExpense: undefined;
  SmsTest: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const ONBOARDING_COMPLETED_KEY = '@onboarding_completed';
const BIOMETRIC_ENABLED_KEY = '@biometric_enabled';

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
  const dispatch = useDispatch();
  
  const handleComplete = async (enabled: boolean) => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
    dispatch(setOnboardingCompleted(true));
    dispatch(setBiometricEnabled(enabled));
    dispatch(setAuthenticated(true));
  };

  return (
    <BiometricLockScreen
      onSuccess={() => handleComplete(true)}
      onSkip={() => handleComplete(false)}
      isSetup={true}
    />
  );
};

const BiometricLockWrapper = () => {
  const dispatch = useDispatch();
  
  return (
    <BiometricLockScreen
      onSuccess={() => {
        dispatch(setAuthenticated(true));
      }}
      isSetup={false}
    />
  );
};

// Auth Stack Navigator
function AuthStackNavigator() {
  const { onboardingCompleted } = useSelector((state: RootState) => state.auth);

  return (
    <AuthStack.Navigator
      initialRouteName={onboardingCompleted ? 'BiometricLock' : 'Splash'}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <AuthStack.Screen name="Splash" component={SplashScreenWrapper} />
      <AuthStack.Screen name="Onboarding" component={OnboardingScreenWrapper} />
      <AuthStack.Screen name="Permissions" component={PermissionsScreenWrapper} />
      <AuthStack.Screen name="BiometricSetup" component={BiometricSetupWrapper} />
      <AuthStack.Screen name="BiometricLock" component={BiometricLockWrapper} />
    </AuthStack.Navigator>
  );
}

// Root Stack Navigator
function RootStackNavigator() {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <RootStack.Screen name="Main" component={MainTabs} />
      <RootStack.Screen name="ManualExpense" component={ManualExpenseScreen} />
      <RootStack.Screen name="SmsTest" component={SmsTestScreen} />
    </RootStack.Navigator>
  );
}

export function AppNavigator() {
  const dispatch = useDispatch();
  const { isAuthenticated, biometricEnabled, onboardingCompleted } = useSelector(
    (state: RootState) => state.auth
  );
  const [isLoading, setIsLoading] = useState(true);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    loadAuthState();
  }, []);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [onboardingCompleted, isAuthenticated]);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    console.log(`App state changed from ${appState} to ${nextAppState}`);
    // When app comes to foreground from background/inactive
    if (
      appState.match(/inactive|background/) &&
      nextAppState === 'active' &&
      onboardingCompleted &&
      isAuthenticated
    ) {
      // App came to foreground - require authentication (biometric or device credentials)
      console.log('App came to foreground - locking app');
      dispatch(setAuthenticated(false));
    }
    setAppState(nextAppState);
  };

  const loadAuthState = async () => {
    try {
      const onboardingDone = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      const biometricEnabledValue = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);

      dispatch(setOnboardingCompleted(onboardingDone === 'true'));
      dispatch(setBiometricEnabled(biometricEnabledValue === 'true'));
      
      // Always start with isAuthenticated = false if onboarding is complete
      // This ensures lock screen is shown on app start
      if (onboardingDone !== 'true') {
        // Only set authenticated true if onboarding not done (will go through onboarding flow)
        dispatch(setAuthenticated(false));
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <RootStackNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
}
