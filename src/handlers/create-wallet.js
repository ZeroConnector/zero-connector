import { hashPassword, encrypt } from '../core/crypto.js';
import { generateKeypair } from '../core/solana.js';

/**
 * Create a new wallet with password protection
 * @param {StorageAdapter} storage - Storage adapter instance
 * @param {Object} data - { password }
 * @returns {Promise<Object>} { success, publicKey, message }
 */
export async function createWallet(storage, data) {
	try {
		const { password } = data;
		
		// Validate password
		if (!password || typeof password !== 'string') {
			return {
				success: false,
				error: 'Password is required'
			};
		}
		
		if (password.length < 6) {
			return {
				success: false,
				error: 'Password must be at least 6 characters long'
			};
		}
		
		// Generate new Solana keypair
		const { publicKey, privateKey } = generateKeypair();
		
		// Hash password
		const { hash: passwordHash, salt } = hashPassword(password);
		
		// Encrypt private key
		const encryptedPrivateKey = encrypt(privateKey, password);
		
		// Store wallet in database
		try {
			await storage.createWallet(publicKey, encryptedPrivateKey, passwordHash, salt);
		} catch (error) {
			if (error.message === 'Wallet already exists') {
				return {
					success: false,
					error: 'Wallet already exists'
				};
			}
			throw error;
		}
		
		return {
			success: true,
			publicKey,
			message: 'Wallet created successfully'
		};
	} catch (error) {
		console.error('[Zero Connector] Error creating wallet:', error);
		return {
			success: false,
			error: 'Failed to create wallet',
			details: error.message
		};
	}
}

