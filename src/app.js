import { ImapClient } from "./infrastructure/email/index.js";
import TradeDataParser from "./services/tradeDataParser.js";
import { SpotClient, FuturesClient } from "./infrastructure/trading/index.js";
import logger from "./services/loggerService.js";
import chalk from "chalk";
import dotenv from "dotenv";
import pd from "pretty-data";
dotenv.config();

// One  more commnent
const main = async () => {
  const imapClient = new ImapClient();
  await imapClient.connect();

  imapClient.on("newEmail", async (securedEmail) => {
    logger.info(chalk.green.bold("📩 New email is here!"));
    const tradeData = TradeDataParser.extractTradeData(securedEmail);
    logger.info(chalk.underline.cyan("And here is the parsed data:\n"), pd.json(tradeData));
    const shouldTrade = process.env.TRADING_ACTIVE === "true";
    const isFutures = tradeData.clientType === "FUTURES";
    if (shouldTrade) {
      isFutures ? await testFutures(tradeData) : await testSpot(tradeData);
      logger.info(
        chalk.bgGreen.white.bold(
          "\nTrades are through! Pleasure doing business!"
        )
      );
      return;
    }
    logger.error(
      chalk.white.bold.bgRed(
        "Trading is off... Check the .env file and configure trading to be active..."
      )
    );
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
