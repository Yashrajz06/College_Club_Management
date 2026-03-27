import { PeraWalletConnect } from "@perawallet/connect";
import { store } from "../store";
import { setAddress } from "../store/walletSlice";

const network = (import.meta.env.VITE_ALGORAND_NETWORK || 'testnet').toLowerCase();
const chainId = network === 'testnet' ? 416002 : 4160;

export const peraWallet = new PeraWalletConnect({
  chainId,
});

export const connectPeraWallet = async () => {
  try {
    const newAccounts = await peraWallet.connect();
    
    // Setup the disconnect listener
    peraWallet.connector?.on("disconnect", () => {
      store.dispatch(setAddress(null));
    });

    const address = newAccounts[0];
    store.dispatch(setAddress(address));
    return address;
  } catch (error) {
    if (
      error instanceof Error &&
      error.toString() !== "Error: Connection cancelled"
    ) {
      console.error(error);
    }
  }
};

export const reconnectPeraWallet = async () => {
  try {
    const accounts = await peraWallet.reconnectSession();
    
    if (accounts.length > 0) {
      store.dispatch(setAddress(accounts[0]));
      
      peraWallet.connector?.on("disconnect", () => {
        store.dispatch(setAddress(null));
      });
    }
  } catch (error) {
    console.error(error);
  }
};

export const disconnectPeraWallet = async () => {
  await peraWallet.disconnect();
  store.dispatch(setAddress(null));
};
