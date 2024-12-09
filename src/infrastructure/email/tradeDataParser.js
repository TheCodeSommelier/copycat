// Define constants for better maintainability
const ORDER_TYPES = {
  ENTRY: {
    FUTURES: "LIMIT",
    SPOT: "LIMIT"
  },
  STOP: {
    FUTURES: "STOP_MARKET",
    SPOT: "STOP_LOSS"
  },
  EXIT: {
    FUTURES: "TAKE_PROFIT_MARKET",
    SPOT: "TAKE_PROFIT"
  }
};

const TRADE_SIDES = {
  BUY: "BUY",
  SELL: "SELL",
  SHORT: "SHORT",
  COVER: "COVER"
};

const CLIENT_TYPES = {
  FUTURES: "FUTURES",
  SPOT: "SPOT"
};

export default class TradeDataExtractor {
  // Price extraction patterns
  static PRICE_PATTERNS = {
    ENTRY: /Entry:\s+\$([0-9,]+(?:\.\d+)?)/i,
    STOP: /Stop:\s+\$([0-9,]+(?:\.\d+)?)/i,
    TARGET: /Target:\s+\$([0-9,]+(?:\.\d+)?)/i,
    SYMBOL: /(\p{Lu}+)\/(\p{Lu}+)/gu,
    SIDE: /short|buy|sell|cover/gi,
    HALF: /half/gi
  };

  static extractTradeData(validatedEmail) {
    try {
      const { subject, html } = validatedEmail;
      const side = this.extractSide(subject);
      const symbol = this.extractSymbol(subject);
      const isFutures = this.isFuturesTrade(side);
      const isShort = side === TRADE_SIDES.SHORT;

      // Base trade data
      const tradeData = {
        symbol,
        clientType: isFutures ? CLIENT_TYPES.FUTURES : CLIENT_TYPES.SPOT
      };

      // Handle market orders (SELL/COVER)
      if (this.isMarketOrder(side)) {
        return {
          ...tradeData,
          side: TRADE_SIDES.SELL,
          type: "MARKET",
          isHalf: this.isHalf(subject),
          order: this.createCloseOrder({
            symbol,
            html,
            isFutures,
            isShort,
            subject
          }),
        };
      }

      // Handle limit orders (BUY/SHORT)
      return {
        ...tradeData,
        ...this.extractPrices(html),
        orders: this.createOrders({
          symbol,
          html,
          isFutures,
          isShort,
          subject
        })
      };
    } catch (error) {
      throw new Error(`Failed to extract trade data: ${error.message}`);
    }
  }

  static createCloseOrder({ symbol, html, isFutures, isShort, subject }) {
    return {
      symbol,
      type: "MARKET",
      side: isShort ? TRADE_SIDES.BUY : TRADE_SIDES.SELL
    }
  }

  static createOrders({ symbol, html, isFutures, isShort, subject }) {
    const prices = this.extractPrices(html);

    return [
      this.createEntryOrder({ symbol, price: prices.entryPrice, isFutures, isShort }),
      this.createStopOrder({ symbol, price: prices.stopLoss, isFutures, isShort }),
      this.createExitOrder({ symbol, price: prices.targetPrice, isFutures, isShort })
    ];
  }

  static createEntryOrder({ symbol, price, isFutures, isShort }) {
    const orderData = {
      symbol,
      type: ORDER_TYPES.ENTRY[isFutures ? 'FUTURES' : 'SPOT'],
      price,
      timeInForce: "GTC",
      side: isShort ? TRADE_SIDES.SELL : TRADE_SIDES.BUY
    };

    if (isShort) {
      orderData.positionSide = "SHORT";
    }

    return orderData;
  }

  static createStopOrder({ symbol, price, isFutures, isShort }) {
    return {
      symbol,
      type: ORDER_TYPES.STOP[isFutures ? 'FUTURES' : 'SPOT'],
      stopPrice: price,
      side: isShort ? TRADE_SIDES.BUY : TRADE_SIDES.SELL,
      ...(isFutures && { closePosition: true })
    };
  }

  static createExitOrder({ symbol, price, isFutures, isShort }) {
    return {
      symbol,
      type: ORDER_TYPES.EXIT[isFutures ? 'FUTURES' : 'SPOT'],
      stopPrice: price,
      side: isShort ? TRADE_SIDES.BUY : TRADE_SIDES.SELL,
      ...(isFutures && { closePosition: true })
    };
  }

  static extractPrices(html) {
    return {
      entryPrice: this.extractPrice(html, 'ENTRY'),
      stopLoss: this.extractPrice(html, 'STOP'),
      targetPrice: this.extractPrice(html, 'TARGET')
    };
  }

  static extractPrice(html, priceType) {
    const match = html.replace(/confirmation\s+\w+/gi, '')
                     .match(this.PRICE_PATTERNS[priceType]);

    if (!match?.[1]) {
      throw new Error(`Failed to extract ${priceType} price`);
    }

    return parseFloat(match[1].replace(/[,$]/g, ''));
  }

  static extractSymbol(subject) {
    const match = subject.match(this.PRICE_PATTERNS.SYMBOL);
    if (!match?.[0]) {
      throw new Error('Failed to extract symbol');
    }

    const [baseAsset, quoteAsset] = match[0].split('/');
    return `${baseAsset}${quoteAsset === 'USD' ? 'USDT' : quoteAsset}`;
  }

  static extractSide(subject) {
    const match = subject.match(this.PRICE_PATTERNS.SIDE);
    if (!match?.[0]) {
      throw new Error('Failed to extract trade side');
    }
    return match[0].toUpperCase();
  }

  static isHalf(subject) {
    return this.PRICE_PATTERNS.HALF.test(subject);
  }

  static isFuturesTrade(side) {
    return [TRADE_SIDES.SHORT, TRADE_SIDES.COVER].includes(side);
  }

  static isMarketOrder(side) {
    return [TRADE_SIDES.SELL, TRADE_SIDES.COVER].includes(side);
  }
}
