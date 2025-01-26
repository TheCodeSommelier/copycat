import { expect } from "../../../setup.js";
import TradeParser from "../../../../core/use-cases/trade.parser.js";

describe("TradeParser", () => {
  describe("Symbol Extraction", () => {
    it("should correctly extract symbol and assets from subject", () => {
      const subject = "Buy Alert: LINK/USD";
      const result = TradeParser.extractSymbol(subject);

      expect(result).to.deep.equal({
        symbol: "LINKUSDT",
        baseAsset: "LINK",
        quoteAsset: "USDT",
      });
    });

    it("should handle non-USD quote assets", () => {
      const subject = "Buy Alert: BTC/USDT";
      const result = TradeParser.extractSymbol(subject);

      expect(result).to.deep.equal({
        symbol: "BTCUSDT",
        baseAsset: "BTC",
        quoteAsset: "USDT",
      });
    });

    it("should throw error for invalid symbol format", () => {
      const subject = "Buy Alert: Invalid Format";
      expect(() => TradeParser.extractSymbol(subject)).to.throw(
        "Failed to extract symbol"
      );
    });
  });

  describe("Side Extraction", () => {
    const testCases = [
      { subject: "Buy Alert: BTC/USD", expected: "BUY" },
      { subject: "Sell Alert: ETH/USD", expected: "SELL" },
      { subject: "Short Alert: ADA/USD", expected: "SHORT" },
      { subject: "Cover Alert: LINK/USD", expected: "COVER" },
    ];

    testCases.forEach(({ subject, expected }) => {
      it(`should extract ${expected} from subject`, () => {
        const result = TradeParser.extractSide(subject);
        expect(result).to.equal(expected);
      });
    });

    it("should throw error for invalid side", () => {
      const subject = "Invalid Alert: BTC/USD";
      expect(() => TradeParser.extractSide(subject)).to.throw(
        "Failed to extract trade side"
      );
    });
  });

  describe("Price Extraction", () => {
    const htmlContent = `
      Entry: $42,500.50
      Stop: $40,000.75
      Target: $45,000.25
    `;

    it("should extract entry price", () => {
      const result = TradeParser.extractPrice(htmlContent, "ENTRY");
      expect(result).to.equal(42500.5);
    });

    it("should extract stop loss", () => {
      const result = TradeParser.extractPrice(htmlContent, "STOP");
      expect(result).to.equal(40000.75);
    });

    it("should extract target price", () => {
      const result = TradeParser.extractPrice(htmlContent, "TARGET");
      expect(result).to.equal(45000.25);
    });

    it("should handle prices without decimals", () => {
      const html = "Entry: $42500";
      const result = TradeParser.extractPrice(html, "ENTRY");
      expect(result).to.equal(42500);
    });

    it("should throw error for missing price", () => {
      const html = "No prices here";
      expect(() => TradeParser.extractPrice(html, "ENTRY")).to.throw(
        "Failed to extract ENTRY price"
      );
    });

    it('should ignore "confirmation" text in price extraction', () => {
      const html = "Stop: Confirmation below $40,000";
      const result = TradeParser.extractPrice(html, "STOP");
      expect(result).to.equal(40000);
    });
  });

  describe("Order Creation", () => {
    const symbol = "BTCUSDT";
    const price = 42500;

    describe("Entry Orders", () => {
      it("should create spot buy order", () => {
        const result = TradeParser.createEntryOrder({
          symbol,
          price,
          isFutures: false,
          isShort: false,
        });

        expect(result).to.deep.equal({
          symbol: "BTCUSDT",
          type: "LIMIT",
          price: 42500,
          timeInForce: "GTC",
          side: "BUY",
        });
      });

      it("should create futures short order", () => {
        const result = TradeParser.createEntryOrder({
          symbol,
          price,
          isFutures: true,
          isShort: true,
        });

        expect(result).to.deep.equal({
          symbol: "BTCUSDT",
          type: "LIMIT",
          price: 42500,
          timeInForce: "GTC",
          side: "SELL",
        });
      });
    });

    describe("Stop Orders", () => {
      it("should create spot stop loss", () => {
        const result = TradeParser.createStopOrder({
          symbol,
          price,
          isFutures: false,
          isShort: false,
        });

        expect(result).to.deep.equal({
          symbol: "BTCUSDT",
          type: "STOP_LOSS",
          stopPrice: 42500,
          side: "SELL",
        });
      });

      it("should create futures stop market", () => {
        const result = TradeParser.createStopOrder({
          symbol,
          price,
          isFutures: true,
          isShort: false,
        });

        expect(result).to.deep.equal({
          symbol: "BTCUSDT",
          type: "STOP_MARKET",
          stopPrice: 42500,
          side: "SELL",
          closePosition: true,
        });
      });
    });

    describe("Exit Orders", () => {
      it("should create spot take profit", () => {
        const result = TradeParser.createExitOrder({
          symbol,
          price,
          isFutures: false,
          isShort: false,
        });

        expect(result).to.deep.equal({
          symbol: "BTCUSDT",
          type: "TAKE_PROFIT",
          stopPrice: 42500,
          side: "SELL",
        });
      });

      it("should create futures take profit market", () => {
        const result = TradeParser.createExitOrder({
          symbol,
          price,
          isFutures: true,
          isShort: false,
        });

        expect(result).to.deep.equal({
          symbol: "BTCUSDT",
          type: "TAKE_PROFIT_MARKET",
          stopPrice: 42500,
          side: "SELL",
          closePosition: true,
        });
      });
    });
  });

  describe("Utility Functions", () => {
    describe("isHalf", () => {
      it("should detect half position", () => {
        expect(TradeParser.isHalf("Sell Alert: BTC/USD (Half)")).to.be
          .true;
        expect(TradeParser.isHalf("Cover Alert: ETH/USD (half)")).to.be
          .true;
        expect(TradeParser.isHalf("Buy Alert: BTC/USD")).to.be.false;
      });
    });

    describe("isFuturesTrade", () => {
      it("should identify futures trades", () => {
        expect(TradeParser.isFuturesTrade("SHORT")).to.be.true;
        expect(TradeParser.isFuturesTrade("COVER")).to.be.true;
        expect(TradeParser.isFuturesTrade("BUY")).to.be.false;
        expect(TradeParser.isFuturesTrade("SELL")).to.be.false;
      });
    });

    describe("isMarketOrder", () => {
      it("should identify market orders", () => {
        expect(TradeParser.isMarketOrder("SELL")).to.be.true;
        expect(TradeParser.isMarketOrder("COVER")).to.be.true;
        expect(TradeParser.isMarketOrder("BUY")).to.be.false;
        expect(TradeParser.isMarketOrder("SHORT")).to.be.false;
      });
    });
  });
});
