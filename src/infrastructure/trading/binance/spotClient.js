// [NOTE] THE SYNTAX TO CREATE BINANCE API CALLS IS => this.client.funcName({ paramsInAnObject: paramsInAnObject })

// [NOTE] For a trade I need base symbol, quote symbol, type of trade

import { MainClient } from "binance";
import { binanceConfig } from "../../../config/binance.js";

// tradeData = {
  //   baseSymbol: baseSymbol, // BTC, ETH, etc. (What you want)
  //   quoteSymbol: quoteSymbol, // USDT, USDC, USD, etc. (What you are trading for)
  //   marketType: marketType, // SPOT || FUTURES
  //   side: side, // IN || OUT ((IN === BUY || ENTER) && (OUT === SELL || EXIT))
  //   symbol: `${baseSymbol}${quoteSymbol}`, // BTCUSDC, BTCUSDT, etc.
  //   type: type, // 'LIMIT' | 'LIMIT_MAKER' | 'MARKET' | 'STOP_LOSS' | 'STOP_LOSS_LIMIT' | 'TAKE_PROFIT' | 'TAKE_PROFIT_LIMIT'
  // };

export default class SpotClient {
  constructor() {
    this.client = new MainClient(binanceConfig);
  }

  async getPrice() {
    const priceFetch = await this.client.getSymbolPriceTicker({
      symbol: this.tradeData.symbol,
    });
    const result = priceFetch;
    return result.price;
  }

  async getQnty(symbol, price) {

  }

  // [ALERT] ONLY TEST ORDER
  async createTestSpotOrder(
    baseSymbol,
    quoteSymbol,
    symbol,
    marketType,
    side,
    type
  ) {
    const price = await this.getPrice();
    const qnty = await this.getQnty();

    await this.client
      .testNewOrder({
        side: side,
        symbol: symbol,
        type: type,
        quantity: qnty,
        price: price,
        timeInForce: "IOC",
        newOrderRespType: "FULL",
        computeCommissionRates: true,
      })
      .then((result) => {
        console.log("RESULT!!!!! => ", result);
      })
      .catch((err) => {
        console.log(err);
      });
  }
}
