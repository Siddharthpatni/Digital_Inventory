/**
 * Redis Configuration
 * Used for session storage and rate limiting
 */

const redis = require('redis');

// Redis configuration from environment
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';
const USE_REDIS = process.env.USE_REDIS !== 'false'; // Default to true

let redisClient = null;
let redisAvailable = false;

/**
 * Initialize Redis client
 */
async function initializeRedis() {
    if (!USE_REDIS) {
        console.log('⚠️  Redis disabled - using in-memory storage (not recommended for production)');
        return null;
    }

    try {
        redisClient = redis.createClient({
            url: REDIS_URL,
            password: REDIS_PASSWORD || undefined,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        console.error('❌ Redis: Max reconnection attempts reached');
                        return new Error('Redis max retries reached');
                    }
                    return Math.min(retries * 100, 3000);
                }
            }
        });

        // Event handlers
        redisClient.on('error', (err) => {
            console.error('❌ Redis Client Error:', err.message);
            redisAvailable = false;
        });

        redisClient.on('connect', () => {
            console.log('🔄 Redis: Connecting...');
        });

        redisClient.on('ready', () => {
            console.log('✅ Redis: Connected and ready');
            redisAvailable = true;
        });

        redisClient.on('reconnecting', () => {
            console.log('🔄 Redis: Reconnecting...');
        });

        redisClient.on('end', () => {
            console.log('⚠️  Redis: Connection closed');
            redisAvailable = false;
        });

        // Connect to Redis
        await redisClient.connect();

        // Test connection
        await redisClient.ping();

        return redisClient;
    } catch (error) {
        console.error('❌ Redis initialization failed:', error.message);
        console.log('⚠️  Falling back to in-memory storage');
        redisAvailable = false;
        return null;
    }
}

/**
 * Get Redis client
 */
function getRedisClient() {
    return redisClient;
}

/**
 * Check if Redis is available
 */
function isRedisAvailable() {
    return redisAvailable && redisClient && redisClient.isOpen;
}

/**
 * Gracefully close Redis connection
 */
async function closeRedis() {
    if (redisClient) {
        try {
            await redisClient.quit();
            console.log('✅ Redis connection closed gracefully');
        } catch (error) {
            console.error('Error closing Redis:', error.message);
        }
    }
}

module.exports = {
    initializeRedis,
    getRedisClient,
    isRedisAvailable,
    closeRedis
};
