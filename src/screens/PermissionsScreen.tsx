import React from 'react';
import { View, Text, StyleSheet, Platform, Alert } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { SecondaryButton, PrimaryButton } from '../components/Buttons';
import { FeatureItem } from '../components/FeatureItem';
import { IconBadge } from '../components/IconBadge';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontSizes, fontWeights } from '../theme/typography';

interface PermissionsScreenProps {
  onComplete: () => void;
}

const PermissionsScreen: React.FC<PermissionsScreenProps> = ({ onComplete }) => {
  const requestSmsPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const result = await check(PERMISSIONS.ANDROID.READ_SMS);
        
        if (result === RESULTS.GRANTED) {
          return true;
        }

        const requestResult = await request(PERMISSIONS.ANDROID.READ_SMS);
        
        if (requestResult === RESULTS.GRANTED) {
          Alert.alert(
            'Permission Granted',
            'SmartTracker can now read your transaction SMS to track expenses automatically.',
            [{ text: 'OK' }]
          );
          return true;
        } else if (requestResult === RESULTS.DENIED) {
          Alert.alert(
            'Permission Denied',
            'SMS permission is required to automatically track your transactions. You can enable it later in settings.',
            [{ text: 'OK' }]
          );
          return false;
        } else if (requestResult === RESULTS.BLOCKED) {
          Alert.alert(
            'Permission Blocked',
            'SMS permission was blocked. Please enable it manually in app settings.',
            [{ text: 'OK' }]
          );
          return false;
        }
      } catch (error) {
        console.error('Error requesting SMS permission:', error);
        Alert.alert(
          'Error',
          'Failed to request SMS permission. Please try again.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } else {
      Alert.alert(
        'Not Available',
        'SMS reading is not available on iOS. You can manually add transactions.',
        [{ text: 'OK' }]
      );
      return true;
    }
  };

  const handleContinue = async () => {
    const granted = await requestSmsPermission();
    onComplete();
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Permissions',
      'You can enable SMS reading later in settings. You will need to manually add transactions.',
      [
        { text: 'Go Back', style: 'cancel' },
        { text: 'Skip', onPress: onComplete, style: 'destructive' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <IconBadge icon="📨" />

        <Text style={styles.title}>SMS Permission</Text>
        <Text style={styles.description}>
          SmartTracker needs access to read SMS to automatically track your bank transaction messages.
        </Text>

        <View style={styles.featureList}>
          <FeatureItem emoji="✅" text="Automatically track bank transactions" />
          <FeatureItem emoji="🔒" text="SMS data stays on your device" />
          <FeatureItem emoji="⚡" text="No manual entry required" />
        </View>

        <Text style={styles.note}>
          Note: We only read transaction-related SMS from banks. Your personal messages are never accessed.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <SecondaryButton label="Skip for Now" onPress={handleSkip} style={styles.buttonSpacing} />
        <PrimaryButton label="Allow SMS Access" onPress={handleContinue} />
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
  },
  featureList: {
    marginBottom: spacing.lg,
  },
  note: {
    fontSize: fontSizes.sm,
    color: colors.textQuaternary,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
    paddingHorizontal: spacing.lg,
  },
  buttonContainer: {
    marginTop: spacing.md,
  },
  buttonSpacing: {
    marginBottom: spacing.md,
  },
});

export default PermissionsScreen;
