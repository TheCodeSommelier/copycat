import ImapAdapter from "./infrastructure/email/adapters/imap.adapter.js";
import { imapConfig } from "./infrastructure/email/adapters/imap.config.js";
import TradeParser from "./core/use-cases/trade.parser.js";
import EmailParser from "./core/use-cases/email.parser.js";
import logger from "./infrastructure/logger/logger.js";
import dotenv from "dotenv";
import BinanceAdapter from "./infrastructure/trading/binance/binance.adapter.js";
import { tradeIsActive } from "./constants.js";
dotenv.config();

// One  more commnent
const main = async () => {
  const emailParser = new EmailParser();
  const trader = new BinanceAdapter();
  const reciever = new ImapAdapter(imapConfig, logger, emailParser);
  const tradeParser = new TradeParser();

  console.log("Trade Is Active: ", tradeIsActive);

  reciever.monitorEmails();
  reciever.onTradeSignal(async (email) => {
    const tradeData = await tradeParser.extractTradeData(email);
    logger.info(`Here it is!`, tradeData);

    trader.executeTrade(tradeData);
  });
};

main();
