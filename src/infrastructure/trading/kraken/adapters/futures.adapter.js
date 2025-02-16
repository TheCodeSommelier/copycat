import { krakenFuturesConfig } from "../config.js";

export default class KrakenFuturesAdapter {
  #apiConfig = krakenFuturesConfig;

  constructor(logger, apiClient, accountService) {
    this.logger = logger;
    this.apiClient = apiClient;
    this.accountService = accountService;
  }

  async placeOrder(data) {
    console.log("DATA HERE => ", data);
  }
}
