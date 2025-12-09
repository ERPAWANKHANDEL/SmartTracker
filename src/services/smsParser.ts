export type TransactionType = 'debit' | 'credit';

export interface RawSms {
  body: string;
  sender?: string;
  timestamp?: number;
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
  'AXISBK', 'HDFCBK', 'ICICIB', 'SBIINB', 'SBIUPI', 'KOTAKB', 'KOTAKA',
  'PNBSMS', 'BOISMS', 'YESBK', 'IDFCFB', 'INDUSB', 'CITIBK', 'SCBANK',
  'HSBC', 'DEUTSC', 'RBLBNK', 'AUBANK', 'FEDBK', 'KRVYBNK', 'TMBBK',
  'CENTBK', 'AX-', 'AD-', 'CP-', 'JD-', 'JK-', 'JM-', 'JX-', 'VK-',
  'VM-', 'VD-', 'BP-', 'BH-', 'BT-', 'BV-', 'BZ-', 'TM-', 'VA-',
  'SBI-', 'ICICI-', 'HDFC-', 'KOTAK-', 'PNB-', 'BOB-', 'YES-',
  'IDFC-', 'IND-', 'CAN-', 'UNI-', 'CITI-', 'HSBC-', 'RBL-', 'AU-'
];

const BANK_NAMES = [
  'AXIS', 'HDFC', 'ICICI', 'SBI', 'KOTAK', 'PNB', 'BOB', 'YES',
  'IDFC', 'INDUS', 'CANARA', 'UNION', 'CITI', 'STANDARD CHARTERED',
  'HSBC', 'DEUTSCHE', 'RBL', 'AU BANK', 'FEDERAL', 'KARVY', 'TMB',
  'BARODA', 'INDIAN BANK', 'MAHINDRA', 'IOB', 'UCO', 'BANDHAN'
];

