import TradingPort from "../../../core/ports/trading.port.js";
import FuturesAdapter from "./futures.adapter.js";
import SpotAdapter from "./spot.adapter.js";

export default class BinanceAdapter extends TradingPort {
  constructor() {
    super();
    this.spotAdapter = new SpotAdapter();
    this.futuresAdapter = new FuturesAdapter();
  }

  executeTrade(tradeData) {
    console.log("Trade data binance adapter => ", tradeData);

    return tradeData.clientType === "SPOT"
      ? this.spotAdapter.executeTrade(tradeData)
      : this.futuresAdapter.executeTrade(tradeData);
  }
}
