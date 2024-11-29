export default class TradeValidator {
  constructor(config = {}) {
    this.config = {
      baseSymbol: config.symbol,
      quoteSymbol: config.quoteSymbol,
      marketType: config.marketType,
      marketAction: config.marketAction,
    };
  }

  // CANNOT BE OVER 10%
  // HAS TO BE TO A VALID SYMBOL
  // CANNOT HAVE ANY LEVERAGE
}
