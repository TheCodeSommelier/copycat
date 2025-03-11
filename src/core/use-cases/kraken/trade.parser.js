import Trade from "../../entities/trade.js";

export default class KrakenTradeParser {
  constructor(logger, tickerNormalizer) {
    this.logger = logger;
    this.tickerNormalizer = tickerNormalizer;
  }

  async parseData(email) {
    try {
      const subject = email.getSubject();
      const html = email.getHtml();
      const traderName = this.#extractTraderName(html);
      const tradeAction = this.#extractSide(subject);
      const isFutures = this.#isFuturesTrade(tradeAction);
      const tradeTickers = await this.#extractTickers(subject, isFutures);
      let prices = {};
      const isSell = /sell|short/i.test(subject) ? true : false;

      if (/buy|short/i.test(subject)) {
        prices = this.#extractPrices(html);
      }

      const tradeData = {
        ...tradeTickers,
        ...prices,
        isFutures,
        tradeAction,
        isSell,
        isHalf: /half/i.test(subject),
        traderName,
      };

      console.log("tradeData: ", tradeData);

      return new Trade(tradeData);
    } catch (error) {
      this.logger.error("Error parsing trading data: ", error);
      throw error;
    }
  }

  async #extractTickers(subject, isFutures) {
    const match = subject.match(/(\p{Lu}+)(?:\/)?(?:(USD.?))/u);

    if (!match || !match[0]) {
      throw new Error("Failed to extract symbol");
    }

    const baseAsset = match[1];
    // const quoteAsset = ["USD", "USDT"].includes(match[2]) ? "USDC" : match[2];
    const quoteAsset = match[2];
    const symbol = isFutures
      ? await this.tickerNormalizer.normalizeContractSymbol(baseAsset)
      : `${baseAsset}/${quoteAsset}`;

    return {
      symbol,
      baseAsset,
      quoteAsset,
    };
  }

  #extractSide(subject) {
    const match = subject.match(/short|buy|sell|cover/gi);

    if (!match || !match[0]) {
      throw new Error("Failed to extract trade side");
    }

    return match[0].toLowerCase();
  }

  #isFuturesTrade(tradeAction) {
    return ["short", "cover"].includes(tradeAction.toLowerCase());
  }

  #extractPrices(html) {
    return {
      entryPrice: this.#extractPrice(html, "entry"),
      stopLoss: this.#extractPrice(html, "stop"),
      takeProfit: this.#extractPrice(html, "target"),
    };
  }

  #extractPrice(html, priceType) {
    const pricePatterns = {
      entry: /Entry:\s+\$([0-9,]+(?:\.\d+)?)/i,
      stop: /Stop:\s+\$([0-9,]+(?:\.\d+)?)/i,
      target: /Target:\s+\$([0-9,]+(?:\.\d+)?)/i,
    };
    const match = html.replace(/confirmation\s+\w+/gi, "").match(pricePatterns[priceType]);

    if (!match?.[1]) {
      throw new Error(`Failed to extract ${priceType} price`);
    }

    return match[1].replace(/[,$]/g, "");
  }

  #extractTraderName(html) {
    const match = html.match(/<p class="post-author-name">(.*?)<\/p>/);
    return match ? match[1] : null;
  }
}
