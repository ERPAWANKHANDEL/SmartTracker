import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  biometricEnabled: boolean;
  onboardingCompleted: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  biometricEnabled: false,
  onboardingCompleted: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
    setBiometricEnabled: (state, action: PayloadAction<boolean>) => {
      state.biometricEnabled = action.payload;
    },
    setOnboardingCompleted: (state, action: PayloadAction<boolean>) => {
      state.onboardingCompleted = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
    },
  },
});

export const {
  setAuthenticated,
  setBiometricEnabled,
  setOnboardingCompleted,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
