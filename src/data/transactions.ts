export type TransactionSource = 'manual' | 'sms';

export interface TransactionItem {
  id: string;
  title: string;
  amount: number;
  category: string;
  bank: string;
  date: string; // ISO string
  source: TransactionSource;
  notes?: string;
}

export const sampleTransactions: TransactionItem[] = [
  {
    id: 't1',
    title: 'Coffee at Blue Bottle',
    amount: -320,
    category: 'Food & Dining',
    bank: 'HDFC',
    date: '2025-12-03',
    source: 'manual',
    notes: 'Morning coffee',
  },
  {
    id: 't2',
    title: 'Uber Ride',
    amount: -220,
    category: 'Transport',
    bank: 'ICICI',
    date: '2025-12-02',
    source: 'sms',
  },
  {
    id: 't3',
    title: 'Salary Credit',
    amount: 65000,
    category: 'Income',
    bank: 'HDFC',
    date: '2025-11-30',
    source: 'sms',
  },
  {
    id: 't4',
    title: 'Electricity Bill',
    amount: -1800,
    category: 'Bills & Utilities',
    bank: 'SBI',
    date: '2025-11-28',
    source: 'manual',
  },
  {
    id: 't5',
    title: 'Grocery - BigBazaar',
    amount: -2450,
    category: 'Shopping',
    bank: 'HDFC',
    date: '2025-12-01',
    source: 'sms',
  },
  {
    id: 't6',
    title: 'Flight Booking',
    amount: -12500,
    category: 'Travel',
    bank: 'ICICI',
    date: '2025-10-15',
    source: 'manual',
  },
];
