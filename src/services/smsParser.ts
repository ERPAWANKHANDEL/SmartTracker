export type TransactionType = 'debit' | 'credit';

export interface RawSms {
  body: string;
  sender?: string; // e.g., AXISBK, HDFCBK
  timestamp?: number; // epoch millis
}

export interface ParsedTransaction {
  amount: number;
  type: TransactionType;
  bank: string;
  date: string; // YYYY-MM-DD
  description: string;
  sender?: string;
  raw: RawSms;
}

const BANK_SENDER_PREFIXES = [
  'AXISBK',
  'HDFCBK',
  'ICICIB',
  'SBIINB',
  'KOTAKB',
  'PNBSMS',
  'BOISMS',
  'YESBK',
  'IDFCFB',
  'INDUSB',
  'CITIBK',
  'SCBANK',
  'HSBC',
  'DEUTSC',
  'RBLBNK',
  'AUBANK',
  'FEDBK',
  'KRVYBNK',
  'TMBBK',
  'AXIS',
  'HDFC',
  'ICICI',
  'SBI',
  'KOTAK',
  'PNB',
  'BOB',
  'YESB',
  'IDFC',
  'INDUS',
  'CANBNK',
  'UNIONB',
  'UNBINB',
  'BARODA',
  'INDIAN',
  'MAHBNK',
  'IOBCHN',
  'UCOBK',
  'BANDHN',
  'PAYTM',
  'GOOGLEPAY',
  'PHONEPE',
];

const BANK_NAMES = ['AXIS', 'HDFC', 'ICICI', 'SBI', 'KOTAK', 'PNB', 'BOB', 'YES', 'IDFC', 'INDUS', 'CANARA', 'UNION', 'CITI', 'STANDARD CHARTERED', 'HSBC', 'DEUTSCHE', 'RBL', 'AU BANK', 'FEDERAL', 'KARVY', 'TMB', 'BARODA', 'INDIAN BANK', 'MAHINDRA', 'IOB', 'UCO', 'BANDHAN', 'PAYTM', 'GOOGLE PAY', 'PHONEPE'];

// Enhanced amount regex to handle lakhs, thousands, and various formats
const AMOUNT_REGEX = /(INR|Rs\.?|RS\.?|INR\.|₹)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/gi;
const DEBIT_HINTS = /(debited|spent|purchase|withdrawn|payment|paid|txn\s*debited|dr\b|debit|atm\s*wd|transferred|sent|emi|bill|charged)/i;
const CREDIT_HINTS = /(credited|received|deposit|refund|refunded|salary|received|cr\b|credit|cashback|interest|dividend)/i;
const DATE_REGEX = /(\d{4}[-\/](?:0[1-9]|1[0-2])[-\/](?:0[1-9]|[12]\d|3[01]))|(\b(?:0[1-9]|[12]\d|3[01])[-\/.](?:0[1-9]|1[0-2])[-\/.](?:\d{2,4})\b)/;

// Keywords to filter out recharge transactions
const RECHARGE_KEYWORDS = /(recharge|prepaid|mobile\s*recharge|mobile\s*top[-\s]?up|topup|top\s*up|dth\s*recharge|fastag|toll|airtime)/i;

const normalizeAmount = (value: string): number | null => {
  const cleaned = value.replace(/,/g, '').trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeDate = (input?: string | null, fallbackTs?: number): string => {
  if (input) {
    // If input is DD-MM-YYYY or DD/MM/YY, try to massage
    const parts = input.replace(/[./]/g, '-').split('-');
    if (parts.length === 3) {
      let [a, b, c] = parts;
      // Heuristic: if first part is 4 digits, assume YYYY-MM-DD
      if (a.length === 4) {
        return `${a}-${b.padStart(2, '0')}-${c.padStart(2, '0')}`;
      }
      // Otherwise DD-MM-YYYY or DD-MM-YY
      if (c.length === 2) {
        c = `20${c}`;
      }
      return `${c}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
    }
  }
  const date = fallbackTs ? new Date(fallbackTs) : new Date();
  return date.toISOString().slice(0, 10);
};

const detectType = (body: string): TransactionType | null => {
  if (DEBIT_HINTS.test(body)) return 'debit';
  if (CREDIT_HINTS.test(body)) return 'credit';
  return null;
};

const detectBank = (sender?: string, body?: string): string => {
  if (sender) {
    const match = BANK_SENDER_PREFIXES.find((p) => sender.toUpperCase().startsWith(p));
    if (match) return match;
  }
  if (body) {
    const upper = body.toUpperCase();
    const match = BANK_NAMES.find((name) => upper.includes(name));
    if (match) return match;
  }
  return 'Unknown';
};

const isLikelyBankSender = (sender?: string): boolean => {
  if (!sender) return false;
  const upper = sender.toUpperCase();
  return BANK_SENDER_PREFIXES.some((p) => upper.startsWith(p));
};

export const parseTransactionSms = (sms: RawSms): ParsedTransaction | null => {
  const body = sms.body || '';
  
  // Skip recharge transactions
  if (RECHARGE_KEYWORDS.test(body)) {
    return null;
  }
  
  // Extract all amounts and use the first significant one
  const amountMatches = Array.from(body.matchAll(AMOUNT_REGEX));
  const amount = amountMatches.length > 0 ? normalizeAmount(amountMatches[0][2]) : null;
  
  const type = detectType(body);

  if (!amount || !type) return null; // Not finance or could not parse

  const dateMatch = body.match(DATE_REGEX);
  const dateRaw = dateMatch ? dateMatch[0] : null;
  const bank = detectBank(sms.sender, body);

  // Extract better description: merchant name or transaction type
  let description = body.slice(0, 180);
  const merchantMatch = body.match(/(at|to|from)\s+([A-Z0-9\s]{3,30})/i);
  if (merchantMatch) {
    description = merchantMatch[2].trim();
  }

  return {
    amount,
    type,
    bank,
    date: normalizeDate(dateRaw, sms.timestamp),
    description,
    sender: sms.sender,
    raw: sms,
  };
};

export const filterFinanceSms = (messages: RawSms[]): ParsedTransaction[] => {
  return messages
    .filter((m) => isLikelyBankSender(m.sender) || AMOUNT_REGEX.test(m.body))
    .map((m) => parseTransactionSms(m))
    .filter((t): t is ParsedTransaction => Boolean(t));
};
