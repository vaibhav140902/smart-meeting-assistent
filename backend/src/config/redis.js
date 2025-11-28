import redis from "redis";

let redisClient;

export const connectRedis = async () => {
    if (!redisClient) {
        redisClient = redis.createClient();
        
        redisClient.on("error", (err) => console.error("Redis Error:", err));
        
        await redisClient.connect();
        console.log("Redis Connected!");
    }
    return redisClient;
};

export const getRedisClient = () => {
    if (!redisClient) {
        throw new Error("Redis client not initialized. Call connectRedis first.");
    }
    return redisClient;
};
