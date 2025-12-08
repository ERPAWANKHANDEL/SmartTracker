import { RawSms, SmsReader } from './smsParser';
import { Platform } from 'react-native';
import { NativeSmsModule, NativeSmsReceiverModule, addSmsListener } from './NativeSmsModule';

// SMS Reader for Android using native module
export const smsAndroidReader: SmsReader = {
  fetchAll: async () => {
    if (Platform.OS !== 'android') {
      console.warn('SMS reading is only supported on Android');
      return [];
    }

    if (!NativeSmsModule) {
      console.error('NativeSmsModule is not available. Make sure the native module is properly linked.');
      return [];
    }

    try {
      console.log('Checking SMS permissions...');
      
      // Check permission first
      const hasPermission = await NativeSmsModule.hasPermission();
      console.log('Has SMS permission:', hasPermission);
      
      if (!hasPermission) {
        console.warn('SMS read permission not granted');
        return [];
      }

      // Get all SMS messages from native module
      console.log('Fetching SMS messages...');
      const messages = await NativeSmsModule.getAllSms();
      console.log(`Fetched ${messages.length} SMS messages`);
      
      const rawSmsList: RawSms[] = messages.map((msg: any) => ({
        body: msg.body || '',
        sender: msg.address || '',
        timestamp: parseInt(msg.date, 10) || Date.now(),
      }));
      
      console.log(`Processed ${rawSmsList.length} SMS messages`);
      return rawSmsList;
    } catch (error) {
      console.error('Failed to fetch SMS messages:', error);
      return [];
    }
  },
};

// Start listening to incoming SMS events
export const startSmsListener = (callback: (sms: RawSms) => void) => {
  if (Platform.OS !== 'android') {
    console.warn('SMS listening is only supported on Android');
    return () => {};
  }

  try {
    // Start the native listener
    NativeSmsReceiverModule.startListening();

    // Add event listener for incoming SMS
    const unsubscribe = addSmsListener((message: any) => {
      const rawSms: RawSms = {
        body: message.body || '',
        sender: message.address || '',
        timestamp: message.date || Date.now(),
      };
      callback(rawSms);
    });

    return () => {
      unsubscribe();
      NativeSmsReceiverModule.stopListening();
    };
  } catch (error) {
    console.warn('Failed to start SMS listener:', error);
    return () => {};
  }
};
