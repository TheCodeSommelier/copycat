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
    this.#setLeverage(tradeData.symbol);
    const entryOrder = tradeData.orders[0];
    const quantity = await getQuantity(
      tradeData.baseAsset,
      entryOrder,
      true,
      tradeData.isHalf
    );
    const results = await Promise.all(
      tradeData.orders.map((order) => {
        const formattedOrder = { ...order, quantity };
        return this.#executeLiveTrade(formattedOrder);
      })
    );
    logger.info("Results of promises => ", results);

    if (!tradeData.tradeAction.match(/cover|sell/i)) return;

    if (tradeData.isHalf) {
      this.#updateOrderQty(tradeData.symbol);
    } else {
      const result = this.#cleanUpOrders(tradeData.symbol);
      logger.info("Result of clean up => ", result);
    }
    return results;
  }

  // Private

  /**
   * Sets the leverage to 1x meaning no leverage.
   * @param {String} symbol
   * @private
   */
  async #setLeverage(symbol) {
    try {
      const data = {
        symbol,
        leverage: 1,
        timestamp: Date.now(),
      };

      const { queryString, signature } = getDataToSend(
        data,
        this.binanceConfig.api_secret
      );

      await binanceApiCall(
        `${futuresUrl}/fapi/v1/leverage?${queryString}&signature=${signature}`,
        "POST",
        {
          "X-MBX-APIKEY": this.binanceConfig.api_key,
          "Content-Type": "application/json",
        }
      );
    } catch (error) {
      logger.error("Binance leverage error: ", error);
      throw error;
    }
  }

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

      return await binanceApiCall(
        `${futuresUrl}/fapi/v1/order?${queryString}&signature=${signature}`,
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

  async #cleanUpOrders(symbol) {
    const orderDataObj = {
      symbol,
      timestamp: Date.now(),
    };

    const { queryString, signature } = getDataToSend(
      orderDataObj,
      this.binanceConfig.api_secret
    );

    return await binanceApiCall(
      `${futuresUrl}/fapi/v1/allOpenOrders?${queryString}&signature=${signature}`,
      "DELETE",
      {
        "X-MBX-APIKEY": this.binanceConfig.api_key,
        "Content-Type": "application/json",
      }
    );
  }

  async #updateOrderQty(symbol) {
    const orderDataObj = {
      symbol,
      timestamp: Date.now(),
    };

    const { queryString, signature } = getDataToSend(
      orderDataObj,
      this.binanceConfig.api_secret
    );

    const ordersData = await binanceApiCall(
      `${futuresUrl}/fapi/v1/openOrders?${queryString}&signature=${signature}`,
      "GET",
      {
        "X-MBX-APIKEY": this.binanceConfig.api_key,
        "Content-Type": "application/json",
      }
    );

    const orders = ordersData.filter(
      (order) =>
        order.type !== "LIMIT" &&
        order.type !== "MARKET" &&
        order.symbol === symbol
    );

    await this.#cleanUpOrders(symbol);

    const preparedOrders = await this.#prepOrders(orders, symbol);
    if (preparedOrders) await this.executeTrade(preparedOrders);
  }

  async #prepOrders(orders, symbol) {
    if (!orders?.length) {
      logger.warn("No orders to prepare");
      return null;
    }

    if (orders.some((order) => !order.side || !order.type)) {
      throw new Error("Invalid order format");
    }

    return {
      symbol,
      clientType: "FUTURES",
      baseAsset: symbol.slice(0, -4),
      quoteAsset: "USDT",
      tradeAction: "SHORT",
      isHalf: true,
      orders: orders.map((order) => ({
        symbol,
        side: order.side,
        type: order.type,
        stopPrice: order.stopPrice,
        computeCommissionRates: true,
        newOrderRespType: "RESULT",
        timestamp: Date.now(),
      })),
    };
  }
}
