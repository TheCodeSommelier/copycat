import logger from "../../infrastructure/logger/logger.js";

export default class Trade {
  constructor(data = {}) {
    try {
      this.#validateTradeData(data);
      this.symbol = data.symbol;
      this.baseAsset = data.baseAsset;
      this.quoteAsset = data.quoteAsset;
      this.clientType = data.clientType;
      this.entryPrice = data.entryPrice;
      this.targetPrice = data.targetPrice;
      this.stopLoss = data.stopLoss;
      this.tradeAction = data.tradeAction;
      this.orders = data.orders;
      this.isHalf = data.isHalf || false;
    } catch (error) {
      logger.error("Trade validations failed:\n", error);
      throw error;
    }
  }

  static validateQuantityQuoteAsset(quantity) {
    console.log("Qty => ", quantity);

    if (parseFloat(quantity) > 0 && typeof quantity === "string") {
      return;
    }

    throw new Error(
      `Order: Quantity needs to be higher than 0 and needs to be a string!`
    );
  }

  #validateTradeData(data) {
    this.#validateRequiredFields(data);

    if (!Array.isArray(data.orders)) {
      throw new Error("Orders must be an array");
    }

    data.orders.forEach((order, index) => {
      this.#validateSide(order, index);
      this.#validateType(order, index);
    });
  }

  #validateRequiredFields(data) {
    const required = [
      "symbol",
      "baseAsset",
      "quoteAsset",
      "clientType",
      "tradeAction",
      "orders",
    ];

    const missing = required.filter((field) => !data[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(", ")}`);
    }
  }

  #validateSide(order, index) {
    if (
      (order.side === "SELL" || order.side === "BUY") &&
      typeof order.side === "string"
    ) {
      return;
    }

    throw new Error(
      `Order ${index}: Side needs to be either BUY or SELL and needs to be a string!`
    );
  }

  #validateType(order, index) {
    if (
      /LIMIT|STOP_LOSS|STOP_MARKET|TAKE_PROFIT_MARKET|TAKE_PROFIT|MARKET/g.test(
        order.type
      ) &&
      typeof order.type === "string"
    ) {
      return;
    }

    throw new Error(
      `Order ${index}: Type needs to be either LIMIT, STOP_LOSS, STOP_MARKET, TAKE_PROFIT_MARKET, TAKE_PROFIT or MARKET and needs to be a string!`
    );
  }
}
