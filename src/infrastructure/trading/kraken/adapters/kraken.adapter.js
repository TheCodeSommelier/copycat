export default class KrakenAdapter {
  constructor(logger, spotAdapter, futuresAdapter) {
    this.logger = logger;
    this.spotAdapter = spotAdapter;
    this.futuresAdapter = futuresAdapter;
  }

  async placeOrder(data) {
    data.isFutures ? await this.futuresAdapter.placeOrder(data) : await this.spotAdapter.placeOrder(data);
  }
}
