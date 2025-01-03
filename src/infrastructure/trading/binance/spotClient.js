import { MainClient } from "binance";
import { binanceConfig } from "../../../config/binance.js";
import TradeValidator from "../tradeValidator.js";
import { getQuantity } from "../utils.js";
import logger from "../../logger/logger.js";

export default class SpotClient {
  constructor() {
    this.client = new MainClient(binanceConfig);
    this.validator = new TradeValidator();
  }

  async executeTrade(tradeData) {
    this.tradeData = tradeData;

    const results = await Promise.all(
      tradeData.orders.map((order) => this.createTestOrder(order))
    );
    logger.info("Results of promises => ", results);
    if (tradeData.tradeAction.match(/cover|sell/i) && !tradeData.isHalf) {
      this.#cleanUpOrders(tradeData);
    }
  }

  async openPosition(order) {
    const orderDataObj = {
      ...order,
      quantity: await getQuantity(order, false, this.tradeData.isHalf),
      newOrderRespType: "FULL",
    };

    this.client
      .submitNewOrder(orderDataObj)
      .then((result) => {
        logger.info("Result => ", result);
        return result;
      })
      .catch((err) => {
        logger.error(err);
      });
  }

  // [ALERT] ONLY TEST ORDER
  async createTestOrder(order) {
    try {
      const orderDataObj = {
        ...order,
        computeCommissionRates: true,
        newOrderRespType: "RESULT",
        quantity: await getQuantity(order, false, this.tradeData.isHalf),
      };

      orderDataObj.quantity = "100.0";

      const validatnResObj = this.validator.validateTradeData(orderDataObj);
      const validatnMsgsStr = validatnResObj.messages.join(", ");

      if (validatnResObj.result.includes(false)) {
        throw new Error(
          `Trade validation failed. Here is why: ${validatnMsgsStr}`
        );
      }

      return await this.client
        .testNewOrder(orderDataObj)
        .then((result) => {
          logger.info("RESULT!!!!! => ", result);
          return result;
        })
        .catch((err) => {
          logger.error("Fetch failure... ", err, {
            symbol: order?.symbol,
            orderType: order?.type,
            stage: err.message.includes("validation")
              ? "validation"
              : "execution",
          });
          throw err;
        });
    } catch (err) {
      logger.error("Major failure... ", err);
    }
  }

  #cleanUpOrders(tradeData) {}
}
