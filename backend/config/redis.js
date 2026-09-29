import { createClient } from 'redis';

const redisClient = createClient({
    url: 'redis://127.0.0.1:6379' // Default local address
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Connected to Redis successfully!'));

export const connectRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
};

export default redisClient;