// [NOTE] THE SYNTAX TO CREATE BINANCE API CALLS IS => this.client.funcName({ paramsInAnObject: paramsInAnObject })

// [NOTE] For a trade I need base symbol, quote symbol, type of trade

import { MainClient } from "binance";
import { binanceConfig } from "../../../config/binance.js";
import TradeValidator from "../tradeValidator.js";

export default class SpotClient {
  constructor() {
    this.client = new MainClient(binanceConfig);
    this.validator = new TradeValidator();
  }

  executeTrade(tradeData = {}) {
    // const tradeType = this.#chooseTradeType(tradeData);
  }

  executeBuyOrder() {

  }

  executeSellOrder() {
    // First Market order to sell/cover
    // Cancel all orders on this symbol to clean stop loss targets entries etc.
  }

  // [ALERT] ONLY TEST ORDER
  async createTestOrder(tradeData = {}) {
    const symbol = `${tradeData.baseAsset}${tradeData.quoteAsset}`; // When buying BTC symbol === "BTCUSDT"
    console.log("Symbol: ", symbol);

    try {
      const price = await this.getPrice(symbol);
      console.log("Price works");

      // const qntyQuoteAsset = await this.#getQnty(price, tradeData.quoteAsset);

      const tradeDataObj = {
        side: tradeData.side,
        symbol: symbol,
        type: tradeData.type,
        quoteOrderQty: qntyQuoteAsset,
        newOrderRespType: "RESULT",
        computeCommissionRates: true,
      };

      console.log("Before testing purposes change => ", tradeDataObj);

      tradeDataObj.quoteOrderQty = "100.0";

      console.log("After testing purposes change => ", tradeDataObj);

      const validatnResObj = this.validator.validateSpotTradeData(tradeDataObj);
      const validatnMsgsStr = validatnResObj.messages.join(", ");

      if (validatnResObj.result.includes(false)) throw new Error(`Trade validation failed. Here is why: ${validatnMsgsStr}`);

      await this.client
        .testNewOrder(tradeDataObj)
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

  // async getPrice(symbol) {
  //   try {
  //     const priceFetch = await this.client.getSymbolPriceTicker({
  //       symbol: symbol,
  //     });
  //     return parseFloat(priceFetch.price);
  //   } catch (err) {
  //     console.log(err);
  //   }
  // }

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
