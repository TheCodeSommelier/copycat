import Trade from "../entities/trade.js";
import logger from "../../infrastructure/logger/logger.js";
import { formatPrice } from "../../infrastructure/trading/binance/utils.js";

const ORDER_TYPES = {
  ENTRY: {
    FUTURES: "LIMIT",
    SPOT: "LIMIT",
  },
  STOP: {
    FUTURES: "STOP_MARKET",
    SPOT: "STOP_LOSS",
  },
  EXIT: {
    FUTURES: "TAKE_PROFIT_MARKET",
    SPOT: "TAKE_PROFIT",
  },
};

const TRADE_SIDES = {
  BUY: "BUY",
  SELL: "SELL",
  SHORT: "SHORT",
  COVER: "COVER",
};

const CLIENT_TYPES = {
  FUTURES: "FUTURES",
  SPOT: "SPOT",
};

const PRICE_PATTERNS = {
  ENTRY: /Entry:\s+\$([0-9,]+(?:\.\d+)?)/i,
  STOP: /Stop:\s+\$([0-9,]+(?:\.\d+)?)/i,
  TARGET: /Target:\s+\$([0-9,]+(?:\.\d+)?)/i,
  SYMBOL: /(\p{Lu}+)\/(\p{Lu}+)/gu,
  SIDE: /short|buy|sell|cover/gi,
};

export default class TradeParser {
  async extractTradeData(email) {
    try {
      const subject = email.getSubject();
      const html = email.getHtml();
      const side = this.extractSide(subject);
      const tradeSymbols = this.extractSymbol(subject);
      const symbol = tradeSymbols.symbol;
      const isFutures = this.isFuturesTrade(side);
      const isShort = side === TRADE_SIDES.SHORT;

      // Base trade data
      const tradeData = {
        ...tradeSymbols,
        clientType: isFutures ? CLIENT_TYPES.FUTURES : CLIENT_TYPES.SPOT,
        tradeAction: side,
      };

      // Handle market orders (SELL/COVER)
      if (this.isMarketOrder(side)) {
        return new Trade({
          ...tradeData,
          side: isFutures ? TRADE_SIDES.BUY : TRADE_SIDES.SELL,
          type: "MARKET",
          isHalf: this.isHalf(subject),
          orders: this.createCloseOrder({
            symbol,
            isFutures,
          }),
        });
      }

      const rawPrices = this.extractPrices(html);

      // Format all prices in parallel
      const [entryPrice, stopLoss, targetPrice] = await Promise.all([
        formatPrice(symbol, isFutures, rawPrices.entryPrice),
        formatPrice(symbol, isFutures, rawPrices.stopLoss),
        formatPrice(symbol, isFutures, rawPrices.targetPrice)
      ]);

      this.formattedPrices = {
        entryPrice: parseFloat(entryPrice),
        stopLoss: parseFloat(stopLoss),
        targetPrice: parseFloat(targetPrice)
      };

      // Handle limit orders (BUY/SHORT)
      return new Trade({
        ...tradeData,
        ...this.formattedPrices,
        orders: this.createOrders({
          symbol,
          html,
          isFutures,
          isShort,
        }),
      });
    } catch (error) {
      logger.error(error)
    }
  }

  /**
   * Creates an array with one order to cover or sell open postions on the symbol
   * @param {String} symbol - Symbol of the traded base and quote asset
   * @param {Boolean} isFutures - True if trade is futures trade (Short or Cover)
   * @returns {Array} - Returns an array of single order, because clients use .map to process orders.
   */
  createCloseOrder({ symbol, isFutures }) {
    return [
      {
        symbol,
        type: "MARKET",
        side: isFutures ? TRADE_SIDES.BUY : TRADE_SIDES.SELL,
      },
    ];
  }

  createOrders({ symbol, isFutures, isShort }) {
    return [
      this.createEntryOrder({
        symbol,
        price: this.formattedPrices.entryPrice,
        isFutures,
        isShort,
      }),
      this.createStopOrder({
        symbol,
        price: this.formattedPrices.stopLoss,
        isFutures,
        isShort,
      }),
      this.createExitOrder({
        symbol,
        price: this.formattedPrices.targetPrice,
        isFutures,
        isShort,
      }),
    ];
  }

  createEntryOrder({ symbol, price, isFutures, isShort }) {
    const orderData = {
      symbol,
      type: ORDER_TYPES.ENTRY[isFutures ? "FUTURES" : "SPOT"],
      price,
      timeInForce: "GTC",
      side: isShort ? TRADE_SIDES.SELL : TRADE_SIDES.BUY,
    };

    return orderData;
  }

  createStopOrder({ symbol, price, isFutures, isShort }) {
    return {
      symbol,
      type: ORDER_TYPES.STOP[isFutures ? "FUTURES" : "SPOT"],
      stopPrice: price,
      side: isShort ? TRADE_SIDES.BUY : TRADE_SIDES.SELL,
      ...(isFutures && { closePosition: true }),
    };
  }

  createExitOrder({ symbol, price, isFutures, isShort }) {
    return {
      symbol,
      type: ORDER_TYPES.EXIT[isFutures ? "FUTURES" : "SPOT"],
      stopPrice: price,
      side: isShort ? TRADE_SIDES.BUY : TRADE_SIDES.SELL,
      ...(isFutures && { closePosition: true }),
    };
  }

  extractPrices(html) {
    return {
      entryPrice: this.extractPrice(html, "ENTRY"),
      stopLoss: this.extractPrice(html, "STOP"),
      targetPrice: this.extractPrice(html, "TARGET"),
    };
  }

  extractPrice(html, priceType) {
    const match = html
      .replace(/confirmation\s+\w+/gi, "")
      .match(PRICE_PATTERNS[priceType]);

    if (!match?.[1]) {
      throw new Error(`Failed to extract ${priceType} price`);
    }

    return parseFloat(match[1].replace(/[,$]/g, ""));
  }

  extractSymbol(subject) {
    const match = subject.match(PRICE_PATTERNS.SYMBOL);

    if (!match || !match[0]) {
      throw new Error("Failed to extract symbol");
    }

    const [baseAsset, quoteAsset] = match[0].split("/");
    return {
      symbol: `${baseAsset}${quoteAsset === "USD" ? "USDT" : quoteAsset}`,
      baseAsset,
      quoteAsset: `${quoteAsset === "USD" ? "USDT" : quoteAsset}`,
    };
  }

  extractSide(subject) {
    const match = subject.match(PRICE_PATTERNS.SIDE);

    if (!match || !match[0]) {
      throw new Error("Failed to extract trade side");
    }

    return match[0].toUpperCase();
  }

  isHalf(subject) {
    return /half/i.test(subject);
  }

  isFuturesTrade(side) {
    return [TRADE_SIDES.SHORT, TRADE_SIDES.COVER].includes(side);
  }

  isMarketOrder(side) {
    return [TRADE_SIDES.SELL, TRADE_SIDES.COVER].includes(side);
  }
}
