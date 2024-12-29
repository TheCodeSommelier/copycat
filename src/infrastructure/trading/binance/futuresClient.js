import { USDMClient } from "binance";
import { binanceConfig } from "../../../config/binance.js";
import { getQuantity } from "../utils.js";
import logger from "../../../services/loggerService.js";
import TradeValidator from "../tradeValidator.js";

export default class FuturesClient {
  constructor() {
    this.client = new USDMClient(binanceConfig);
    this.validator = new TradeValidator();
  }

  async enqueueFuturesOrders(tradeData) {
    this.tradeData = tradeData;
    try {
      const result = await Promise.all(
        this.tradeData.orders.map((order) => this.enqueueTestOrder(order))
      );
      return result;
    } catch (err) {
      logger.error(err);
    }
  }

  async enqueueTestOrder(order = {}) {
    try {
      const orderDataObj = {
        ...order,
        quantity: await getQuantity(order, true, this.tradeData.isHalf),
        computeCommissionRates: true,
        newOrderRespType: "RESULT",
      };

      orderDataObj.quantity = "100.0";

      const validationObjRes = this.validator.validateTradeData(orderDataObj);
      const validatnMsgsStr = validationObjRes.messages.join(", ");

      if (validationObjRes.result.includes(false)) {
        throw new Error(
          `Trade validation failed. Here is why: ${validatnMsgsStr}`
        );
      }

      return this.client
        .testOrder(orderDataObj)
        .then((result) => {
          return result;
        })
        .catch((err) => logger.info(err));
    } catch (err) {
      logger.error(err);
    }
  }
}
