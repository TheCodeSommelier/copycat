import { USDMClient } from "binance";
import { binanceConfig } from "../../../config/binance.js";

export default class FuturesClient {
  constructor() {
    this.client = new USDMClient(binanceConfig);
  }

  createTestFuturesOrder() {
    const futureOrderDataObj = {
      side: side,
      symbol: symbol,
      type: "LIMIT"
    }
    this.client.testOrder(futureOrderDataObj)
  }
}
