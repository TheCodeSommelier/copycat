import ImapAdapter from "./infrastructure/email/adapters/imap.adapter.js";
import { imapConfig } from "./config/imap.js";
import EmailParser from "./infrastructure/email/emailParser.js";
import TradeDataParser from "./infrastructure/email/tradeDataParser.js";
import logger from "./infrastructure/logger/logger.js";
import dotenv from "dotenv";
import BinanceAdapter from "./infrastructure/trading/binance/binanceAdapter.js";
dotenv.config();

// One  more commnent
const main = async () => {
  const emailParser = new EmailParser();
  const trader = new BinanceAdapter();
  const adapter = new ImapAdapter(imapConfig, logger, emailParser);
  const tradeParser = new TradeDataParser();

  adapter.monitorEmails();
  adapter.onTradeSignal(async (email) => {
    const tradeData = tradeParser.extractTradeData(email);
    logger.info(`Here it is!`, tradeData);

    if (process.env.TRADING_ACTIVE === "true") {
      trader.executeTestTrade(tradeData);
    } else {
      logger.warn("Trading is deactivated see the .env file...");
    }
  });
};

main();
