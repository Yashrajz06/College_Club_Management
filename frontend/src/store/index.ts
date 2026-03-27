import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import walletReducer from './walletSlice';
import collegeReducer from './collegeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    wallet: walletReducer,
    college: collegeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
