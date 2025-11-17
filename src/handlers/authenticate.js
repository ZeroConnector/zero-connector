import { verifyPassword, decrypt } from '../core/crypto.js';

/**
 * Authenticate a user with public key and password
 * @param {StorageAdapter} storage - Storage adapter instance
 * @param {SessionManager} sessionManager - Session manager instance
 * @param {Object} data - { publicKey, password }
 * @returns {Promise<Object>} { success, sessionToken, publicKey, balance, message }
 */
export async function authenticate(storage, sessionManager, data) {
	try {
		const { publicKey, password } = data;
		
		// Validate input
		if (!publicKey || !password) {
			return {
				success: false,
				error: 'Public key and password are required'
			};
		}
		
		// Check if wallet exists
		const wallet = await storage.getWallet(publicKey);
		if (!wallet) {
			return {
				success: false,
				error: 'Wallet not found'
			};
		}
		
		// Verify password
		const isValid = verifyPassword(password, wallet.passwordHash, wallet.salt);
		if (!isValid) {
			return {
				success: false,
				error: 'Invalid password'
			};
		}
		
		// Decrypt private key for use in transactions
		let decryptedPrivateKey = null;
		try {
			decryptedPrivateKey = decrypt(wallet.encryptedPrivateKey, password);
			console.log('[Zero Connector] Private key decrypted successfully');
		} catch (error) {
			console.error('[Zero Connector] Failed to decrypt private key:', error);
			// Continue without private key - user can still view balance
		}
		
		// Create session token with decrypted private key
		const sessionToken = sessionManager.createSession(publicKey, decryptedPrivateKey);
		
		// Get balance
		const balance = await storage.getBalance(publicKey);
		
		return {
			success: true,
			sessionToken,
			publicKey,
			balance: balance || { solBalance: 0, customData: {} },
			message: 'Authentication successful'
		};
	} catch (error) {
		console.error('[Zero Connector] Error authenticating:', error);
		return {
			success: false,
			error: 'Authentication failed',
			details: error.message
		};
	}
}

