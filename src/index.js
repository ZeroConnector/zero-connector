import { JSONAdapter, PostgresAdapter, MongoAdapter } from './storage/index.js';
import { SessionManager, defaultSessionManager } from './core/session.js';
import * as handlers from './handlers/index.js';
import * as crypto from './core/crypto.js';
import * as solana from './core/solana.js';

/**
 * Zero Connector - Solana Wallet Authentication System
 * Main class for managing wallet authentication, storage, and sessions
 */
export class ZeroConnector {
	constructor(options = {}) {
		// Initialize storage adapter
		this.storage = options.storage || new JSONAdapter(options.storagePath);
		
		// Initialize session manager
		this.sessionManager = options.sessionManager || (options.useDefaultSessionManager !== false 
			? defaultSessionManager 
			: new SessionManager(options.sessionOptions));
		
		// Solana network configuration
		this.network = options.network || 'mainnet-beta';
		this.customRpcUrl = options.customRpcUrl || null;
	}
	
	/**
	 * Create a new wallet with password protection
	 * @param {Object} data - { password }
	 * @returns {Promise<Object>} { success, publicKey, message }
	 */
	async createWallet(data) {
		return handlers.createWallet(this.storage, data);
	}
	
	/**
	 * Authenticate a user with public key and password
	 * @param {Object} data - { publicKey, password }
	 * @returns {Promise<Object>} { success, sessionToken, publicKey, balance, message }
	 */
	async authenticate(data) {
		return handlers.authenticate(this.storage, this.sessionManager, data);
	}
	
	/**
	 * Get wallet balance from blockchain
	 * @param {string} publicKey - User's public key
	 * @returns {Promise<Object>} { success, publicKey, balance, message }
	 */
	async getBalance(publicKey) {
		return handlers.getBalance(this.storage, {
			publicKey,
			network: this.network,
			customRpcUrl: this.customRpcUrl
		});
	}
	
	/**
	 * Refresh wallet balance from blockchain
	 * @param {string} publicKey - User's public key
	 * @returns {Promise<Object>} { success, publicKey, balance, message }
	 */
	async refreshBalance(publicKey) {
		return handlers.refreshBalance(this.storage, {
			publicKey,
			network: this.network,
			customRpcUrl: this.customRpcUrl
		});
	}
	
	/**
	 * Get wallet information
	 * @param {string} publicKey - User's public key
	 * @returns {Promise<Object|null>}
	 */
	async getWallet(publicKey) {
		return this.storage.getWallet(publicKey);
	}
	
	/**
	 * Update balance in storage
	 * @param {string} publicKey - User's public key
	 * @param {number} solBalance - SOL balance
	 * @param {Object} customData - Additional custom data
	 * @returns {Promise<Object>}
	 */
	async updateBalance(publicKey, solBalance, customData = {}) {
		return this.storage.updateBalance(publicKey, solBalance, customData);
	}
	
	/**
	 * Add a transaction record
	 * @param {string} publicKey - User's public key
	 * @param {Object} transaction - Transaction data
	 * @returns {Promise<Object>}
	 */
	async addTransaction(publicKey, transaction) {
		return this.storage.addTransaction(publicKey, transaction);
	}
	
	/**
	 * Get transaction history
	 * @param {string} publicKey - User's public key
	 * @param {number} limit - Maximum number of transactions
	 * @param {number} offset - Offset for pagination
	 * @returns {Promise<Array>}
	 */
	async getTransactions(publicKey, limit = 100, offset = 0) {
		return this.storage.getTransactions(publicKey, limit, offset);
	}
	
	/**
	 * Delete a wallet
	 * @param {string} publicKey - User's public key
	 * @returns {Promise<boolean>}
	 */
	async deleteWallet(publicKey) {
		// Also delete all sessions for this wallet
		this.sessionManager.deleteSessionsByPublicKey(publicKey);
		return this.storage.deleteWallet(publicKey);
	}
	
	/**
	 * Verify a session token
	 * @param {string} sessionToken - Session token to verify
	 * @returns {Object|null} Session data or null
	 */
	verifySession(sessionToken) {
		return this.sessionManager.verifySession(sessionToken);
	}
	
	/**
	 * Delete a session
	 * @param {string} sessionToken - Session token to delete
	 * @returns {boolean}
	 */
	deleteSession(sessionToken) {
		return this.sessionManager.deleteSession(sessionToken);
	}
	
	/**
	 * Initialize async storage adapters (PostgreSQL, MongoDB)
	 */
	async initialize() {
		if (typeof this.storage.initialize === 'function') {
			await this.storage.initialize();
		}
	}
	
	/**
	 * Close database connections
	 */
	async close() {
		if (typeof this.storage.close === 'function') {
			await this.storage.close();
		}
		this.sessionManager.stopCleanup();
	}
}

// Export storage adapters
export { JSONAdapter, PostgresAdapter, MongoAdapter };

// Export session manager
export { SessionManager, defaultSessionManager };

// Export core modules for advanced usage
export { crypto, solana, handlers };

// Export individual functions
export const {
	hashPassword,
	verifyPassword,
	encrypt,
	decrypt,
	generateToken
} = crypto;

export const {
	getConnection,
	getSolanaBalance,
	generateKeypair,
	validateAddress,
	lamportsToSol,
	solToLamports
} = solana;

export const {
	createWallet,
	authenticate,
	getBalance,
	refreshBalance
} = handlers;

// Default export
export default ZeroConnector;

