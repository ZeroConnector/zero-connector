import { StorageAdapter } from './adapter.js';

/**
 * PostgreSQL Storage Adapter
 * Stores data in a PostgreSQL database
 * Requires 'pg' package as peer dependency
 */
export class PostgresAdapter extends StorageAdapter {
	constructor(config) {
		super();
		this.config = config;
		this.pool = null;
	}
	
	/**
	 * Initialize PostgreSQL connection pool
	 */
	async initialize() {
		try {
			const { Pool } = await import('pg');
			this.pool = new Pool(this.config);
			
			// Create tables if they don't exist
			await this.createTables();
			console.log('[Zero Connector] PostgreSQL adapter initialized');
		} catch (error) {
			console.error('[Zero Connector] Error initializing PostgreSQL:', error);
			throw error;
		}
	}
	
	/**
	 * Create database tables
	 */
	async createTables() {
		const client = await this.pool.connect();
		try {
			await client.query(`
				CREATE TABLE IF NOT EXISTS zero_wallets (
					public_key VARCHAR(44) PRIMARY KEY,
					encrypted_private_key TEXT NOT NULL,
					password_hash VARCHAR(128) NOT NULL,
					salt VARCHAR(32) NOT NULL,
					created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
				)
			`);
			
			await client.query(`
				CREATE TABLE IF NOT EXISTS zero_balances (
					public_key VARCHAR(44) PRIMARY KEY REFERENCES zero_wallets(public_key) ON DELETE CASCADE,
					sol_balance DECIMAL(20, 9) DEFAULT 0,
					custom_data JSONB DEFAULT '{}',
					last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
				)
			`);
			
			await client.query(`
				CREATE TABLE IF NOT EXISTS zero_transactions (
					id SERIAL PRIMARY KEY,
					public_key VARCHAR(44) REFERENCES zero_wallets(public_key) ON DELETE CASCADE,
					transaction_data JSONB NOT NULL,
					timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
				)
			`);
			
			await client.query(`
				CREATE INDEX IF NOT EXISTS idx_transactions_public_key 
				ON zero_transactions(public_key)
			`);
			
			await client.query(`
				CREATE INDEX IF NOT EXISTS idx_transactions_timestamp 
				ON zero_transactions(timestamp DESC)
			`);
		} finally {
			client.release();
		}
	}
	
	async createWallet(publicKey, encryptedPrivateKey, passwordHash, salt) {
		const client = await this.pool.connect();
		try {
			await client.query('BEGIN');
			
			// Insert wallet
			await client.query(
				`INSERT INTO zero_wallets (public_key, encrypted_private_key, password_hash, salt) 
				 VALUES ($1, $2, $3, $4)`,
				[publicKey, encryptedPrivateKey, passwordHash, salt]
			);
			
			// Initialize balance
			await client.query(
				`INSERT INTO zero_balances (public_key, sol_balance, custom_data) 
				 VALUES ($1, 0, '{}')`,
				[publicKey]
			);
			
			await client.query('COMMIT');
			return true;
		} catch (error) {
			await client.query('ROLLBACK');
			if (error.code === '23505') { // Unique violation
				throw new Error('Wallet already exists');
			}
			throw error;
		} finally {
			client.release();
		}
	}
	
	async getWallet(publicKey) {
		const result = await this.pool.query(
			'SELECT * FROM zero_wallets WHERE public_key = $1',
			[publicKey]
		);
		
		if (result.rows.length === 0) {
			return null;
		}
		
		const row = result.rows[0];
		return {
			publicKey: row.public_key,
			encryptedPrivateKey: row.encrypted_private_key,
			passwordHash: row.password_hash,
			salt: row.salt,
			createdAt: row.created_at
		};
	}
	
	async getPasswordData(publicKey) {
		const result = await this.pool.query(
			'SELECT password_hash, salt FROM zero_wallets WHERE public_key = $1',
			[publicKey]
		);
		
		if (result.rows.length === 0) {
			return null;
		}
		
		return {
			passwordHash: result.rows[0].password_hash,
			salt: result.rows[0].salt
		};
	}
	
	async updateBalance(publicKey, solBalance, customData = {}) {
		const result = await this.pool.query(
			`UPDATE zero_balances 
			 SET sol_balance = $2, 
			     custom_data = custom_data || $3::jsonb,
			     last_updated = CURRENT_TIMESTAMP
			 WHERE public_key = $1
			 RETURNING *`,
			[publicKey, solBalance, JSON.stringify(customData)]
		);
		
		if (result.rows.length === 0) {
			return null;
		}
		
		return {
			solBalance: parseFloat(result.rows[0].sol_balance),
			customData: result.rows[0].custom_data,
			lastUpdated: result.rows[0].last_updated
		};
	}
	
	async getBalance(publicKey) {
		const result = await this.pool.query(
			'SELECT * FROM zero_balances WHERE public_key = $1',
			[publicKey]
		);
		
		if (result.rows.length === 0) {
			return null;
		}
		
		return {
			solBalance: parseFloat(result.rows[0].sol_balance),
			customData: result.rows[0].custom_data,
			lastUpdated: result.rows[0].last_updated
		};
	}
	
	async addTransaction(publicKey, transaction) {
		const result = await this.pool.query(
			`INSERT INTO zero_transactions (public_key, transaction_data) 
			 VALUES ($1, $2) 
			 RETURNING *`,
			[publicKey, JSON.stringify(transaction)]
		);
		
		return {
			...result.rows[0].transaction_data,
			timestamp: result.rows[0].timestamp
		};
	}
	
	async getTransactions(publicKey, limit = 100, offset = 0) {
		const result = await this.pool.query(
			`SELECT transaction_data, timestamp 
			 FROM zero_transactions 
			 WHERE public_key = $1 
			 ORDER BY timestamp DESC 
			 LIMIT $2 OFFSET $3`,
			[publicKey, limit, offset]
		);
		
		return result.rows.map(row => ({
			...row.transaction_data,
			timestamp: row.timestamp
		}));
	}
	
	async deleteWallet(publicKey) {
		const result = await this.pool.query(
			'DELETE FROM zero_wallets WHERE public_key = $1',
			[publicKey]
		);
		return result.rowCount > 0;
	}
	
	/**
	 * Close the database connection pool
	 */
	async close() {
		if (this.pool) {
			await this.pool.end();
		}
	}
}

