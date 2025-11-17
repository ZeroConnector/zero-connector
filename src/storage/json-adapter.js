import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { StorageAdapter } from './adapter.js';
import { verifyPassword as cryptoVerifyPassword } from '../core/crypto.js';

/**
 * JSON File Storage Adapter
 * Stores data in a JSON file on the filesystem
 */
export class JSONAdapter extends StorageAdapter {
	constructor(filePath = null) {
		super();
		this.filePath = filePath || join(process.cwd(), 'data', 'zero-connector.json');
		this.data = {
			wallets: {},
			balances: {},
			transactions: {}
		};
		this.loadFromFile();
	}
	
	/**
	 * Load data from JSON file
	 */
	loadFromFile() {
		try {
			if (existsSync(this.filePath)) {
				const fileData = JSON.parse(readFileSync(this.filePath, 'utf-8'));
				this.data = fileData;
				console.log(`[Zero Connector] Loaded ${Object.keys(this.data.wallets).length} wallets from ${this.filePath}`);
			} else {
				console.log(`[Zero Connector] No existing data file found at ${this.filePath}, starting fresh`);
			}
		} catch (error) {
			console.error('[Zero Connector] Error loading data file:', error);
			this.data = { wallets: {}, balances: {}, transactions: {} };
		}
	}
	
	/**
	 * Save data to JSON file
	 */
	saveToFile() {
		try {
			// Ensure directory exists
			const dir = dirname(this.filePath);
			if (!existsSync(dir)) {
				mkdirSync(dir, { recursive: true });
			}
			
			const dataToSave = {
				...this.data,
				lastUpdated: new Date().toISOString()
			};
			
			writeFileSync(this.filePath, JSON.stringify(dataToSave, null, 2), 'utf-8');
		} catch (error) {
			console.error('[Zero Connector] Error saving data file:', error);
			throw error;
		}
	}
	
	async createWallet(publicKey, encryptedPrivateKey, passwordHash, salt) {
		if (this.data.wallets[publicKey]) {
			throw new Error('Wallet already exists');
		}
		
		this.data.wallets[publicKey] = {
			publicKey,
			encryptedPrivateKey,
			passwordHash,
			salt,
			createdAt: new Date().toISOString()
		};
		
		// Initialize balance
		this.data.balances[publicKey] = {
			solBalance: 0,
			customData: {},
			lastUpdated: new Date().toISOString()
		};
		
		// Initialize transactions
		this.data.transactions[publicKey] = [];
		
		this.saveToFile();
		return true;
	}
	
	async getWallet(publicKey) {
		return this.data.wallets[publicKey] || null;
	}
	
	async getPasswordData(publicKey) {
		const wallet = this.data.wallets[publicKey];
		if (!wallet) {
			return null;
		}
		return {
			passwordHash: wallet.passwordHash,
			salt: wallet.salt
		};
	}
	
	async updateBalance(publicKey, solBalance, customData = {}) {
		const currentBalance = this.data.balances[publicKey] || { solBalance: 0, customData: {} };
		
		this.data.balances[publicKey] = {
			solBalance: solBalance !== undefined ? solBalance : currentBalance.solBalance,
			customData: { ...currentBalance.customData, ...customData },
			lastUpdated: new Date().toISOString()
		};
		
		this.saveToFile();
		return this.data.balances[publicKey];
	}
	
	async getBalance(publicKey) {
		return this.data.balances[publicKey] || null;
	}
	
	async addTransaction(publicKey, transaction) {
		if (!this.data.transactions[publicKey]) {
			this.data.transactions[publicKey] = [];
		}
		
		const txWithTimestamp = {
			...transaction,
			timestamp: new Date().toISOString()
		};
		
		this.data.transactions[publicKey].push(txWithTimestamp);
		this.saveToFile();
		return txWithTimestamp;
	}
	
	async getTransactions(publicKey, limit = 100, offset = 0) {
		const transactions = this.data.transactions[publicKey] || [];
		return transactions.slice(offset, offset + limit);
	}
	
	async deleteWallet(publicKey) {
		delete this.data.wallets[publicKey];
		delete this.data.balances[publicKey];
		delete this.data.transactions[publicKey];
		this.saveToFile();
		return true;
	}
	
	/**
	 * Get all wallets (for admin purposes)
	 */
	async getAllWallets() {
		return Object.values(this.data.wallets);
	}
	
	/**
	 * Get wallet count
	 */
	async getWalletCount() {
		return Object.keys(this.data.wallets).length;
	}
}

