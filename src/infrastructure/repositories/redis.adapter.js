import dotenv from "dotenv";
import { createClient } from "redis";
dotenv.config();

class Redis {
  #config = {
    url: "redis://localhost:6379",
    password: process.env.REDIS_PASS,
  };

  constructor(logger) {
    this.logger = logger;
    this.client = createClient(this.#config);
    this.client.on("error", (err) => this.logger.error("Redis Client Error", err));
    this.connectRedis();
  }

  async connectRedis() {
    try {
      await this.client.connect();
    } catch (error) {
      this.logger.error("Redis connection failed:", error);
    }
  }

  /**
   * Get Redis singleton instance
   * @param {Object} logger - Logger instance (only used on first call)
   * @returns {Redis} Redis instance
   */
  static getInstance(logger) {
    if (!Redis.instance) {
      Redis.instance = new Redis(logger);
    }
    return Redis.instance;
  }

  /**
   * Get Redis client
   * @returns {Promise<RedisClient>} Connected Redis client
   */
  async getClient() {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
    return this.client;
  }

  /**
   * Close Redis connection
   */
  async disconnect() {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }

  async ping() {
    try {
      const client = await this.getClient();

      if (!client.isOpen) {
        await client.connect();
      }

      return await client.ping();
    } catch (error) {
      this.logger.error("Redis ping failed:", error);
      throw error;
    }
  }

  async getOrdersBySymbol(symbol) {
    try {
      return await this.client.hGetAll(`${symbol}:orders`);
    } catch (err) {
      this.logger.error("The order could not be retrieved by the key provided: ", err);
      throw new Error("Could not retrieve the order:", err);
    }
  }

  async saveOrderData(orderData) {
    try {
      await this.client.hSet(`${orderData.symbol}:orders`, orderData.id, JSON.stringify(orderData));
      this.logger.info("The order hase been stored...");
      console.log(await this.getOrdersBySymbol(orderData.symbol));
    } catch (err) {
      this.logger.error("Redis couldn't save the order data:", err);
      throw new Error("Couldn't save order into Redis:", err);
    }
  }

  async deleteOrder(order) {
    try {
      await this.client.hDel(`${order.symbol}:orders`, order.id);
      this.logger.info("Order succeffully deleted!");
    } catch (err) {
      this.logger.error("Could not delete the order:", err);
      throw new Error("Could not delete the order:", err);
    }
  }
}

export default Redis;
