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

  executeSellOrder() {
    // First Market order to sell/cover
    // Cancel all orders on this symbol to clean stop loss, targets, entries, etc.
  }

  // [ALERT] ONLY TEST ORDER
  async createTestOrder(order) {
    try {
      const orderDataObj = {
        ...order,
        computeCommissionRates: true,
        newOrderRespType: "RESULT",
        quantity: await getQuantity(order, this.client, false),
      };

      console.log("Qnty => ", orderDataObj.quantity);


      if (orderDataObj.quantity == 0) orderDataObj.quantity = "100.0";


      // const validatnResObj = this.validator.validateSpotTradeData(orderDataObj);
      // const validatnMsgsStr = validatnResObj.messages.join(", ");

      // if (validatnResObj.result.includes(false)) {
      //   throw new Error(
      //     `Trade validation failed. Here is why: ${validatnMsgsStr}`
      //   );
      // }

      await this.client
        .testNewOrder(orderDataObj)
        .then((result) => {
          console.log("RESULT!!!!! => ", result);
        })
        .catch((err) => {
          console.log(err);
        });
    } catch (err) {
      console.error(err);
      console.log(err);
    }
  }

  // async #getQnty(quoteAsset) {
  //   try {
  //     // Gets the balance of the coin you are buving for (USDT)
  //     const quoteAssetsArr = await this.client.getUserAsset({
  //       asset: quoteAsset,
  //       timestamp: Date.now,
  //     });

  //     const quoteAssetObj = quoteAssetsArr
  //       .filter((assetObj) => {
  //         assetObj.asset === quoteAsset;
  //       })
  //       .map((assetObj) => {
  //         return assetObj;
  //       });

  //     const tenPercentOfAsset = quoteAssetsArr.length === 0 ? 0.0 : parseInt(quoteAssetObj.free) * 0.1; // 10% of total balance
  //     return tenPercentOfAsset.toString();
  //   } catch (err) {
  //     console.error(err);
  //   }
  // }
}
