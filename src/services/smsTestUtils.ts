import { PermissionsAndroid, Platform } from 'react-native';
import { NativeSmsModule } from './NativeSmsModule';
import { ingestSms } from './smsIngestion';

/**
 * Test SMS reading functionality
 * Call this from your component to debug SMS issues
 */
export const testSmsReading = async () => {
  console.log('=== Starting SMS Reading Test ===');
  
  if (Platform.OS !== 'android') {
    console.log('❌ Platform is not Android');
    return;
  }
  
  console.log('✅ Platform: Android');
  
  // Step 1: Check if native module is available
  if (!NativeSmsModule) {
    console.log('❌ NativeSmsModule is not available');
    console.log('   Make sure the app was rebuilt after adding native modules');
    return;
  }
  console.log('✅ NativeSmsModule is available');
  
  // Step 2: Check permissions using Android API
  try {
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_SMS
    );
    console.log(`📱 Android READ_SMS permission: ${granted ? 'GRANTED' : 'DENIED'}`);
    
    if (!granted) {
      console.log('⚠️  Requesting SMS permission...');
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: 'SMS Permission',
          message: 'SmartTracker needs access to read SMS messages for transaction tracking',
          buttonPositive: 'OK',
        }
      );
      console.log(`📱 Permission request result: ${result}`);
      
      if (result !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('❌ SMS permission was denied');
        return;
      }
    }
    console.log('✅ SMS permission granted');
  } catch (err) {
    console.error('❌ Error checking permissions:', err);
    return;
  }
  
  // Step 3: Check native module permission
  try {
    const nativePermission = await NativeSmsModule.hasPermission();
    console.log(`🔧 Native module hasPermission: ${nativePermission}`);
  } catch (err) {
    console.error('❌ Error calling hasPermission:', err);
  }
  
  // Step 4: Try to read SMS
  try {
    console.log('📥 Attempting to read SMS messages...');
    const messages = await NativeSmsModule.getAllSms();
    console.log(`✅ Successfully read ${messages.length} SMS messages`);
    
    if (messages.length > 0) {
      console.log('📄 Sample SMS:', {
        from: messages[0].address,
        body: messages[0].body.substring(0, 50) + '...',
        date: messages[0].date,
      });
    } else {
      console.log('⚠️  No SMS messages found (device may have no SMS)');
    }
  } catch (err) {
    console.error('❌ Error reading SMS:', err);
  }
  
  // Step 5: Try SMS ingestion (with parsing)
  try {
    console.log('🔄 Testing SMS ingestion with parsing...');
    const transactions = await ingestSms();
    console.log(`✅ Found ${transactions.length} financial transactions`);
    
    if (transactions.length > 0) {
      console.log('💰 Sample transaction:', {
        amount: transactions[0].amount,
        type: transactions[0].type,
        bank: transactions[0].bank,
        date: transactions[0].date,
      });
    }
  } catch (err) {
    console.error('❌ Error in SMS ingestion:', err);
  }
  
  console.log('=== SMS Reading Test Complete ===');
};

/**
 * Quick permission check
 */
export const checkSmsPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  
  try {
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_SMS
    );
    return granted;
  } catch (err) {
    console.error('Error checking permission:', err);
    return false;
  }
};

/**
 * Request SMS permission
 */
export const requestSmsPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  
  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: 'SMS Permission Required',
        message: 'SmartTracker needs access to read SMS messages to track your transactions automatically',
        buttonPositive: 'Grant',
        buttonNegative: 'Deny',
      }
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.error('Error requesting permission:', err);
    return false;
  }
};
