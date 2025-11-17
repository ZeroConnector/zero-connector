/**
 * Zero Connector Client Utilities
 * Frontend helper functions for interacting with Zero Connector API
 * These are customizable templates - users can modify as needed
 */

/**
 * Create a new wallet
 * @param {string} apiUrl - Base API URL (e.g., '/api/wallet' or 'https://api.example.com/wallet')
 * @param {string} password - User's password
 * @returns {Promise<Object>} { success, publicKey, message }
 */
export async function createWallet(apiUrl, password) {
	const response = await fetch(`${apiUrl}/create`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'include', // Include cookies
		body: JSON.stringify({ password })
	});
	
	return response.json();
}

/**
 * Authenticate with existing wallet
 * @param {string} apiUrl - Base API URL
 * @param {string} publicKey - User's public key
 * @param {string} password - User's password
 * @returns {Promise<Object>} { success, publicKey, balance, message }
 */
export async function authenticate(apiUrl, publicKey, password) {
	const response = await fetch(`${apiUrl}/authenticate`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'include', // Include cookies for session
		body: JSON.stringify({ publicKey, password })
	});
	
	return response.json();
}

/**
 * Get wallet balance
 * @param {string} apiUrl - Base API URL
 * @returns {Promise<Object>} { success, publicKey, balance }
 */
export async function getBalance(apiUrl) {
	const response = await fetch(`${apiUrl}/balance`, {
		method: 'GET',
		credentials: 'include'
	});
	
	return response.json();
}

/**
 * Refresh wallet balance from blockchain
 * @param {string} apiUrl - Base API URL
 * @returns {Promise<Object>} { success, publicKey, balance, message }
 */
export async function refreshBalance(apiUrl) {
	const response = await fetch(`${apiUrl}/balance`, {
		method: 'POST',
		credentials: 'include'
	});
	
	return response.json();
}

/**
 * Logout (clear session)
 * @param {string} apiUrl - Base API URL
 * @returns {Promise<Object>} { success, message }
 */
export async function logout(apiUrl) {
	const response = await fetch(`${apiUrl}/logout`, {
		method: 'POST',
		credentials: 'include'
	});
	
	return response.json();
}

/**
 * Verify if user is authenticated
 * @param {string} apiUrl - Base API URL
 * @returns {Promise<Object>} { success, authenticated, publicKey }
 */
export async function verifySession(apiUrl) {
	const response = await fetch(`${apiUrl}/verify`, {
		method: 'GET',
		credentials: 'include'
	});
	
	return response.json();
}

/**
 * Format SOL balance for display
 * @param {number} solBalance - Balance in SOL
 * @param {number} decimals - Number of decimal places (default 4)
 * @returns {string} Formatted balance
 */
export function formatSolBalance(solBalance, decimals = 4) {
	return solBalance.toFixed(decimals);
}

/**
 * Shorten public key for display
 * @param {string} publicKey - Full public key
 * @param {number} startChars - Characters to show at start (default 8)
 * @param {number} endChars - Characters to show at end (default 8)
 * @returns {string} Shortened key
 */
export function shortenPublicKey(publicKey, startChars = 8, endChars = 8) {
	if (!publicKey) return '';
	if (publicKey.length <= startChars + endChars) return publicKey;
	return `${publicKey.slice(0, startChars)}...${publicKey.slice(-endChars)}`;
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
	try {
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			await navigator.clipboard.writeText(text);
			return true;
		}
		return false;
	} catch (error) {
		console.error('Failed to copy to clipboard:', error);
		return false;
	}
}

/**
 * Get Solscan URL for transaction
 * @param {string} signature - Transaction signature
 * @param {string} network - Network (mainnet-beta, devnet, testnet)
 * @returns {string} Solscan URL
 */
export function getSolscanUrl(signature, network = 'mainnet-beta') {
	const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`;
	return `https://solscan.io/tx/${signature}${cluster}`;
}

/**
 * Get Solscan URL for address
 * @param {string} address - Wallet address
 * @param {string} network - Network (mainnet-beta, devnet, testnet)
 * @returns {string} Solscan URL
 */
export function getSolscanAddressUrl(address, network = 'mainnet-beta') {
	const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`;
	return `https://solscan.io/account/${address}${cluster}`;
}

