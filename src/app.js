import ImapAdapter from "./infrastructure/email/adapters/imap.adapter.js";
import { imapConfig } from "./config/imap.js";
import EmailParser from "./infrastructure/email/emailParser.js";
import TradeDataParser from "./infrastructure/email/tradeDataParser.js";
import { SpotClient, FuturesClient } from "./infrastructure/trading/index.js";
import logger from "./services/loggerService.js";
import dotenv from "dotenv";
dotenv.config();

// One  more commnent
const main = async () => {
  const emailParser = new EmailParser();
  const adapter = new ImapAdapter(imapConfig, logger, emailParser);

  adapter.monitorEmails();
  adapter.onTradeSignal(async (email) => {
    const tradeData = await TradeDataParser.extractTradeData(email);
    logger.info(`Here it is!`, tradeData);
    console.log(tradeData);

    if (process.env.TRADING_ACTIVE === "true") {
      if (tradeData.clientType === "SPOT") {
        await testSpot(tradeData);
      } else {
        await testFutures(tradeData);
      }
    }
  });
};

const testFutures = async (tradeData) => {
  const futuresClient = new FuturesClient();

  const tradeRes = await futuresClient.enqueueFuturesOrders(tradeData);
  logger.info("TRADE_RES => ", tradeRes);
};

const testSpot = async (tradeData) => {
  const spotClient = new SpotClient();

  const tradeRes = await spotClient.executeTrade(tradeData);
  logger.info("TRADE_RES => ", tradeRes);
};

main();
