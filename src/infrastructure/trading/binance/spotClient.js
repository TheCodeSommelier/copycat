import { MainClient } from "binance";
import { binanceConfig } from "../../../config/binance.js";
import TradeValidator from "../tradeValidator.js";
import { getQuantity } from "../utils.js";

export default class SpotClient {
  constructor() {
    this.client = new MainClient(binanceConfig);
    this.validator = new TradeValidator();
  }

  async executeTrade(tradeData) {
    const results = await Promise.all(
      tradeData.orders.map((order) => this.createTestOrder(order))
    );
    console.log("Results of promises => ", results);
  }

  enqueueBuyOrders() {}

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
          console.log("RESULT!!!!! => ", result);
          return result;
        })
        .catch((err) => {
          console.log(err);
        });
    } catch (err) {
      console.error(err);
      console.log(err);
    }
  }
}
