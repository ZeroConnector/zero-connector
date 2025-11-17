import { generateToken } from './crypto.js';

/**
 * Session Manager
 * Handles session creation, verification, and cleanup
 */
export class SessionManager {
	constructor(options = {}) {
		this.sessions = new Map();
		this.sessionDuration = options.sessionDuration || (24 * 60 * 60 * 1000); // 24 hours default
		this.cleanupInterval = options.cleanupInterval || (60 * 60 * 1000); // 1 hour default
		
		// Start automatic cleanup
		if (options.autoCleanup !== false) {
			this.startCleanup();
		}
	}
	
	/**
	 * Create a new session
	 * @param {string} publicKey - User's public key
	 * @param {string} privateKey - Optional decrypted private key for transactions
	 * @param {Object} metadata - Additional session metadata
	 * @returns {string} Session token
	 */
	createSession(publicKey, privateKey = null, metadata = {}) {
		const sessionToken = generateToken(32);
		
		this.sessions.set(sessionToken, {
			publicKey,
			privateKey,
			metadata,
			createdAt: Date.now(),
			expiresAt: Date.now() + this.sessionDuration
		});
		
		return sessionToken;
	}
	
	/**
	 * Verify and get session data
	 * @param {string} sessionToken - Session token to verify
	 * @returns {Object|null} Session data or null if invalid/expired
	 */
	verifySession(sessionToken) {
		if (!sessionToken) {
			return null;
		}
		
		const session = this.sessions.get(sessionToken);
		if (!session) {
			return null;
		}
		
		// Check if session is expired
		if (Date.now() > session.expiresAt) {
			this.sessions.delete(sessionToken);
			return null;
		}
		
		return session;
	}
	
	/**
	 * Delete a session
	 * @param {string} sessionToken - Session token to delete
	 * @returns {boolean} True if session was deleted
	 */
	deleteSession(sessionToken) {
		return this.sessions.delete(sessionToken);
	}
	
	/**
	 * Update session metadata
	 * @param {string} sessionToken - Session token
	 * @param {Object} metadata - New metadata to merge
	 * @returns {boolean} True if session was updated
	 */
	updateSession(sessionToken, metadata) {
		const session = this.sessions.get(sessionToken);
		if (!session) {
			return false;
		}
		
		session.metadata = { ...session.metadata, ...metadata };
		this.sessions.set(sessionToken, session);
		return true;
	}
	
	/**
	 * Extend session expiration
	 * @param {string} sessionToken - Session token
	 * @param {number} duration - Duration to extend (ms), defaults to sessionDuration
	 * @returns {boolean} True if session was extended
	 */
	extendSession(sessionToken, duration = null) {
		const session = this.sessions.get(sessionToken);
		if (!session) {
			return false;
		}
		
		session.expiresAt = Date.now() + (duration || this.sessionDuration);
		this.sessions.set(sessionToken, session);
		return true;
	}
	
	/**
	 * Clean up expired sessions
	 * @returns {number} Number of sessions cleaned up
	 */
	cleanupExpiredSessions() {
		const now = Date.now();
		let count = 0;
		
		for (const [token, session] of this.sessions.entries()) {
			if (now > session.expiresAt) {
				this.sessions.delete(token);
				count++;
			}
		}
		
		if (count > 0) {
			console.log(`Cleaned up ${count} expired sessions`);
		}
		
		return count;
	}
	
	/**
	 * Start automatic session cleanup
	 */
	startCleanup() {
		this.cleanupTimer = setInterval(
			() => this.cleanupExpiredSessions(),
			this.cleanupInterval
		);
	}
	
	/**
	 * Stop automatic session cleanup
	 */
	stopCleanup() {
		if (this.cleanupTimer) {
			clearInterval(this.cleanupTimer);
			this.cleanupTimer = null;
		}
	}
	
	/**
	 * Get session count
	 * @returns {number} Number of active sessions
	 */
	getSessionCount() {
		return this.sessions.size;
	}
	
	/**
	 * Get all sessions for a public key
	 * @param {string} publicKey - User's public key
	 * @returns {Array} Array of session tokens
	 */
	getSessionsByPublicKey(publicKey) {
		const tokens = [];
		for (const [token, session] of this.sessions.entries()) {
			if (session.publicKey === publicKey) {
				tokens.push(token);
			}
		}
		return tokens;
	}
	
	/**
	 * Delete all sessions for a public key
	 * @param {string} publicKey - User's public key
	 * @returns {number} Number of sessions deleted
	 */
	deleteSessionsByPublicKey(publicKey) {
		const tokens = this.getSessionsByPublicKey(publicKey);
		tokens.forEach(token => this.sessions.delete(token));
		return tokens.length;
	}
}

// Create a default singleton instance
export const defaultSessionManager = new SessionManager();

// Export convenience functions that use the default instance
export function createSession(publicKey, privateKey = null, metadata = {}) {
	return defaultSessionManager.createSession(publicKey, privateKey, metadata);
}

export function verifySession(sessionToken) {
	return defaultSessionManager.verifySession(sessionToken);
}

export function deleteSession(sessionToken) {
	return defaultSessionManager.deleteSession(sessionToken);
}

export function cleanupExpiredSessions() {
	return defaultSessionManager.cleanupExpiredSessions();
}

