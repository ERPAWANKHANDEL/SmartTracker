import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

/**
 * Check if SMS permissions are granted
 */
export const checkSmsPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    const readSmsPermission = await check(PERMISSIONS.ANDROID.READ_SMS);
    const receiveSmsPermission = await check(PERMISSIONS.ANDROID.RECEIVE_SMS);
    
    return (
      readSmsPermission === RESULTS.GRANTED &&
      receiveSmsPermission === RESULTS.GRANTED
    );
  } catch (error) {
    console.warn('Error checking SMS permissions:', error);
    return false;
  }
};

/**
 * Request SMS permissions from the user
 */
export const requestSmsPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    // Request both READ_SMS and RECEIVE_SMS permissions
    const readSmsResult = await request(PERMISSIONS.ANDROID.READ_SMS);
    const receiveSmsResult = await request(PERMISSIONS.ANDROID.RECEIVE_SMS);

    const granted = 
      readSmsResult === RESULTS.GRANTED &&
      receiveSmsResult === RESULTS.GRANTED;

    if (!granted) {
      Alert.alert(
        'SMS Permissions Required',
        'SmartTracker needs SMS permissions to automatically track your transactions. Please grant permissions in Settings.',
        [{ text: 'OK' }]
      );
    }

    return granted;
  } catch (error) {
    console.warn('Error requesting SMS permissions:', error);
    return false;
  }
};

/**
 * Request SMS permissions using native Android method (fallback)
 */
export const requestSmsPermissionsNative = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    ]);

    return (
      granted['android.permission.READ_SMS'] === PermissionsAndroid.RESULTS.GRANTED &&
      granted['android.permission.RECEIVE_SMS'] === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch (error) {
    console.warn('Error requesting SMS permissions (native):', error);
    return false;
  }
};

/**
 * Open app settings to allow user to manually grant permissions
 */
export const openAppSettings = async (): Promise<void> => {
  try {
    const { openSettings } = await import('react-native-permissions');
    await openSettings();
  } catch (error) {
    console.warn('Error opening app settings:', error);
  }
};
