export default class KrakenAccountService {
  constructor(logger, apiClient) {
    this.logger = logger;
    this.apiClient = apiClient;
  }

  async getBalance(apiConfig, endpoint, asset) {
    const normalizeAsset = String(asset).trim();
    const assetKey = normalizeAsset === "USD" ? "ZUSD" : normalizeAsset;
    const apiCallBlcObj = await this.apiClient.makeApiCall(apiConfig, "POST", endpoint);
    this.logger.warn("Get balance api call result: ", apiCallBlcObj);
    const blc = apiCallBlcObj.result[assetKey];
    return parseFloat(blc);
  }

  async getFuturesBalance(apiConfig, endpoint, asset) {
    const result = await this.apiClient.makeFuturesApiCall(apiConfig, "GET", endpoint);
    const usdBlc = result.accounts.cash.balances[asset];
    return usdBlc;
  }

  async getFuturesOrders(apiConfig, symbol) {
    try {
      const response = await this.apiClient.makeFuturesApiCall(apiConfig, "GET", "/derivatives/api/v3/openorders");
      if (response.result === "success") {
        const symbolOrders = response.openOrders.filter((order) => order.symbol === symbol);
        return symbolOrders;
      } else {
        throw new Error("Cannot get open positions...");
      }
    } catch (error) {
      this.logger.error("Cannot get open positions...");
      throw error;
    }
  }

  async getFuturesPositions(apiConfig, symbol) {
    try {
      const response = await this.apiClient.makeFuturesApiCall(apiConfig, "GET", "/derivatives/api/v3/openpositions");
      if (response.result === "success") {
        const symbolPositions = response.openPositions.filter((order) => order.symbol === symbol);
        return symbolPositions;
      } else {
        throw new Error("Cannot get open positions...");
      }
    } catch (error) {
      this.logger.error("Cannot get open positions...");
      throw error;
    }
  }
}
