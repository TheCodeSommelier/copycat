import { tradeIsActive, spotUrl } from "../../../constants.js";
import {
  binanceConfigLive,
  binanceConfigTestSpot,
} from "./binance.config.js";
import { getQuantity, getDataToSend } from "./utils.js";
import BinanceAdapter from "./binance.adapter.js";
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
    const entryOrder = tradeData.orders.filter(
      (order) => order.type === "MARKET" || order.type === "LIMIT"
    )[0];
    const quantity = await getQuantity(
      tradeData.baseAsset,
      entryOrder,
      false,
      tradeData.isHalf
    );

    const results = await Promise.all(
      tradeData.orders.map((order) => {
        const orderWithQuantity = { ...order, quantity };
        return this.#executeLiveTrade(orderWithQuantity);
      })
    );
    logger.info("Results of promises => ", results);

    if (!tradeData.tradeAction.match(/cover|sell/i)) return;

    this.#cleanUpOrders(tradeData);
  }

  // Private

  async #executeLiveTrade(order) {
    try {
      const orderDataObj = {
        ...order,
        newOrderRespType: "RESULT",
        timestamp: Date.now(),
      };

      Trade.validateQuantityQuoteAsset(orderDataObj.quantity);

      const { queryString, signature } = getDataToSend(
        orderDataObj,
        this.binanceConfig.api_secret
      );

      return await BinanceAdapter.binanceApiCall(
        `${spotUrl}/api/v3/order?${queryString}&signature=${signature}`,
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

  async #cancelRemainingOrders(tradeData) {
    const { queryString, signature } = getDataToSend(
      {
        symbol: tradeData.symbol,
        timestamp: Date.now(),
      },
      this.binanceConfig.api_secret
    );

    return BinanceAdapter.binanceApiCall(
      `${spotUrl}/api/v3/openOrders?${queryString}&signature=${signature}`,
      "DELETE",
      {
        "X-MBX-APIKEY": this.binanceConfig.api_key,
        "Content-Type": "application/json",
      }
    );
  }

  async #updateOrderQuantity(order) {
    const { queryString, signature } = getDataToSend(
      {
        ...order,
        quantity: await getQuantity(order, false, false),
        cancelReplaceMode: "STOP_ON_FAILURE",
        cancelRestrictions: "ONLY_NEW",
        timestamp: Date.now(),
      },
      this.binanceConfig.api_secret
    );

    return BinanceAdapter.binanceApiCall(
      `${spotUrl}/api/v3/order/cancelReplace?${queryString}&signature=${signature}`,
      "POST",
      {
        "X-MBX-APIKEY": this.binanceConfig.api_key,
        "Content-Type": "application/json",
      }
    );
  }

  async #cleanUpOrders(tradeData) {
    if (tradeData.isHalf) {
      const results = await Promise.all(
        tradeData.orders.map((order) =>
          this.#updateOrderQuantity(order, tradeData.symbol)
        )
      );
      logger.info("Results of clean up promises => ", results);
    } else {
      const result = this.#cancelRemainingOrders(tradeData);
      logger.info("Results of clean up promise => ", result);
    }
  }
}
