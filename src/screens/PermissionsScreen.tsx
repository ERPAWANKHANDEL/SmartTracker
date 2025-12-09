import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { SecondaryButton, PrimaryButton } from '../components/Buttons';
import { FeatureItem } from '../components/FeatureItem';
import { IconBadge } from '../components/IconBadge';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontSizes, fontWeights } from '../theme/typography';
import { ingestSms } from '../services/smsIngestion';
import { useAppDispatch } from '../store/hooks';
import { setSmsTransactions } from '../store/transactionsSlice';

interface PermissionsScreenProps {
  onComplete: () => void;
}

const PermissionsScreen: React.FC<PermissionsScreenProps> = ({ onComplete }) => {
  const [isLoadingSms, setIsLoadingSms] = useState(false);
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  const requestSmsPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const result = await check(PERMISSIONS.ANDROID.READ_SMS);
        
        if (result === RESULTS.GRANTED) {
          return true;
        }

        const requestResult = await request(PERMISSIONS.ANDROID.READ_SMS);
        
        if (requestResult === RESULTS.GRANTED) {
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

  const autoReadSms = async () => {
    setIsLoadingSms(true);
    try {
      console.log('Auto-reading SMS after permission grant...');
      const transactions = await ingestSms();
      console.log(`Loaded ${transactions.length} transactions automatically`);
      
      // Dispatch to Redux store
      dispatch(setSmsTransactions(transactions));
    } catch (error) {
      console.error('Failed to auto-read SMS:', error);
    } finally {
      setIsLoadingSms(false);
    }
  };

  const handleContinue = async () => {
    const granted = await requestSmsPermission();
    
    if (granted) {
      // Automatically read SMS after permission is granted
      await autoReadSms();
    }
    
    // Move to next screen regardless of permission status
    onComplete();
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <TouchableOpacity style={styles.skipButtonTop} onPress={handleSkip}>
        <Text style={styles.skipButtonText}>Skip for Now</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <IconBadge iconName="transaction" />

        <Text style={styles.title}>SMS Permission</Text>
        <Text style={styles.description}>
          SmartTracker needs access to read SMS to automatically track your bank transaction messages.
        </Text>

        <View style={styles.featureList}>
          <FeatureItem iconName="transaction" text="Automatically track bank transactions" />
          <FeatureItem iconName="checklist" text="SMS data stays on your device" />
          <FeatureItem iconName="profit" text="No manual entry required" />
        </View>

        <Text style={styles.note}>
          Note: We only read transaction-related SMS from banks. Your personal messages are never accessed.
        </Text>
      </View>

      <View style={[styles.buttonContainer, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
        <PrimaryButton 
          label={isLoadingSms ? "Loading SMS..." : "Allow SMS Access"} 
          onPress={handleContinue}
          disabled={isLoadingSms}
        />
        {isLoadingSms && (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: spacing.sm }} />
        )}
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
    paddingTop: spacing.md,
  },
});

export default PermissionsScreen;
