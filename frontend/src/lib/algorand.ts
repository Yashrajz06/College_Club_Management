import algosdk from 'algosdk';
import { API_BASE_URL } from './api';
import { peraWallet } from './pera';

function base64ToBytes(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

function bytesToBase64(value: Uint8Array) {
  return btoa(String.fromCharCode(...value));
}

export interface PreparedWalletTransactionResponse {
  network: 'testnet' | 'localnet';
  explorerBaseUrl: string;
  note: string;
  txns: Array<{
    txn: string;
    message?: string;
  }>;
}

interface LedgerTransactionPayload {
  clubId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  walletAddress: string;
  eventId?: string;
  sponsorId?: string;
}

export async function prepareLedgerWalletTransaction(
  token: string,
  payload: LedgerTransactionPayload,
) {
  const response = await fetch(`${API_BASE_URL}/finance/algorand/prepare`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Failed to prepare Algorand transaction.');
  }

  return (await response.json()) as PreparedWalletTransactionResponse;
}

export async function signPreparedTransactions(
  walletAddress: string,
  prepared: PreparedWalletTransactionResponse,
) {
  const groups = [
    prepared.txns.map((item) => ({
      txn: algosdk.decodeUnsignedTransaction(base64ToBytes(item.txn)),
      signers: [walletAddress],
      message: item.message,
    })),
  ];

  const signed = await peraWallet.signTransaction(groups, walletAddress);
  return signed.map((item) => bytesToBase64(item));
}

export async function submitLedgerWalletTransaction(
  token: string,
  payload: LedgerTransactionPayload & {
    note: string;
    signedTransactions: string[];
  },
) {
  const response = await fetch(`${API_BASE_URL}/finance/algorand/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Failed to submit signed transaction.');
  }

  return response.json();
}
