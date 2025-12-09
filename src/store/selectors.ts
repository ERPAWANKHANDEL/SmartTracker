import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './index';

// Base selectors
export const selectSmsTransactions = (state: RootState) => state.transactions.smsTransactions;
export const selectManualTransactions = (state: RootState) => state.transactions.manualTransactions;

// Combined transactions selector
export const selectAllTransactions = createSelector(
  [selectSmsTransactions, selectManualTransactions],
  (smsTransactions, manualTransactions) => {
    const combined = [
      ...smsTransactions.map(t => ({
        id: `sms-${t.date}-${t.amount}`,
        description: t.description,
        amount: t.type === 'credit' ? t.amount : -t.amount,
        date: t.date,
        type: t.type,
        bank: t.bank,
        category: t.type === 'debit' ? 'Expense' : 'Income',
        source: 'sms' as const,
      })),
      ...manualTransactions.map(t => ({
        id: t.id,
        description: t.notes || t.category,
        amount: t.type === 'credit' ? t.amount : -t.amount,
        date: t.date,
        type: t.type,
        bank: '',
        category: t.category,
        source: 'manual' as const,
      })),
    ];
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
);

// Total balance selector
export const selectTotalBalance = createSelector(
  [selectSmsTransactions, selectManualTransactions],
  (smsTransactions, manualTransactions) => {
    let balance = 0;
    
    smsTransactions.forEach(txn => {
      balance += txn.type === 'credit' ? txn.amount : -txn.amount;
    });
    
    manualTransactions.forEach(txn => {
      balance += txn.type === 'credit' ? txn.amount : -txn.amount;
    });
    
    return balance;
  }
);

// Monthly calculations selector
export const selectMonthlyStats = createSelector(
  [selectSmsTransactions, selectManualTransactions],
  (smsTransactions, manualTransactions) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    let expenses = 0;
    let income = 0;
    const categoryMap: { [key: string]: number } = {};

    smsTransactions.forEach(txn => {
      if (txn.date.startsWith(currentMonth)) {
        if (txn.type === 'debit') {
          expenses += txn.amount;
          const category = 'SMS Transactions';
          categoryMap[category] = (categoryMap[category] || 0) + txn.amount;
        } else {
          income += txn.amount;
        }
      }
    });

    manualTransactions.forEach(txn => {
      if (txn.date.startsWith(currentMonth)) {
        if (txn.type === 'debit') {
          expenses += txn.amount;
          categoryMap[txn.category] = (categoryMap[txn.category] || 0) + txn.amount;
        } else {
          income += txn.amount;
        }
      }
    });

    return { expenses, income, categoryMap };
  }
);

// Category spending selector
export const selectCategorySpending = createSelector(
  [selectMonthlyStats],
  (monthlyStats) => {
    const CATEGORY_COLORS = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF'
    ];

    const categoryTotals = Object.entries(monthlyStats.categoryMap).map(([category, total], idx) => ({
      category,
      total,
      percentage: monthlyStats.expenses > 0 ? (total / monthlyStats.expenses) * 100 : 0,
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    }));

    return categoryTotals.sort((a, b) => b.total - a.total).slice(0, 5);
  }
);

// Last 5 transactions selector
export const selectRecentTransactions = createSelector(
  [selectAllTransactions],
  (allTransactions) => allTransactions.slice(0, 5)
);
