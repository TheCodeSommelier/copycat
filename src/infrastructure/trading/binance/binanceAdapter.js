import TradingPort from "../../../core/ports/tradingPort.js";
import FuturesAdapter from "./futuresAdapter.js";
import SpotAdapter from "./spotAdapter.js";

export default class BinanceAdapter extends TradingPort {
  constructor() {
    super();
    this.spotAdapter = new SpotAdapter();
    this.futuresAdapter = new FuturesAdapter();
  }

  async executeTrade(tradeData) {
    console.log(tradeData);

    return tradeData.clientType === "SPOT"
      ? this.spotAdapter.executeTrade(tradeData)
      : this.futuresAdapter.executeTrade(tradeData);
  }
}
