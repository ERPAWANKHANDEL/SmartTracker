import AsyncStorage from '@react-native-async-storage/async-storage';
import { RawSms, ParsedTransaction } from './smsParser';
import { filterFinanceSms } from './smsParser';
import { startSmsListener } from './smsAndroidReader';

const SMS_STORAGE_KEY = '@smarttracker_sms_transactions';

export const storeSmsTransaction = async (transaction: ParsedTransaction): Promise<void> => {
  try {
    const stored = await AsyncStorage.getItem(SMS_STORAGE_KEY);
    const list: ParsedTransaction[] = stored ? JSON.parse(stored) : [];
    list.push(transaction);
    await AsyncStorage.setItem(SMS_STORAGE_KEY, JSON.stringify(list));
  } catch (error) {
    console.warn('Failed to store SMS transaction:', error);
  }
};

export const getStoredSmsTransactions = async (): Promise<ParsedTransaction[]> => {
  try {
    const stored = await AsyncStorage.getItem(SMS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to retrieve SMS transactions:', error);
    return [];
  }
};

export const clearSmsTransactions = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SMS_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear SMS transactions:', error);
  }
};

export const initializeSmsListener = () => {
  const unsubscribe = startSmsListener(async (rawSms: RawSms) => {
    const parsed = filterFinanceSms([rawSms]);
    if (parsed.length > 0) {
      for (const transaction of parsed) {
        await storeSmsTransaction(transaction);
      }
    }
  });

  return unsubscribe;
};
