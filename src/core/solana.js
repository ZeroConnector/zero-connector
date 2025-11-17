import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';
import bs58 from 'bs58';

/**
 * Solana Operations Module
 * Handles Solana blockchain interactions
 */

/**
 * Get Solana RPC connection
 * @param {string} network - Network name (mainnet-beta, devnet, testnet)
 * @param {string} customRpcUrl - Optional custom RPC URL
 * @returns {Connection}
 */
export function getConnection(network = 'mainnet-beta', customRpcUrl = null) {
	const url = customRpcUrl || clusterApiUrl(network);
	return new Connection(url, 'confirmed');
}

/**
 * Get SOL balance for a public key
 * @param {string} publicKey - Public key (base58)
 * @param {string} network - Network name
 * @param {string} customRpcUrl - Optional custom RPC URL
 * @returns {Promise<number>} Balance in SOL
 */
export async function getSolanaBalance(publicKey, network = 'mainnet-beta', customRpcUrl = null) {
	try {
		const connection = getConnection(network, customRpcUrl);
		const pubKey = new PublicKey(publicKey);
		const balance = await connection.getBalance(pubKey);
		return balance / LAMPORTS_PER_SOL;
	} catch (error) {
		console.error('Error fetching Solana balance:', error);
		throw new Error(`Failed to fetch balance: ${error.message}`);
	}
}

/**
 * Generate a new Solana keypair
 * @returns {Object} { publicKey: string, privateKey: string }
 */
export function generateKeypair() {
	const keypair = Keypair.generate();
	return {
		publicKey: keypair.publicKey.toBase58(),
		privateKey: bs58.encode(keypair.secretKey)
	};
}

/**
 * Validate a Solana public key
 * @param {string} publicKey - Public key to validate
 * @returns {boolean} True if valid
 */
export function validateAddress(publicKey) {
	try {
		new PublicKey(publicKey);
		return true;
	} catch (error) {
		return false;
	}
}

/**
 * Convert lamports to SOL
 * @param {number} lamports - Amount in lamports
 * @returns {number} Amount in SOL
 */
export function lamportsToSol(lamports) {
	return lamports / LAMPORTS_PER_SOL;
}

/**
 * Convert SOL to lamports
 * @param {number} sol - Amount in SOL
 * @returns {number} Amount in lamports
 */
export function solToLamports(sol) {
	return Math.floor(sol * LAMPORTS_PER_SOL);
}

/**
 * Get transaction details
 * @param {string} signature - Transaction signature
 * @param {string} network - Network name
 * @param {string} customRpcUrl - Optional custom RPC URL
 * @returns {Promise<Object>} Transaction details
 */
export async function getTransaction(signature, network = 'mainnet-beta', customRpcUrl = null) {
	try {
		const connection = getConnection(network, customRpcUrl);
		const transaction = await connection.getTransaction(signature, {
			commitment: 'confirmed'
		});
		return transaction;
	} catch (error) {
		console.error('Error fetching transaction:', error);
		throw new Error(`Failed to fetch transaction: ${error.message}`);
	}
}

/**
 * Get account info
 * @param {string} publicKey - Public key
 * @param {string} network - Network name
 * @param {string} customRpcUrl - Optional custom RPC URL
 * @returns {Promise<Object>} Account info
 */
export async function getAccountInfo(publicKey, network = 'mainnet-beta', customRpcUrl = null) {
	try {
		const connection = getConnection(network, customRpcUrl);
		const pubKey = new PublicKey(publicKey);
		const accountInfo = await connection.getAccountInfo(pubKey);
		return accountInfo;
	} catch (error) {
		console.error('Error fetching account info:', error);
		throw new Error(`Failed to fetch account info: ${error.message}`);
	}
}

/**
 * Check if account exists on chain
 * @param {string} publicKey - Public key
 * @param {string} network - Network name
 * @param {string} customRpcUrl - Optional custom RPC URL
 * @returns {Promise<boolean>} True if account exists
 */
export async function accountExists(publicKey, network = 'mainnet-beta', customRpcUrl = null) {
	try {
		const accountInfo = await getAccountInfo(publicKey, network, customRpcUrl);
		return accountInfo !== null;
	} catch (error) {
		return false;
	}
}

