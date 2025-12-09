import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SecondaryButton, PrimaryButton } from '../components/Buttons';
import { FeatureItem } from '../components/FeatureItem';
import { IconBadge } from '../components/IconBadge';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontSizes, fontWeights } from '../theme/typography';

interface BiometricLockScreenProps {
  onSuccess: () => void;
  onSkip?: () => void;
  isSetup?: boolean;
}

const BIOMETRIC_ENABLED_KEY = '@biometric_enabled';

const BiometricLockScreen: React.FC<BiometricLockScreenProps> = ({
  onSuccess,
  onSkip,
  isSetup = false,
}) => {
  const [biometryType, setBiometryType] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  useEffect(() => {
    // Auto-trigger authentication when not in setup mode
    if (!isSetup && biometryType !== null) {
      const timer = setTimeout(() => {
        handleBiometricAuth();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isSetup, biometryType]);

  const checkBiometricAvailability = async () => {
    try {
      const rnBiometrics = new ReactNativeBiometrics({
        allowDeviceCredentials: true,
      });
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      
      setIsAvailable(available);
      
      if (available) {
        switch (biometryType) {
          case BiometryTypes.TouchID:
            setBiometryType('Touch ID');
            break;
          case BiometryTypes.FaceID:
            setBiometryType('Face ID');
            break;
          case BiometryTypes.Biometrics:
            setBiometryType('Biometrics');
            break;
          default:
            setBiometryType('Biometric');
        }
      } else {
        // Even if biometric not available, device credentials (PIN/password) might be available
        setBiometryType('Device PIN/Password');
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setIsAvailable(false);
      setBiometryType('Device PIN/Password');
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const rnBiometrics = new ReactNativeBiometrics({
        allowDeviceCredentials: true,
      });
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: isSetup 
          ? 'Enable security authentication'
          : 'Authenticate to access SmartTracker',
        cancelButtonText: 'Cancel',
        fallbackPromptMessage: 'Use device PIN or password',
      });

      if (success) {
        if (isSetup) {
          await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
        }
        onSuccess();
      } else {
        Alert.alert(
          'Authentication Failed',
          'Authentication was not successful. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert(
        'Error',
        'An error occurred during authentication.',
        [{ text: 'OK' }]
      );
    }
  };

  const getBiometricIcon = () => {
    return 'checklist'; // Using checklist icon for security
  };

  if (!isAvailable && isSetup) {
    // During setup, if no biometrics available, still allow device credentials
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
       

        <View style={styles.content}>
          <IconBadge iconName="checklist" />

          <Text style={styles.title}>Device Security</Text>
          <Text style={styles.description}>
            Biometric authentication is not available, but you can still use your device PIN, pattern, or password to secure the app.
          </Text>
        </View>

        <View style={[styles.buttonContainer, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
          <PrimaryButton label="Enable Security" onPress={handleBiometricAuth} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {isSetup && onSkip && (
        <TouchableOpacity style={styles.skipButtonTop} onPress={onSkip}>
          <Text style={styles.skipButtonText}>Skip for Now</Text>
        </TouchableOpacity>
      )}

      <View style={styles.content}>
        <IconBadge iconName={getBiometricIcon()} />
        
        <Text style={styles.title}>
          {isSetup ? 'Enable Device Security' : 'Unlock SmartTracker'}
        </Text>
        <Text style={styles.description}>
          {isSetup
            ? `Use ${biometryType} or device PIN/password to secure your financial data and quickly access the app.`
            : `Use ${biometryType} or device PIN/password to unlock and access your financial data.`}
        </Text>

        <View style={styles.featureList}>
          <FeatureItem iconName="profit" text="Quick and secure access" />
          <FeatureItem iconName="checklist" text="Protect sensitive data" />
          <FeatureItem iconName="transaction" text="PIN/Password fallback available" />
        </View>
      </View>

      <View style={[styles.buttonContainer, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
        <PrimaryButton
          label={isSetup ? 'Enable Security' : 'Authenticate'}
          onPress={handleBiometricAuth}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
  },
  content: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  skipButtonTop: {
    position: 'absolute',
    top: spacing.xl + spacing.md,
    right: spacing.xl,
    zIndex: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  skipButtonText: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  title: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fontSizes.md,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  featureList: {
    marginBottom: spacing.lg,
  },
  buttonContainer: {
    paddingTop: spacing.md,
  },
});

export default BiometricLockScreen;
export { BIOMETRIC_ENABLED_KEY };
