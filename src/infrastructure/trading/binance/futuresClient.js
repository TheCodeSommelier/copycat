import { USDMClient } from "binance";
import { binanceConfig } from "../../../config/binance.js";
import { getQuantity } from "../utils.js";

export default class FuturesClient {
  constructor() {
    this.client = new USDMClient(binanceConfig);
  }

  async enqueueFuturesOrders(tradeData) {
    this.tradeData = tradeData;
    try {
      const result = await Promise.all(
        this.tradeData.orders.map((order) => this.enqueueTestOrder(order))
      );
      return result;
    } catch (err) {
      console.log(err);
    }
  }

  async enqueueTestOrder(order = {}) {
    try {
      const orderData = {
        ...order,
        quantity: await getQuantity(order, this.client, true),
        computeCommissionRates: true,
        newOrderRespType: "RESULT",
      };

      console.log("Qnty => ", orderData);

      if (orderData.quantity == 0) orderData.quantity = "100.0";

      // const validatnResObj = this.validator.validateSpotTradeData(tradeDataObj); // Needs to be different for futures
      // const validatnMsgsStr = validatnResObj.messages.join(", ");

      // if (validatnResObj.result.includes(false)) {
      //   throw new Error(
      //     `Trade validation failed. Here is why: ${validatnMsgsStr}`
      //   );
      // }

      return this.client
        .testOrder(orderData)
        .then((result) => {
          return result;
        })
        .catch((err) => console.log(err));
    } catch (err) {
      console.log(err);
    }
  }
}
