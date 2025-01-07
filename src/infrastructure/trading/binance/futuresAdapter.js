import { futuresUrl, tradeIsActive } from "../../../constants.js";
import {
  binanceConfigLive,
  binanceConfigTestFutures,
} from "../../../config/binance.js";
import { getQuantity, getDataToSend, binanceApiCall } from "./utils.js";
import logger from "../../logger/logger.js";
import Trade from "../../../core/entities/trade.js";

export default class FuturesAdapter {
  constructor() {
    this.binanceConfig = tradeIsActive
      ? binanceConfigLive
      : binanceConfigTestFutures;
  }

  async executeTrade(tradeData) {
    const results = await Promise.all(
      tradeData.orders.map((order) =>
        this.#executeTestTrade(order, tradeData.isHalf)
      )
    );
    logger.info("Results of promises => ", results);
    if (tradeData.tradeAction.match(/cover|sell/i) && tradeData.isHalf) {
      // Retrieve remaining orders
      // Make the calc on current supply of USDT
      // Update orders witht the new quantity
    } else {
      // Delete orders with the symbol
    }
    return results;
  }

  // Private

  async #executeTestTrade(order, isHalf) {
    try {
      const orderDataObj = {
        ...order,
        quantity: await getQuantity(order, true, isHalf, this.client),
        computeCommissionRates: true,
        newOrderRespType: "RESULT",
        timestamp: Date.now(),
      };

      orderDataObj.quantity = "100.0";

      Trade.validateQuantityQuoteAsset(orderDataObj.quantity);

      const { queryString, signature } = getDataToSend(
        orderDataObj,
        this.binanceConfig.api_secret
      );

      return await binanceApiCall(
        `${futuresUrl}/fapi/v1/order/test?${queryString}&signature=${signature}`,
        "POST",
        {
          "X-MBX-APIKEY": this.binanceConfig.api_key,
          "Content-Type": "application/json",
        }
      );
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }
}
