import { createX402Client } from 'x402-solana/client';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount, TokenAccountNotFoundError } from '@solana/spl-token';

// Polyfill window for x402-solana client in Node.js environment
if (typeof window === 'undefined' && typeof global !== 'undefined') {
    global.window = global;
}

/**
 * Check USDC balance
 * @param {Connection} connection 
 * @param {PublicKey} walletPublicKey 
 * @param {BigInt} amountNeeded 
 * @param {PublicKey} usdcMintAddress 
 * @returns {Promise<boolean>}
 */
export async function checkUsdcBalance(connection, walletPublicKey, amountNeeded, usdcMintAddress) {
    try {
        const ata = await getAssociatedTokenAddress(usdcMintAddress, walletPublicKey);
        
        try {
            const account = await getAccount(connection, ata);
            // account.amount is a bigint
            if (account.amount < amountNeeded) {
                console.warn(`[ZeroConnector] Low USDC balance: ${account.amount} < ${amountNeeded}`);
                return false;
            }
            return true;
        } catch (e) {
            if (e instanceof TokenAccountNotFoundError || e.name === 'TokenAccountNotFoundError') {
                console.warn('[ZeroConnector] USDC account not found');
                return false;
            }
            console.warn('[ZeroConnector] Error checking USDC balance:', e.message);
            // Assume false if we can't verify
            return false; 
        }
    } catch (error) {
        console.error('[ZeroConnector] Error getting ATA:', error);
        return false;
    }
}

/**
 * Create a Zero Connector x402 Client
 * @param {Object} options
 * @param {Connection} options.connection - Solana Connection
 * @param {Keypair} options.signer - Wallet Keypair (from getSigner)
 * @param {string} [options.network='solana']
 * @param {string} [options.usdcMint] - USDC Mint address
 * @param {BigInt} [options.maxPaymentAmount]
 * @returns {Object} x402 Client
 */
export function createZeroX402Client({
    connection,
    signer,
    network = 'solana',
    usdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    maxPaymentAmount = BigInt(2000000), // 0.002 SOL
    ...options
}) {
    if (!signer || !signer.publicKey) {
        throw new Error('Signer (Keypair) is required');
    }

    const walletAdapter = {
        address: signer.publicKey.toString(),
        signTransaction: async (tx) => {
            tx.sign([signer]);
            return tx;
        },
    };

    const client = createX402Client({
        wallet: walletAdapter,
        network,
        maxPaymentAmount,
        ...options
    });
    
    // Attach helper to check balance
    client.checkBalance = async (amount = 10000) => { 
         return checkUsdcBalance(connection, signer.publicKey, BigInt(amount), new PublicKey(usdcMint));
    };
    
    return client;
}

