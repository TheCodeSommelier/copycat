export default class TradeValidator {
  validateSpotTradeData(tradeData) {
    this.result = [];
    this.messages = [];

    this.validateSide(tradeData);
    this.validateQuantityQuoteAsset(tradeData);
    return { result: this.result, messages: this.messages };
  }

  validateQuantityQuoteAsset(tradeData) {
    if (
      parseFloat(tradeData.quoteOrderQty) > 0 &&
      typeof tradeData.quoteOrderQty === "string"
    ) {
      this.result.push(true);
      return;
    }
    this.messages.push(
      "Quote Order Qty needs to be higher than 0 and needs to be a string!"
    );
    this.result.push(false);
  }

  validateSide(tradeData) {
    if (
      (tradeData.side === "SELL" || tradeData.side === "BUY") &&
      typeof tradeData.side === "string"
    ) {
      this.result.push(true);
      return;
    }
    this.messages.push(
      "Side needs to be either BUY or SELL and needs to be a string!"
    );
    this.result.push(false);
  }
}
