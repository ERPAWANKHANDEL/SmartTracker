import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

interface SmsMessage {
  address: string;
  body: string;
  date: string;
  type: number;
}

interface SmsModuleInterface {
  getAllSms(): Promise<SmsMessage[]>;
  hasPermission(): Promise<boolean>;
}

interface SmsReceiverModuleInterface {
  startListening(): Promise<boolean>;
  stopListening(): Promise<boolean>;
  isListening(): Promise<boolean>;
}

const { SmsModule, SmsReceiverModule } = NativeModules;

// Log module availability
console.log('SmsModule available:', !!SmsModule);
console.log('SmsReceiverModule available:', !!SmsReceiverModule);

if (!SmsModule && Platform.OS === 'android') {
  console.error('SmsModule not found! Make sure native modules are properly registered in MainApplication.kt');
}

export const NativeSmsModule: SmsModuleInterface = SmsModule || {
  getAllSms: async () => {
    console.error('SmsModule not available');
    return [];
  },
  hasPermission: async () => {
    console.error('SmsModule not available');
    return false;
  },
};

export const NativeSmsReceiverModule: SmsReceiverModuleInterface = SmsReceiverModule || {
  startListening: async () => {
    console.error('SmsReceiverModule not available');
    return false;
  },
  stopListening: async () => {
    console.error('SmsReceiverModule not available');
    return false;
  },
  isListening: async () => {
    console.error('SmsReceiverModule not available');
    return false;
  },
};

// Event emitter for SMS received events
let smsEventEmitter: NativeEventEmitter | null = null;

if (Platform.OS === 'android' && SmsReceiverModule) {
  smsEventEmitter = new NativeEventEmitter(SmsReceiverModule);
}

export const addSmsListener = (callback: (sms: { address: string; body: string; date: number }) => void) => {
  if (!smsEventEmitter) {
    console.warn('SMS listener not available on this platform');
    return () => {};
  }

  const subscription = smsEventEmitter.addListener('onSmsReceived', callback);
  return () => subscription.remove();
};

export default {
  ...NativeSmsModule,
  ...NativeSmsReceiverModule,
  addSmsListener,
};
