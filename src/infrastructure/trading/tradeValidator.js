export default class TradeValidator {
  validateTradeData(tradeData) {
    this.result = [];
    this.messages = [];

    this.validateSide(tradeData);
    this.validateQuantityQuoteAsset(tradeData);
    return { result: this.result, messages: this.messages };
  }

  validateQuantityQuoteAsset(tradeData) {
    if (
      parseFloat(tradeData.quantity) > 0 &&
      typeof tradeData.quantity === "string"
    ) {
      this.result.push(true);
      return;
    }
    this.messages.push(
      "Qty needs to be higher than 0 and needs to be a string!"
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

  validateType(tradeData) {
    if (
      tradeData.type.test(
        /LIMIT|STOP_LOSS|STOP_MARKET|TAKE_PROFIT_MARKET|TAKE_PROFIT|MARKET/g
      ) &&
      typeof tradeData.type === "string"
    ) {
      this.result.push(true);
      return;
    }
    this.messages.push(
      "Type needs to be either LIMIT, STOP_LOSS, STOP_MARKET, TAKE_PROFIT_MARKET, TAKE_PROFIT or MARKET and needs to be a string!"
    );
    this.result.push(false);
  }
}
