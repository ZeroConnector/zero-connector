import { getSolanaBalance } from '../core/solana.js';

/**
 * Get wallet balance from blockchain and update storage
 * @param {StorageAdapter} storage - Storage adapter instance
 * @param {Object} data - { publicKey, network, customRpcUrl }
 * @returns {Promise<Object>} { success, publicKey, balance, message }
 */
export async function getBalance(storage, data) {
	try {
		const { publicKey, network = 'mainnet-beta', customRpcUrl = null } = data;
		
		if (!publicKey) {
			return {
				success: false,
				error: 'Public key is required'
			};
		}
		
		// Get SOL balance from blockchain
		let solBalance = 0;
		try {
			solBalance = await getSolanaBalance(publicKey, network, customRpcUrl);
			console.log(`[Zero Connector] Fetched balance for ${publicKey}: ${solBalance} SOL`);
		} catch (error) {
			console.error('[Zero Connector] Error fetching SOL balance:', error);
			// Continue with 0 balance if fetch fails
		}
		
		// Get current balance data from storage
		const currentBalance = await storage.getBalance(publicKey);
		
		// Update SOL balance in storage
		const updatedBalance = await storage.updateBalance(
			publicKey,
			solBalance,
			currentBalance?.customData || {}
		);
		
		return {
			success: true,
			publicKey,
			balance: {
				solBalance: updatedBalance.solBalance,
				customData: updatedBalance.customData,
				lastUpdated: updatedBalance.lastUpdated
			},
			message: 'Balance fetched successfully'
		};
	} catch (error) {
		console.error('[Zero Connector] Error fetching balance:', error);
		return {
			success: false,
			error: 'Failed to fetch balance',
			details: error.message
		};
	}
}

/**
 * Refresh balance from blockchain
 * @param {StorageAdapter} storage - Storage adapter instance
 * @param {Object} data - { publicKey, network, customRpcUrl }
 * @returns {Promise<Object>} { success, publicKey, balance, message }
 */
export async function refreshBalance(storage, data) {
	// Same as getBalance, but with a different message
	const result = await getBalance(storage, data);
	if (result.success) {
		result.message = 'Balance refreshed successfully';
	}
	return result;
}

