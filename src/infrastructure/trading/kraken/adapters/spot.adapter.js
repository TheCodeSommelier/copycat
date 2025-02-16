import { krakenSpotConfig } from "../config.js";

export default class KrakenSpotAdapter {
  #apiConfig = krakenSpotConfig;

  constructor(logger, apiClient, accountService) {
    this.logger = logger;
    this.apiClient = apiClient;
    this.accountService = accountService;
  }

  async placeOrder(data) {
    console.log("DATA HERE => ", data);
    const res = await this.accountService.getBalance(this.#apiConfig, "/0/private/Balance", "ETH");

    console.log("RESULT => ", res);
  }
}
