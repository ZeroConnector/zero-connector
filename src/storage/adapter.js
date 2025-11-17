/**
 * Abstract Storage Adapter Interface
 * All storage adapters must implement these methods
 */
export class StorageAdapter {
	/**
	 * Create a new wallet
	 * @param {string} publicKey - Wallet public key
	 * @param {string} encryptedPrivateKey - Encrypted private key
	 * @param {string} passwordHash - Hashed password
	 * @param {string} salt - Salt used for hashing
	 * @returns {Promise<boolean>}
	 */
	async createWallet(publicKey, encryptedPrivateKey, passwordHash, salt) {
		throw new Error('createWallet() must be implemented');
	}
	
	/**
	 * Get wallet by public key
	 * @param {string} publicKey - Wallet public key
	 * @returns {Promise<Object|null>}
	 */
	async getWallet(publicKey) {
		throw new Error('getWallet() must be implemented');
	}
	
	/**
	 * Get password hash and salt for verification
	 * @param {string} publicKey - Wallet public key
	 * @returns {Promise<Object|null>} { passwordHash, salt }
	 */
	async getPasswordData(publicKey) {
		throw new Error('getPasswordData() must be implemented');
	}
	
	/**
	 * Update wallet balance
	 * @param {string} publicKey - Wallet public key
	 * @param {number} solBalance - SOL balance
	 * @param {Object} customData - Additional custom data
	 * @returns {Promise<Object>}
	 */
	async updateBalance(publicKey, solBalance, customData = {}) {
		throw new Error('updateBalance() must be implemented');
	}
	
	/**
	 * Get wallet balance
	 * @param {string} publicKey - Wallet public key
	 * @returns {Promise<Object|null>}
	 */
	async getBalance(publicKey) {
		throw new Error('getBalance() must be implemented');
	}
	
	/**
	 * Add a transaction record
	 * @param {string} publicKey - Wallet public key
	 * @param {Object} transaction - Transaction data
	 * @returns {Promise<Object>}
	 */
	async addTransaction(publicKey, transaction) {
		throw new Error('addTransaction() must be implemented');
	}
	
	/**
	 * Get transaction history
	 * @param {string} publicKey - Wallet public key
	 * @param {number} limit - Maximum number of transactions
	 * @param {number} offset - Offset for pagination
	 * @returns {Promise<Array>}
	 */
	async getTransactions(publicKey, limit = 100, offset = 0) {
		throw new Error('getTransactions() must be implemented');
	}
	
	/**
	 * Delete a wallet
	 * @param {string} publicKey - Wallet public key
	 * @returns {Promise<boolean>}
	 */
	async deleteWallet(publicKey) {
		throw new Error('deleteWallet() must be implemented');
	}
	
	/**
	 * Check if wallet exists
	 * @param {string} publicKey - Wallet public key
	 * @returns {Promise<boolean>}
	 */
	async walletExists(publicKey) {
		const wallet = await this.getWallet(publicKey);
		return wallet !== null;
	}
}