// Enhanced amount regex for various formats
const AMOUNT_REGEX = /(?:(?:INR|Rs\.?|RS\.?|₹)\s*)?([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)\s*(?:lakh|lac|lk|cr|k|thousand)?/gi;

// Enhanced transaction type detection
const DEBIT_HINTS = /(?:debited|spent|purchase|withdrawn|payment|paid|dr\s|debit|atm\s*wd|transferred|sent|emi|bill|charged|wd\s|withdraw|auto\s*pay|(?:a\/c|account)\s*(?:xx|xx\*\*|no\.?)\d+.*debited|dr.*a\/c|purchased|txn.*debit)/i;
const CREDIT_HINTS = /(?:credited|received|deposit|refund|refunded|salary|cr\s|credit|cashback|interest|dividend|deposited|received.*from|a\/c.*credited)/i;

// Date patterns for various formats
const DATE_REGEXES = [
  /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
  /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
  /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
  /(\d{2})\/(\d{2})\/(\d{2})/, // DD/MM/YY
  /(\d{1,2})-(\w{3})-(\d{4})/, // DD-MMM-YYYY
  /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i, // DD Month YYYY
];

// Exclusion patterns
const NON_TRANSACTION_KEYWORDS = [
  /otp|verification code|one time password|login otp|password|reset|authenticate/i,
  /data.*usage|quota|validity.*expir|pack.*expir|balance.*low|plan.*expir|your.*plan/i,
  /missed call|called|available to take calls|call you/i,
  /welcome|activate|registration|generated|set up|linked|login alert/i,
  /survey|feedback|offer|sale|coupon|discount|flat.*off/i,
  /alert!.*your.*expiring|alert.*your.*pack|alert.*unlimited.*pack/i,
  /thank you for banking|thank you for choosing|thank you for shopping/i,
  /cyber security|safety tips|security alert|fraudulent call/i,
  /mandate.*set|autopay.*set|recurring.*payment|subscription/i,
  /your cibil|credit score|credit report/i,
  /activate.*card|debit card.*pin|card.*enabled|upi pin|upi.*set/i,
  /recharge.*plan|recharge.*with.*rs|recharge now|special offer.*recharge/i,
  /download.*app|click.*to.*download|install.*app/i,
  /aadhaar.*used|aadhaar.*authentication/i,
  /welcome kit|application.*received|application.*processed/i,
  /black friday|special preview sale|flat.*off.*all garments/i,
  /apollo.*baby|baby carnival|everything your baby/i,
  /flash.*sms|screen.*sms|promotional.*calls|prmotional.*messages/i,
  /free.*bill|mufat.*bill|click.*https/i,
  /dosthadda|dosthaddda/i,
  /your gstr|gst.*return|gst.*filed|gst.*period/i,
  /msme.*udyam.*registration/i,
  /axis bank.*family|welcome to.*axis bank/i,
  /jio.*number.*plan|jio.*recharge|jio.*plan.*benefits/i,
  /vi.*pack|vi.*unlimited|vi.*data.*pack/i,
  /linkedin.*invitation|invited you to connect/i,
  /प्लान.*समाप्त|रिचार्ज.*करें|डेटा.*उपयोग|डेटा.*कोटा/i,
  /प्रमोशनल.*कॉल्स|मुफ्त.*बिल|फ्लैट.*ऑफ/i,
  /अलर्ट!.*आपके.*प्लान|आपके.*जिओ.*नंबर.*प्लान/i,
  /सूचना!.*दैनिक.*डेटा|डेटा.*उपयोग.*अलर्ट/i,
  /कृपया.*ध्यान.*दें!.*दैनिक.*डेटा/i,
];

// Transaction patterns to prioritize
const TRANSACTION_PATTERNS = [
  /(?:INR|Rs\.?|₹)\s*([\d,]+\.?\d*)\s*(?:debited|credited)/i,
  /(?:A\/c|a\/c|account)\s*(?:no\.?|xx\*\*)?\s*[\dXx*]+\s*(?:debited|credited)/i,
  /sent\s*(?:rs\.?|₹)?\s*([\d,]+\.?\d*)\s*from/i,
  /received\s*(?:rs\.?|₹)?\s*([\d,]+\.?\d*)/i,
  /spent\s*(?:rs\.?|₹)?\s*([\d,]+\.?\d*)\s*on.*card/i,
  /(?:credit|debit)\s*card.*\d{4}.*(?:rs\.?|₹)?\s*([\d,]+\.?\d*)/i,
  /(?:upi|p2a|p2m|p2p).*\d+.*(?:rs\.?|₹)?\s*([\d,]+\.?\d*)/i,
];

const normalizeAmount = (value: string): number | null => {
  // Remove commas and any non-numeric characters except decimal point
  const cleaned = value.replace(/,/g, '').replace(/[^\d.]/g, '').trim();
  
  // Handle lakh/crore notations
  if (value.toLowerCase().includes('lakh') || value.toLowerCase().includes('lac')) {
    const num = parseFloat(cleaned) * 100000;
    return Number.isFinite(num) ? num : null;
  }
  if (value.toLowerCase().includes('cr')) {
    const num = parseFloat(cleaned) * 10000000;
    return Number.isFinite(num) ? num : null;
  }
  if (value.toLowerCase().includes('k') || value.toLowerCase().includes('thousand')) {
    const num = parseFloat(cleaned) * 1000;
    return Number.isFinite(num) ? num : null;
  }
  
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseDate = (body: string, fallbackTs?: number): string => {
  for (const regex of DATE_REGEXES) {
    const match = body.match(regex);
    if (match) {
      if (regex.source.includes('\\w{3}') || regex.source.includes('(Jan|Feb')) {
        // Handle DD-MMM-YYYY or DD Month YYYY format
        const months: { [key: string]: string } = {
          'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
          'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
          'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
        };
        const month = months[match[2].toLowerCase().substring(0, 3)];
        const day = match[1].padStart(2, '0');
        const year = match[3].length === 2 ? `20${match[3]}` : match[3];
        return `${year}-${month}-${day}`;
      } else if (match[1] && match[1].length === 4) {
        // YYYY-MM-DD format
        return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      } else {
        // DD-MM-YYYY or DD/MM/YYYY format
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        const year = match[3].length === 2 ? `20${match[3]}` : match[3];
        return `${year}-${month}-${day}`;
      }
    }
  }
  
  // Fallback to timestamp
  const date = fallbackTs ? new Date(fallbackTs) : new Date();
  return date.toISOString().slice(0, 10);
};

const detectType = (body: string): TransactionType | null => {
  // Prioritize debit/credit keywords
  if (DEBIT_HINTS.test(body)) return 'debit';
  if (CREDIT_HINTS.test(body)) return 'credit';
  
  // Check for transaction patterns
  if (body.toLowerCase().includes('sent') && body.toLowerCase().includes('from')) return 'debit';
  if (body.toLowerCase().includes('received') && body.toLowerCase().includes('from')) return 'credit';
  
  // Check for UPI patterns
  if (body.includes('UPI/P2A') || body.includes('UPI/P2M')) {
    if (body.toLowerCase().includes('debited')) return 'debit';
    if (body.toLowerCase().includes('credited')) return 'credit';
  }
  
  return null;
};

const detectBank = (sender?: string, body?: string): string => {
  if (sender) {
    const upperSender = sender.toUpperCase();
    for (const prefix of BANK_SENDER_PREFIXES) {
      if (upperSender.startsWith(prefix)) {
        // Extract bank name from prefix
        if (prefix.includes('AXIS') || upperSender.includes('AXIS')) return 'Axis Bank';
        if (prefix.includes('HDFC') || upperSender.includes('HDFC')) return 'HDFC Bank';
        if (prefix.includes('ICICI')) return 'ICICI Bank';
        if (prefix.includes('SBI')) return 'State Bank of India';
        if (prefix.includes('KOTAK')) return 'Kotak Mahindra Bank';
        if (prefix.includes('PNB')) return 'Punjab National Bank';
        if (prefix.includes('BOB') || upperSender.includes('BOISMS')) return 'Bank of Baroda';
        if (prefix.includes('YES')) return 'Yes Bank';
        if (prefix.includes('IDFC')) return 'IDFC First Bank';
        if (prefix.includes('CENT')) return 'Central Bank';
        if (prefix.includes('CAN')) return 'Canara Bank';
        return prefix.replace('-', '');
      }
    }
  }
  
  if (body) {
    const upperBody = body.toUpperCase();
    for (const bankName of BANK_NAMES) {
      if (upperBody.includes(bankName)) {
        return bankName + (bankName.includes('BANK') ? '' : ' Bank');
      }
    }
  }
  
  return 'Unknown Bank';
};

const extractDescription = (body: string): string => {
  // Try to extract merchant/recipient name
  const upiPattern = /UPI\/(?:P2M|P2A|P2P)\/\d+\/([A-Za-z0-9\s\-\.\*&]+)/i;
  const toFromPattern = /(?:to|from|at|for|by|via|towards)\s+([A-Z][A-Za-z0-9\s\-\.\*&,]{2,50})(?:\s+(?:on|at|date|ref|txn|upi|a\/c|account|card)|$)/i;
  const merchantPattern = /at\s+([A-Z][A-Za-z0-9\s\-\.&]{2,40})(?:\s+on|\s+date|\s+ref|\s+upi|$)/i;
  
  // Try UPI pattern first
  const upiMatch = body.match(upiPattern);
  if (upiMatch && upiMatch[1]) {
    return upiMatch[1].trim();
  }
  
  // Try merchant pattern
  const merchantMatch = body.match(merchantPattern);
  if (merchantMatch && merchantMatch[1]) {
    return merchantMatch[1].trim();
  }
  
  // Try to/from pattern
  const toFromMatch = body.match(toFromPattern);
  if (toFromMatch && toFromMatch[1]) {
    return toFromMatch[1].trim();
  }
  
  // Extract from transaction description
  const lines = body.split('\n');
  for (const line of lines) {
    if (line.includes('UPI') || line.includes('A/c') || line.includes('account')) {
      const cleanLine = line
        .replace(/INR|Rs\.?|₹|debited|credited|sent|received|spent|from|to|on|at|date|ref:|txn|upi|a\/c|account|card|not you\?.*/gi, '')
        .trim();
      if (cleanLine.length > 3) {
        return cleanLine.slice(0, 60);
      }
    }
  }
  
  // Fallback: use first meaningful line
  for (const line of lines) {
    if (line.trim().length > 10 && !line.includes('OTP') && !line.includes('Alert')) {
      const cleanLine = line
        .replace(/INR|Rs\.?|₹|debited|credited|sent|received|spent/gi, '')
        .trim();
      if (cleanLine.length > 3) {
        return cleanLine.slice(0, 50);
      }
    }
  }
  
  return 'Transaction';
};

const isTransactionMessage = (body: string): boolean => {
  // Check if it's a non-transaction message
  for (const pattern of NON_TRANSACTION_KEYWORDS) {
    if (pattern.test(body)) {
      return false;
    }
  }
  
  // Check if it contains transaction patterns
  for (const pattern of TRANSACTION_PATTERNS) {
    if (pattern.test(body)) {
      return true;
    }
  }
  
  // Check for amount and transaction keywords
  const hasAmount = AMOUNT_REGEX.test(body);
  const hasType = detectType(body) !== null;
  
  return hasAmount && hasType;
};

const extractAmount = (body: string): number | null => {
  // Reset regex state
  AMOUNT_REGEX.lastIndex = 0;
  
  // Try transaction patterns first
  for (const pattern of TRANSACTION_PATTERNS) {
    const match = body.match(pattern);
    if (match && match[1]) {
      const amount = normalizeAmount(match[1]);
      if (amount && amount >= 1) return amount;
    }
  }
  
  // Try general amount extraction
  const amountMatches = Array.from(body.matchAll(AMOUNT_REGEX));
  
  // Look for amounts in context of transaction
  for (const match of amountMatches) {
    const amountStr = match[0];
    const amount = normalizeAmount(amountStr);
    
    // Validate amount is reasonable
    if (amount && amount >= 1 && amount <= 100000000) { // 10 crore upper limit
      // Check if amount appears near transaction keywords
      const start = Math.max(0, match.index - 50);
      const end = Math.min(body.length, match.index + amountStr.length + 50);
      const context = body.substring(start, end).toLowerCase();
      
      if (context.includes('debited') || context.includes('credited') || 
          context.includes('sent') || context.includes('received') ||
          context.includes('spent') || context.includes('purchase') ||
          context.includes('payment') || context.includes('deposit')) {
        return amount;
      }
    }
  }
  
  return null;
};

export const parseTransactionSms = (sms: RawSms): ParsedTransaction | null => {
  const body = sms.body || '';
  const sender = sms.sender || '';
  
  // Quick filter for obvious non-transactions
  if (!isTransactionMessage(body)) {
    return null;
  }
  
  const amount = extractAmount(body);
  if (!amount) return null;
  
  const type = detectType(body);
  if (!type) return null;
  
  const bank = detectBank(sender, body);
  const date = parseDate(body, sms.timestamp);
  const description = extractDescription(body);
  
  // Validate the transaction
  if (amount < 1) return null;
  
  return {
    amount,
    type,
    bank,
    date,
    description,
    sender,
    raw: sms,
  };
};

export const filterFinanceSms = (messages: RawSms[]): ParsedTransaction[] => {
  const seen = new Set<string>();
  const transactions: ParsedTransaction[] = [];
  
  for (const message of messages) {
    try {
      const transaction = parseTransactionSms(message);
      if (transaction) {
        // Create a unique key to avoid duplicates
        const key = `${transaction.date}-${transaction.amount.toFixed(2)}-${transaction.type}-${transaction.description.substring(0, 20)}`;
        
        if (!seen.has(key)) {
          seen.add(key);
          transactions.push(transaction);
        }
      }
    } catch (error) {
      console.warn('Error parsing SMS:', error);
      // Continue with other messages
    }
  }
  
  // Sort by date (newest first)
  return transactions.sort((a, b) => {
    if (a.date > b.date) return -1;
    if (a.date < b.date) return 1;
    return 0;
  });
};

// Example usage with your data
const parseAndDisplay = () => {
  const parsed = filterFinanceSms(smsData as RawSms[]);
  console.log('Total transactions found:', parsed.length);
  console.log('\nTransactions:');
  parsed.forEach((t, i) => {
    console.log(`${i + 1}. ${t.date} ${t.type.toUpperCase()} ${t.amount} ${t.bank} - ${t.description}`);
  });
  return parsed;
};

// Uncomment to run
// parseAndDisplay();