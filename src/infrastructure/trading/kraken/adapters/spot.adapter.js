import { krakenSpotConfig } from "../config.js";
import FilterApplicatorService from "../services/filterApplicator.service.js";

export default class KrakenSpotAdapter {
  #apiConfig = krakenSpotConfig;

  constructor(logger, apiClient, accountService) {
    this.logger = logger;
    this.apiClient = apiClient;
    this.accountService = accountService;
  }

  async placeOrder(data) {
    console.log("DATA HERE => ", data);
    const nonce = Date.now().toString();
    const orderData = await this.#prepOrderData(data);
    const formattedOrders = { ...orderData, nonce };

    console.log("Order data:", formattedOrders);
  }

  // private

  async #prepOrderData(data) {
    const pairData = await this.#getOrderData(data.universalPair);
    return data.isSell ? await this.#prepSellOrderData(data, pairData) : await this.#prepBuyOrdersData(data, pairData);
  }

  async #prepSellOrderData(data, pairData) {
    const balance = await this.accountService.getBalance(this.#apiConfig, "/0/private/Balance", data.baseAsset);
    const volume = FilterApplicatorService.calculateSellVolume(balance, pairData, data.isHalf);

    return {
      pair: data.symbol,
      ordertype: "market",
      type: "sell",
      volume,
    };
  }

  async #prepBuyOrdersData(data, pairData) {
    const [entryPrice, stopLoss, takeProfit] = this.#applyPriceFilters(pairData.priceFilters, data);
    console.log("entryPrice:", entryPrice);
    console.log("stopLoss:", stopLoss);
    console.log("takeProfit:", takeProfit);
    const balance = await this.accountService.getBalance(this.#apiConfig, "/0/private/Balance", data.quoteAsset);
    const volume = FilterApplicatorService.calculateBuyVolume(balance, data.entryPrice, pairData);

    console.log("VOLUME:", volume);

    return {
      pair: pairData.altname,
      orders: [
        // Main entry order
        {
          ordertype: "limit",
          type: "buy",
          price: entryPrice,
          volume,
        },
        // Stop loss order
        {
          ordertype: "stop-loss-limit",
          type: "sell",
          price: stopLoss,
          volume,
        },
        // Take profit order
        {
          ordertype: "take-profit-limit",
          type: "sell",
          price: takeProfit,
          volume,
        },
      ],
    };
  }

  async #getOrderData(universalPair) {
    const response = await this.apiClient.apiCall(
      { base_url: "https://api.kraken.com" },
      "GET",
      `/0/public/AssetPairs?pair=${universalPair}`,
      null,
      false
    );

    console.log("FILTERS:", response);

    const universalPairKey = Object.keys(response.result)[0];
    const pairData = response.result[universalPairKey];

    const {
      altname = "",
      lot_decimals: lotDecimals = 0,
      lot_multiplier: lotMultiplier = 1,
      tick_size: tickSize = 0,
      pair_decimals: pairDecimals = 0,
      ordermin = "0",
    } = pairData;

    return {
      altname,
      priceFilters: { tickSize, pairDecimals },
      volumeFilters: {
        lotDecimals,
        lotMultiplier,
        ordermin,
      },
    };
  }

  #applyPriceFilters(priceFilters, data) {
    const prices = [data.entryPrice, data.stopLoss, data.takeProfit]; // [WARNING] DO NOT CHANGE THE ORDER OF THE PRICES HERE
    const filteredPrices = prices.map((price) => {
      return parseFloat(price).toFixed(priceFilters.pairDecimals);
    });
    return filteredPrices;
  }
}
