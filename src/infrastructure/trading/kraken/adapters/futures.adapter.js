import { krakenFuturesConfig } from "../config.js";

export default class KrakenFuturesAdapter {
  #apiConfig = krakenFuturesConfig;

  constructor(logger, apiClient, accountService) {
    this.logger = logger;
    this.apiClient = apiClient;
    this.accountService = accountService;
  }

  async placeOrder(data) {
    const orderData = await this.#prepOrderData(data);
    this.logger.info("Here is your data: ", orderData);
  }

  // Private

  async #prepOrderData(data) {
    return data.isSell ? await this.#prepShortOrderData(data) : await this.#prepCoverOrderData(data);
  }

  async #prepShortOrderData(data) {
    try {
      const balance = await this.accountService.getFuturesBalance(this.#apiConfig, "/derivatives/api/v3/accounts", "USD");
      console.log("Balance:", balance);
      return {
        symbol: data.symbol,
        side: "sell",
        orderType: "lmt",
      };
    } catch (error) {
      this.logger.error("Failed to prep data for short...");
      throw error;
    }
  }

  async #prepCoverOrderData(data) {
    return {
      symbol: data.symbol,
      side: "buy",
      orderType: "mkt",
    };
  }
}
