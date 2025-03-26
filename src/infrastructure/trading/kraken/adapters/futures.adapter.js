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

      const response = await this.#apiCall(data, orderData);
      console.log("Result:", response);

      if (response.result !== "success" && !Array.isArray(response)) {
        throw new Error(`Couldn't place an order: ${response.error}`);
      }

      if (!Array.isArray(response)) {
        for (let i = 0; i < response.batchStatus.length; i++) {
          let order = response.batchStatus[i];
          await this.redis.set(order.order_id, { ...order, ...orderData });
        }
      }

      if (!data.isSell && !data.isHalf) {
        this.#cleanUpOrders(data);
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

  async #apiCall(data, orderData) {
    try {
      if (data.isSell) {
        return await this.apiClient.makeFuturesApiCall(
          this.#apiConfig,
          "POST",
          "/derivatives/api/v3/batchorder",
          orderData,
          true
        );
      }

      if (Array.isArray(orderData)) {
        const results = await Promise.all(
          orderData.map((order) =>
            this.apiClient.makeFuturesApiCall(this.#apiConfig, "POST", "/derivatives/api/v3/sendorder", order, true)
          )
        );

        return results;
      }

      return await this.apiClient.makeFuturesApiCall(
        this.#apiConfig,
        "POST",
        "/derivatives/api/v3/sendorder",
        orderData,
        true
      );
    } catch (error) {
      throw new Error("Could not make an order...");
    }
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
    const openPositions = await this.accountService.getFuturesPositions(this.#apiConfig, data.symbol);

    console.log("Open positions:", openPositions);

    const coverOrders = openPositions.map((position) => {
      return {
        symbol: data.symbol,
        side: position.side === "short" ? "buy" : "sell",
        orderType: "mkt",
        size: data.isHalf ? parseFloat(position.size) / 2.0 : position.size,
      };
    });

    return coverOrders;
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

    return filter;
  }

  async #cleanUpOrders(data) {
    try {
      const allOrderOrders = await this.accountService.getFuturesOrders(this.#apiConfig, data.symbol);
      const stopOrders = allOrderOrders.filter((order) => order.orderType === "stop");

      console.log("Orders:", allOrderOrders);
      console.log("Stop orders:", stopOrders);

      if (stopOrders.length < 1) {
        this.logger.warn("No orders to clean up...");
        return;
      }

      const orderData = {
        json: {
          batchOrder: stopOrders.map((order) => {
            return {
              order_id: order.order_id,
              order: "cancel",
            };
          }),
        },
      };

      const response = await this.apiClient.makeFuturesApiCall(
        this.#apiConfig,
        "POST",
        "/derivatives/api/v3/batchorder",
        orderData,
        true
      );

      if (response.result !== "success") {
        throw new Error("Could not clean up orders!");
      }
    } catch (error) {
      this.logger.error("Could not clean up orders!");
      throw error;
    }
  }
}
