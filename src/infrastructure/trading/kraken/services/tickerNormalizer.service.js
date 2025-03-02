export default class TickerNormalizer {
  constructor(logger, apiClient) {
    this.logger = logger;
    this.apiClient = apiClient;
  }

  async normalizeSpotBaseAsset(baseAsset) {
    const apiConfig = { baseUrl: "https://api.kraken.com" };
    const ccyData = await this.apiClient.makeApiCall(apiConfig, "GET", `/0/public/Assets?asset=${baseAsset}`, null, false);
    const keys = Object.keys(ccyData.result);
    return ccyData.result[keys[0]].altname;
  }

  async normalizeContractSymbol(baseAsset) {
    try {
      let contractAsset = baseAsset === "BTC" ? "XBT" : baseAsset;
      const apiConfig = { baseUrl: "https://futures.kraken.com" };
      const contractData = await this.apiClient.makeApiCall(
        apiConfig,
        "GET",
        `/derivatives/api/v3/tickers/PF_${contractAsset}USD`,
        null,
        false
      );

      if (contractData.ticker.pair.split(":")[0] !== contractAsset) {
        throw new Error("Wrong asset...");
      }

      return contractData.ticker.symbol;
    } catch (error) {
      this.logger.error("Currency normalizer: ", error);
      throw error;
    }
  }
}
