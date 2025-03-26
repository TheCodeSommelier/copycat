import logger from "../../infrastructure/logger/logger.js";
import dotenv from "dotenv";
dotenv.config();

export default class Trade {
  constructor(data = {}) {
    try {
      this.#validateRequiredFields(data);
      this.symbol = data.symbol;
      this.baseAsset = data.baseAsset;
      this.quoteAsset = data.quoteAsset;
      this.entryPrice = data.entryPrice;
      this.stopLoss = data.stopLoss;
      this.takeProfit = data.takeProfit;
      this.tradeAction = data.tradeAction;
      this.isFutures = data.isFutures;
      this.isHalf = data.isHalf;
      this.isSell = data.isSell;
      this.traderName = data.traderName;
      this.exchangeType = this.traderName.toLowerCase() === process.env.ALT_TRADER_NAME ? "DEX" : "CEX";
    } catch (error) {
      logger.error("Trade validations failed:\n", error);
      throw error;
    }
  }

  #validateRequiredFields(data) {
    const isShort = data.isSell && data.isFutures;
    const isBuy = !data.isSell && !data.isFutures;
    const required = ["symbol", "baseAsset", "quoteAsset", "tradeAction", "isSell", "isHalf", "isFutures"];

    if (isShort || isBuy) {
      required.push("entryPrice");
      required.push("stopLoss");
      required.push("takeProfit");
    }

    const missing = required.filter((field) => data[field] === undefined || data[field] === null);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(", ")}`);
    }
  }
}
