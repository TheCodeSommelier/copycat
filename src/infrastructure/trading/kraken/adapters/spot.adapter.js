import { krakenSpotConfig } from "../config.js";
import FilterApplicatorService from "../services/filterApplicator.service.js";

export default class KrakenSpotAdapter {
  #apiConfig = krakenSpotConfig;

  constructor(logger, apiClient, accountService, redis) {
    this.logger = logger;
    this.apiClient = apiClient;
    this.accountService = accountService;
    this.redis = redis;
  }

  async placeOrder(tradeInstace) {
    const orderData = await this.#prepOrderData(tradeInstace);
    console.log("Order data:", orderData);
    try {
      const result = await this.apiClient.makeApiCall(this.#apiConfig, "POST", "/0/private/AddOrder", orderData, true);
      this.logger.info("An order was placed: ", result);

      if (!orderData.isSell) {
        const dataToSave = { id: result.result.txid[0], ...orderData, created_at: Date.now() };
        this.redis.saveOrderData(dataToSave);
      }

      return result;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  // private

  async #prepOrderData(tradeInstace) {
    const pairData = await this.#getOrderData(tradeInstace.symbol);

    return tradeInstace.isSell
      ? await this.#prepSellOrderData(tradeInstace, pairData)
      : await this.#prepBuyOrdersData(tradeInstace, pairData);
  }

  async #prepSellOrderData(tradeInstace, pairData) {
    const balance = await this.accountService.getBalance(this.#apiConfig, "/0/private/Balance", tradeInstace.baseAsset);
    const volume = FilterApplicatorService.calculateSellVolume(balance, pairData.volumeFilters, tradeInstace.isHalf);

    return {
      pair: tradeInstace.symbol,
      ordertype: "market",
      type: "sell",
      volume,
    };
  }

  async #prepBuyOrdersData(tradeInstace, pairData) {
    const [entryPrice, stopLossPrice, takeProfitPrice] = FilterApplicatorService.applyPriceFilters(
      pairData.priceFilters,
      tradeInstace
    );
    const balance = await this.accountService.getBalance(
      this.#apiConfig,
      "/0/private/Balance",
      tradeInstace.quoteAsset
    );
    const volume = FilterApplicatorService.calculateBuyVolume(balance, tradeInstace.entryPrice, pairData.volumeFilters);

    return {
      price: entryPrice,
      pair: tradeInstace.symbol,
      ordertype: "limit",
      type: "buy",
      volume,
      "close[ordertype]": "stop-loss",
      "close[price]": stopLossPrice,
    };
  }

  async #getOrderData(symbol) {
    const response = await this.apiClient.makeApiCall(
      { baseUrl: "https://api.kraken.com" },
      "GET",
      `/0/public/AssetPairs?pair=${symbol}`,
      null,
      false
    );

    const symbolKey = Object.keys(response.result)[0];

    const pairData = response.result[symbolKey];
    const { altname, lot_decimals, lot_multiplier, tick_size, pair_decimals, ordermin } = pairData;

    return {
      altname,
      priceFilters: { tick_size, pair_decimals },
      volumeFilters: {
        lot_decimals,
        lot_multiplier,
        ordermin,
      },
    };
  }
}
