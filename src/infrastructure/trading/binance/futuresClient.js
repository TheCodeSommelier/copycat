import { USDMClient } from "binance";
import { binanceConfig } from "../../../config/binance";

export default class FuturesClient {
  constructor() {
    this.client = new USDMClient(binanceConfig);
  }
}
