import { ImapClient } from "./infrastructure/email/index.js";
import { SpotClient, FuturesClient } from "./infrastructure/trading/index.js";
import chalk from "chalk";
import dotenv from "dotenv";
dotenv.config();

const main = async () => {
  const imapClient = new ImapClient();
  await imapClient.connect();

  imapClient.on("newEmail", async (tradeData) => {
    console.log(chalk.green.bold("📩 New email is here!"));
    console.log(chalk.underline.cyan("And here is the parsed data:\n"), tradeData);
    const shouldTrade = process.env.TRADING_ACTIVE === "true";
    const isFutures = tradeData.clientType === "FUTURES";
    if (shouldTrade) {
      isFutures ? await testFutures(tradeData) : await testSpot(tradeData);
      console.log(chalk.bgGreen.white.bold("\nTrades are through! Pleasure doing business!"));
      return;
    }
    console.log(chalk.white.bold.bgRed("\nTrading is off... Check the .env file and configure trading to be active..."), process.env.TRADING_ACTIVE);
  });
};

const testFutures = async (tradeData) => {
  const futuresClient = new FuturesClient();

  const tradeRes = await futuresClient.enqueueFuturesOrders(tradeData);
  console.log("TRADE_RES => ", tradeRes);
};

const testSpot = async (tradeData) => {
  const spotClient = new SpotClient();

  const tradeRes = await spotClient.executeTrade(tradeData);
  console.log("TRADE_RES => ", tradeRes);
};

main();
