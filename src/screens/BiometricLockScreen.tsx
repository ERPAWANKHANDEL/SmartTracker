import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
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

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const rnBiometrics = new ReactNativeBiometrics();
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
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setIsAvailable(false);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const rnBiometrics = new ReactNativeBiometrics();
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: isSetup 
          ? 'Enable biometric authentication'
          : 'Authenticate to access SmartTracker',
        cancelButtonText: 'Cancel',
      });

      if (success) {
        if (isSetup) {
          await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
          Alert.alert(
            'Success',
            'Biometric authentication has been enabled.',
            [{ text: 'OK', onPress: onSuccess }]
          );
        } else {
          onSuccess();
        }
      } else {
        Alert.alert(
          'Authentication Failed',
          'Biometric authentication was not successful. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Alert.alert(
        'Error',
        'An error occurred during biometric authentication.',
        [{ text: 'OK' }]
      );
    }
  };

  const getBiometricIcon = () => {
    if (biometryType === 'Face ID') return '👤';
    if (biometryType === 'Touch ID') return '👆';
    return '🔐';
  };

  if (!isAvailable) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <IconBadge icon="🔒" />

          <Text style={styles.title}>Biometric Lock</Text>
          <Text style={styles.description}>
            Biometric authentication is not available on this device.
          </Text>
        </View>

        <PrimaryButton label="Continue" onPress={onSkip || onSuccess} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <IconBadge icon={getBiometricIcon()} />
        
        <Text style={styles.title}>
          {isSetup ? 'Enable Biometric Lock' : 'Unlock SmartTracker'}
        </Text>
        <Text style={styles.description}>
          {isSetup
            ? `Use ${biometryType} to secure your financial data and quickly access the app.`
            : `Use ${biometryType} to unlock and access your financial data.`}
        </Text>

        <View style={styles.featureList}>
          <FeatureItem emoji="⚡" text="Quick and secure access" />
          <FeatureItem emoji="🔐" text="Protect sensitive data" />
          <FeatureItem emoji="🚀" text="Seamless user experience" />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        {(isSetup || onSkip) && (
          <SecondaryButton
            label={isSetup ? 'Skip for Now' : 'Cancel'}
            onPress={onSkip || onSuccess}
            style={styles.buttonSpacing}
          />
        )}

        <PrimaryButton
          label={isSetup ? `Enable ${biometryType}` : 'Authenticate'}
          onPress={handleBiometricAuth}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  content: {
    flex: 1,
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
    marginTop: spacing.md,
  },
  buttonSpacing: {
    marginBottom: spacing.md,
  },
});

export default BiometricLockScreen;
export { BIOMETRIC_ENABLED_KEY };
