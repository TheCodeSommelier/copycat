export default class KrakenFilters {
  constructor(logger, apiClient, redis) {
    this.logger = logger;
    this.apiClient = apiClient;
    this.redis = redis;
  }

  async getSpotFilters() {
    try {
      const response = await this.apiClient.makeApiCall(
        { baseUrl: "https://api.kraken.com" },
        "GET",
        `/0/public/AssetPairs`,
        null,
        false
      );

      const keys = Object.keys(response.result);
      await this.#cacheSpotPairs(response.result, keys);
    } catch (error) {}
  }

  async getFuturesFilters() {
    const response = await this.apiClient.makeFuturesApiCall(
      { baseUrl: "https://futures.kraken.com" },
      "GET",
      "/derivatives/api/v3/instruments",
      {},
      false
    );
    const { instruments } = response;
    await this.#cacheFuturesInstrument(instruments);
  }

  // Private

  async #cacheSpotPairs(pairsData, pairsSymbolsArr) {
    for (let i = 0; i < pairsSymbolsArr.length; i++) {
      let key = pairsSymbolsArr[i];
      await this.redis.set(`${key}_filter`, pairsData[key]);
    }
  }

  async #cacheFuturesInstrument(instruments) {
    for (let i = 0; i < instruments.length; i++) {
      await this.redis.set(`${instruments[i].symbol}_filter`, instruments[i], { EX: 86_400 });
    }
  }
}
