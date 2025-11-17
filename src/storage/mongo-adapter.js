import { StorageAdapter } from './adapter.js';

/**
 * MongoDB Storage Adapter
 * Stores data in a MongoDB database
 * Requires 'mongodb' package as peer dependency
 */
export class MongoAdapter extends StorageAdapter {
	constructor(uri, dbName = 'zero_connector') {
		super();
		this.uri = uri;
		this.dbName = dbName;
		this.client = null;
		this.db = null;
	}
	
	/**
	 * Initialize MongoDB connection
	 */
	async initialize() {
		try {
			const { MongoClient } = await import('mongodb');
			this.client = new MongoClient(this.uri);
			await this.client.connect();
			this.db = this.client.db(this.dbName);
			
			// Create indexes
			await this.createIndexes();
			console.log('[Zero Connector] MongoDB adapter initialized');
		} catch (error) {
			console.error('[Zero Connector] Error initializing MongoDB:', error);
			throw error;
		}
	}
	
	/**
	 * Create database indexes
	 */
	async createIndexes() {
		try {
			// Wallets collection indexes
			await this.db.collection('wallets').createIndex(
				{ publicKey: 1 },
				{ unique: true }
			);
			
			// Balances collection indexes
			await this.db.collection('balances').createIndex(
				{ publicKey: 1 },
				{ unique: true }
			);
			
			// Transactions collection indexes
			await this.db.collection('transactions').createIndex({ publicKey: 1 });
			await this.db.collection('transactions').createIndex({ timestamp: -1 });
		} catch (error) {
			console.error('[Zero Connector] Error creating indexes:', error);
		}
	}
	
	async createWallet(publicKey, encryptedPrivateKey, passwordHash, salt) {
		try {
			// Insert wallet
			await this.db.collection('wallets').insertOne({
				publicKey,
				encryptedPrivateKey,
				passwordHash,
				salt,
				createdAt: new Date()
			});
			
			// Initialize balance
			await this.db.collection('balances').insertOne({
				publicKey,
				solBalance: 0,
				customData: {},
				lastUpdated: new Date()
			});
			
			return true;
		} catch (error) {
			if (error.code === 11000) { // Duplicate key error
				throw new Error('Wallet already exists');
			}
			throw error;
		}
	}
	
	async getWallet(publicKey) {
		const wallet = await this.db.collection('wallets').findOne({ publicKey });
		return wallet || null;
	}
	
	async getPasswordData(publicKey) {
		const wallet = await this.db.collection('wallets').findOne(
			{ publicKey },
			{ projection: { passwordHash: 1, salt: 1 } }
		);
		
		if (!wallet) {
			return null;
		}
		
		return {
			passwordHash: wallet.passwordHash,
			salt: wallet.salt
		};
	}
	
	async updateBalance(publicKey, solBalance, customData = {}) {
		const result = await this.db.collection('balances').findOneAndUpdate(
			{ publicKey },
			{
				$set: {
					solBalance,
					lastUpdated: new Date()
				},
				$setOnInsert: { publicKey },
				...Object.keys(customData).length > 0 && {
					$set: {
						...Object.keys(customData).reduce((acc, key) => {
							acc[`customData.${key}`] = customData[key];
							return acc;
						}, {})
					}
				}
			},
			{
				upsert: true,
				returnDocument: 'after'
			}
		);
		
		return {
			solBalance: result.value.solBalance,
			customData: result.value.customData,
			lastUpdated: result.value.lastUpdated
		};
	}
	
	async getBalance(publicKey) {
		const balance = await this.db.collection('balances').findOne({ publicKey });
		return balance || null;
	}
	
	async addTransaction(publicKey, transaction) {
		const txWithTimestamp = {
			publicKey,
			...transaction,
			timestamp: new Date()
		};
		
		await this.db.collection('transactions').insertOne(txWithTimestamp);
		return txWithTimestamp;
	}
	
	async getTransactions(publicKey, limit = 100, offset = 0) {
		const transactions = await this.db.collection('transactions')
			.find({ publicKey })
			.sort({ timestamp: -1 })
			.skip(offset)
			.limit(limit)
			.toArray();
		
		return transactions;
	}
	
	async deleteWallet(publicKey) {
		const session = this.client.startSession();
		try {
			await session.withTransaction(async () => {
				await this.db.collection('wallets').deleteOne({ publicKey }, { session });
				await this.db.collection('balances').deleteOne({ publicKey }, { session });
				await this.db.collection('transactions').deleteMany({ publicKey }, { session });
			});
			return true;
		} finally {
			await session.endSession();
		}
	}
	
	/**
	 * Close the database connection
	 */
	async close() {
		if (this.client) {
			await this.client.close();
		}
	}
}

