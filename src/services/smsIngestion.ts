import { Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { RawSms, ParsedTransaction, filterFinanceSms } from './smsParser';
import { smsAndroidReader } from './smsAndroidReader';

// NOTE: SMS reading stub for now; SMS transactions will be empty in history.
// TODO: Wire real SMS reader once native module or bridge is integrated.

export interface SmsReader {
  fetchAll(): Promise<RawSms[]>;
}

export const ensureSmsPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return false;
  const permission = PERMISSIONS.ANDROID.READ_SMS;
  const result = await check(permission);
  if (result === RESULTS.GRANTED) return true;
  const req = await request(permission);
  return req === RESULTS.GRANTED;
};

export const ingestSms = async (reader: SmsReader = smsAndroidReader): Promise<ParsedTransaction[]> => {
  const granted = await ensureSmsPermission();
  console.warn(",,,,,sms permission",granted);
  
  if (!granted) return [];
  try {
    const messages = await reader.fetchAll();
    return filterFinanceSms(messages);
  } catch (error) {
    console.warn('SMS ingestion failed:', error);
    return [];
  }
};
