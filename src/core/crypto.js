import { randomBytes, scryptSync, timingSafeEqual, createCipheriv, createDecipheriv } from 'crypto';

/**
 * Hash a password using scrypt
 * @param {string} password - The password to hash
 * @returns {Object} { hash: string, salt: string }
 */
export function hashPassword(password) {
	const salt = randomBytes(16);
	const hash = scryptSync(password, salt, 64).toString('hex');
	return { hash, salt: salt.toString('hex') };
}

/**
 * Verify a password against a hash
 * @param {string} password - The password to verify
 * @param {string} storedHash - The stored hash (hex)
 * @param {string} salt - The salt used for hashing (hex)
 * @returns {boolean}
 */
export function verifyPassword(password, storedHash, salt) {
	try {
		const hashedPassword = scryptSync(
			password,
			Buffer.from(salt, 'hex'),
			64
		);
		
		const storedHashBuffer = Buffer.from(storedHash, 'hex');
		return timingSafeEqual(hashedPassword, storedHashBuffer);
	} catch (error) {
		console.error('Password verification error:', error);
		return false;
	}
}

/**
 * Encrypt data using AES-256-GCM
 * @param {string} data - Data to encrypt
 * @param {string} password - Password for encryption
 * @returns {string} Encrypted data in format: iv:authTag:encryptedData (all hex)
 */
export function encrypt(data, password) {
	try {
		// Derive a key from the password
		const salt = randomBytes(16);
		const key = scryptSync(password, salt, 32);
		
		// Generate IV
		const iv = randomBytes(16);
		
		// Create cipher
		const cipher = createCipheriv('aes-256-gcm', key, iv);
		
		// Encrypt
		let encrypted = cipher.update(data, 'utf8', 'hex');
		encrypted += cipher.final('hex');
		
		// Get auth tag
		const authTag = cipher.getAuthTag();
		
		// Return format: salt:iv:authTag:encryptedData
		return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
	} catch (error) {
		console.error('Encryption error:', error);
		throw new Error('Failed to encrypt data');
	}
}

/**
 * Decrypt data using AES-256-GCM
 * @param {string} encryptedData - Encrypted data in format: salt:iv:authTag:encryptedData
 * @param {string} password - Password for decryption
 * @returns {string} Decrypted data
 */
export function decrypt(encryptedData, password) {
	try {
		// Split the encrypted data
		const parts = encryptedData.split(':');
		if (parts.length !== 4) {
			throw new Error('Invalid encrypted data format');
		}
		
		const [saltHex, ivHex, authTagHex, encrypted] = parts;
		
		// Convert from hex
		const salt = Buffer.from(saltHex, 'hex');
		const iv = Buffer.from(ivHex, 'hex');
		const authTag = Buffer.from(authTagHex, 'hex');
		
		// Derive the key
		const key = scryptSync(password, salt, 32);
		
		// Create decipher
		const decipher = createDecipheriv('aes-256-gcm', key, iv);
		decipher.setAuthTag(authTag);
		
		// Decrypt
		let decrypted = decipher.update(encrypted, 'hex', 'utf8');
		decrypted += decipher.final('utf8');
		
		return decrypted;
	} catch (error) {
		console.error('Decryption error:', error);
		throw new Error('Failed to decrypt data');
	}
}

/**
 * Generate a random token
 * @param {number} bytes - Number of bytes (default 32)
 * @returns {string} Random hex string
 */
export function generateToken(bytes = 32) {
	return randomBytes(bytes).toString('hex');
}

