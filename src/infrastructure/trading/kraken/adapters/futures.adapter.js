import { krakenFuturesConfig } from "../config.js";

export default class KrakenFuturesAdapter {
  #apiConfig = krakenFuturesConfig;

  constructor(logger, apiClient, accountService) {
    this.logger = logger;
    this.apiClient = apiClient;
    this.accountService = accountService;
  }

  async placeOrder(data) {
    const orderData = this.#prepOrderData(data);
    this.logger.info("Here is your data: ", orderData);
  }

  // Private

  #prepOrderData(data) {
    const balance = this.accountService.getFuturesBalance(this.#apiConfig, "/derivatives/api/v3/accounts", "USD");
    return data.isSell ? this.#prepShortOrderData(data) : this.#prepCoverOrderData(data);
  }

  #prepShortOrderData(data) {
    return {
      symbol: data.symbol,
      side: "sell",
      orderType: "lmt",
    };
  }

  #prepCoverOrderData(data) {
    return {
      symbol: data.symbol,
      side: "buy",
      orderType: "mkt",
    };
  }
}
