import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface WalletState {
  address: string | null;
  isConnected: boolean;
}

const initialState: WalletState = {
  address: null,
  isConnected: false,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setAddress: (state, action: PayloadAction<string | null>) => {
      state.address = action.payload;
      state.isConnected = !!action.payload;
    },
    disconnect: (state) => {
      state.address = null;
      state.isConnected = false;
    },
  },
});

export const { setAddress, disconnect } = walletSlice.actions;
export default walletSlice.reducer;
