export const ORDER_TYPES = {
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

export const TRADE_SIDES = {
  BUY: "BUY",
  SELL: "SELL",
  SHORT: "SHORT",
  COVER: "COVER",
};

export const CLIENT_TYPES = {
  FUTURES: "FUTURES",
  SPOT: "SPOT",
};

export const PRICE_PATTERNS = {
  ENTRY: /Entry:\s+\$([0-9,]+(?:\.\d+)?)/i,
  STOP: /Stop:\s+\$([0-9,]+(?:\.\d+)?)/i,
  TARGET: /Target:\s+\$([0-9,]+(?:\.\d+)?)/i,
  SYMBOL: /(\p{Lu}+)\/(\p{Lu}+)/gu,
  SIDE: /short|buy|sell|cover/gi,
};
