import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ParsedTransaction } from '../services/smsParser';

export interface ManualTransaction {
  id: string;
  category: string;
  amount: number;
  date: string;
  notes: string;
  type: 'debit' | 'credit';
}

interface TransactionsState {
  smsTransactions: ParsedTransaction[];
  manualTransactions: ManualTransaction[];
}

const initialState: TransactionsState = {
  smsTransactions: [],
  manualTransactions: [],
};

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    // SMS Transactions
    setSmsTransactions: (state, action: PayloadAction<ParsedTransaction[]>) => {
      state.smsTransactions = action.payload;
    },
    addSmsTransaction: (state, action: PayloadAction<ParsedTransaction>) => {
      state.smsTransactions.push(action.payload);
    },
    deleteSmsTransaction: (state, action: PayloadAction<{ date: string; amount: number }>) => {
      state.smsTransactions = state.smsTransactions.filter(
        t => !(t.date === action.payload.date && t.amount === action.payload.amount)
      );
    },
    clearSmsTransactions: (state) => {
      state.smsTransactions = [];
    },

    // Manual Transactions
    setManualTransactions: (state, action: PayloadAction<ManualTransaction[]>) => {
      state.manualTransactions = action.payload;
    },
    addManualTransaction: (state, action: PayloadAction<ManualTransaction>) => {
      state.manualTransactions.push(action.payload);
    },
    updateManualTransaction: (state, action: PayloadAction<ManualTransaction>) => {
      const index = state.manualTransactions.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.manualTransactions[index] = action.payload;
      }
    },
    deleteManualTransaction: (state, action: PayloadAction<string>) => {
      state.manualTransactions = state.manualTransactions.filter(t => t.id !== action.payload);
    },
    clearManualTransactions: (state) => {
      state.manualTransactions = [];
    },
  },
});

export const {
  setSmsTransactions,
  addSmsTransaction,
  deleteSmsTransaction,
  clearSmsTransactions,
  setManualTransactions,
  addManualTransaction,
  updateManualTransaction,
  deleteManualTransaction,
  clearManualTransactions,
} = transactionsSlice.actions;

export default transactionsSlice.reducer;
