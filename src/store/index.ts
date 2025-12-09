import { configureStore } from '@reduxjs/toolkit';
import transactionsReducer from './transactionsSlice';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    transactions: transactionsReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
