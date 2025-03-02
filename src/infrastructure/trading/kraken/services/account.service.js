export default class KrakenAccountService {
  constructor(logger, apiClient) {
    this.logger = logger;
    this.apiClient = apiClient;
  }

  async getBalance(apiConfig, endpoint, asset) {
    const normalizeAsset = String(asset).trim();
    const assetKey = normalizeAsset === "USD" ? "ZUSD" : normalizeAsset;
    const apiCallBlcObj = await this.apiClient.makeApiCall(apiConfig, "POST", endpoint);
    const blc = apiCallBlcObj.result[assetKey];
    return parseFloat(blc);
  }

  async getFuturesBalance(apiConfig, endpoint, asset) {
    const result = this.apiClient.makeApiCall(apiConfig, "GET", endpoint);
    // const usdBlc = result.accounts.cash.balances[asset];
    this.logger.warn("Get balance api res:", result);
  }
}
