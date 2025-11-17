/**
 * Zero Connector TypeScript Type Definitions
 */

export interface WalletCreateResponse {
  success: boolean;
  publicKey?: string;
  message?: string;
  error?: string;
  details?: string;
}

export interface AuthenticateResponse {
  success: boolean;
  sessionToken?: string;
  publicKey?: string;
  balance?: Balance;
  message?: string;
  error?: string;
  details?: string;
}

export interface Balance {
  solBalance: number;
  customData?: Record<string, any>;
  lastUpdated?: string;
}

export interface BalanceResponse {
  success: boolean;
  publicKey?: string;
  balance?: Balance;
  message?: string;
  error?: string;
  details?: string;
}

export interface VerifySessionResponse {
  success: boolean;
  authenticated: boolean;
  publicKey?: string;
  error?: string;
}

export interface LogoutResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface Transaction {
  type: string;
  amount?: number;
  signature?: string;
  timestamp: string;
  [key: string]: any;
}

export function createWallet(apiUrl: string, password: string): Promise<WalletCreateResponse>;
export function authenticate(apiUrl: string, publicKey: string, password: string): Promise<AuthenticateResponse>;
export function getBalance(apiUrl: string): Promise<BalanceResponse>;
export function refreshBalance(apiUrl: string): Promise<BalanceResponse>;
export function logout(apiUrl: string): Promise<LogoutResponse>;
export function verifySession(apiUrl: string): Promise<VerifySessionResponse>;
export function formatSolBalance(solBalance: number, decimals?: number): string;
export function shortenPublicKey(publicKey: string, startChars?: number, endChars?: number): string;
export function copyToClipboard(text: string): Promise<boolean>;
export function getSolscanUrl(signature: string, network?: string): string;
export function getSolscanAddressUrl(address: string, network?: string): string;

