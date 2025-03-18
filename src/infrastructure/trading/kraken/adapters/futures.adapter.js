import { krakenFuturesConfig } from "../config.js";

export default class KrakenFuturesAdapter {
  #apiConfig = krakenFuturesConfig;

  constructor(logger, apiClient, accountService, redis, krakenFilters) {
    this.logger = logger;
    this.apiClient = apiClient;
    this.accountService = accountService;
    this.redis = redis;
    this.krakenFilters = krakenFilters;
  }

  async placeOrder(data) {
    try {
      const balance = await this.accountService.getFuturesBalance(
        this.#apiConfig,
        "/derivatives/api/v3/accounts",
        "usd"
      );
      const tradableAmount = parseFloat(balance) * 0.1;
      const size = await this.#getOrderSize(data, tradableAmount);
      data.size = size;
      const orderData = await this.#prepOrderData(data);
      this.logger.info("Here is your order data: ", orderData);

      const response = await this.apiClient.makeFuturesApiCall(
        this.#apiConfig,
        "POST",
        "/derivatives/api/v3/batchorder",
        orderData,
        true
      );

      console.log("Result:", response);

      if (response.result === "success") {
        for (let i = 0; i < response.batchStatus.length; i++) {
          let order = response.batchStatus[i];
          await this.redis.set(order.order_id, { ...order, ...orderData });
        }
      } else {
        throw new Error("Couldn't place an order!");
      }
    } catch (error) {
      this.logger.error("Failed to create a batch order: ", error);
      throw new Error("Failed to create a batch order: ", error);
    }
  }

  // Private

  async #prepOrderData(data) {
    return data.isSell ? await this.#prepShortOrderData(data) : await this.#prepCoverOrderData(data);
  }

  async #prepShortOrderData(data) {
    try {
      const price = await this.#formatPrice(data, data.entryPrice);
      const entry = {
        order: "send",
        limitPrice: parseFloat(price),
        symbol: data.symbol,
        side: "sell",
        orderType: "lmt",
        size: data.size,
        order_tag: "entry_order",
      };
      const stop = await this.#prepStopOrderData(data);
      return {
        json: {
          batchOrder: [entry, stop],
        },
      };
    } catch (error) {
      this.logger.error("Failed to prep data for short...");
      throw error;
    }
  }

  async #prepStopOrderData(data) {
    const priceStr = await this.#formatPrice(data, data.stopLoss);
    const price = parseFloat(priceStr);
    const fivePercentLess = price - price * 0.05;
    return {
      order: "send",
      limitPrice: price,
      stopPrice: fivePercentLess,
      symbol: data.symbol,
      side: "buy",
      orderType: "stp",
      size: data.size,
      order_tag: "stop_order",
    };
  }

  async #prepCoverOrderData(data) {
    return {
      symbol: data.symbol,
      side: "buy",
      orderType: "mkt",
    };
  }

  async #getOrderSize(data, tradableAmount) {
    let size = tradableAmount / parseFloat(data.entryPrice);
    let filter = await this.#getFilters(data.symbol);
    const { contractValueTradePrecision } = filter;
    return size.toFixed(contractValueTradePrecision);
  }

  async #formatPrice(data, price) {
    let filter = await this.#getFilters(data.symbol);
    price = parseFloat(price);
    const tickSize = String(filter.tickSize).split(".")[1].length;
    return price.toFixed(tickSize);
  }

  async #getFilters(symbol) {
    let filter = await this.redis.get(`${symbol}_filter`);
    if (!filter) {
      await this.krakenFilters.getFuturesFilters();
      filter = await this.redis.get(`${symbol}_filter`);
    }

    console.log("filter:", filter);

    return filter;
  }
}
