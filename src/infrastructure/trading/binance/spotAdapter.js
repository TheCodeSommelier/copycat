import { tradeIsActive, spotUrl } from "../../../constants.js";
import {
  binanceConfigLive,
  binanceConfigTestSpot,
} from "../../../config/binance.js";
import { getQuantity, getDataToSend, binanceApiCall } from "./utils.js";
import logger from "../../logger/logger.js";
import dotenv from "dotenv";
import Trade from "../../../core/entities/trade.js";
dotenv.config();

export default class SpotAdapter {
  constructor() {
    this.binanceConfig = tradeIsActive
      ? binanceConfigLive
      : binanceConfigTestSpot;
  }

  async executeTrade(tradeData) {
    const results = await Promise.all(
      tradeData.orders.map((order) =>
        this.#executeTestTrade(order, tradeData.isHalf)
      )
    );
    logger.info("Results of promises => ", results);
    if (tradeData.tradeAction.match(/cover|sell/i) && tradeData.isHalf) {
      // updateOrderQuantity
    } else {
      // cleanUpOrders
    }
  }

  async #openPosition(order, isHalf) {
    try {
      const orderDataObj = {
        ...order,
        quantity: await getQuantity(order, false, isHalf),
        newOrderRespType: "FULL",
        timestamp: Date.now(),
      };

      Trade.validateQuantityQuoteAsset(orderDataObj.quantity);

      const { queryString, signature } = getDataToSend(
        orderDataObj,
        this.binanceConfig.api_secret
      );

      return await binanceApiCall(
        `${spotUrl}/api/v3/order/test?${queryString}&signature=${signature}`,
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

  async #executeTestTrade(order, isHalf) {
    try {
      const orderDataObj = {
        ...order,
        computeCommissionRates: true,
        newOrderRespType: "RESULT",
        quantity: await getQuantity(order, false, isHalf),
        timestamp: Date.now(),
      };

      orderDataObj.quantity = "100.0";

      Trade.validateQuantityQuoteAsset(orderDataObj.quantity);

      const { queryString, signature } = getDataToSend(
        orderDataObj,
        this.binanceConfig.api_secret
      );

      return await binanceApiCall(
        `${spotUrl}/api/v3/order/test?${queryString}&signature=${signature}`,
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
