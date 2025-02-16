import ImapAdapter from "./infrastructure/email/adapters/imap.adapter.js";
import { imapConfig } from "./infrastructure/email/adapters/imap.config.js";
import EmailParser from "./core/use-cases/email.parser.js";
import logger from "./infrastructure/logger/logger.js";
import { tradeIsActive } from "./constants.js";
import dotenv from "dotenv";
import KrakenAdapter from "./infrastructure/trading/kraken/adapters/adapter.js";
import KrakenSpotAdapter from "./infrastructure/trading/kraken/adapters/spot.adapter.js";
import KrakenFuturesAdapter from "./infrastructure/trading/kraken/adapters/futures.adapter.js";
import KrakenTradeParser from "./core/use-cases/kraken/trade.parser.js";
import KrakenAccountService from "./infrastructure/trading/kraken/services/account.service.js";
import KrakenApiService from "./infrastructure/trading/kraken/services/api.service.js";
dotenv.config();

// One  more commnent
const main = async () => {
  // Tradings instances
  const apiClient = new KrakenApiService(logger);
  const accountService = new KrakenAccountService(logger, apiClient);
  const futuresAdapter = new KrakenFuturesAdapter(logger, apiClient, accountService);
  const spotAdapter = new KrakenSpotAdapter(logger, apiClient, accountService);
  const tradeAdapter = new KrakenAdapter(logger, spotAdapter, futuresAdapter);
  const tradeParser = new KrakenTradeParser(logger);

  // Email instances
  const emailParser = new EmailParser(logger);
  const reciever = new ImapAdapter(imapConfig, logger, emailParser);

  console.log("Trade Is Active: ", tradeIsActive);

  reciever.monitorEmails();
  reciever.onTradeSignal(async (email) => {
    const trade = await tradeParser.parseData(email);
    logger.info(`Here it is!`, trade);

    await tradeAdapter.placeOrder(trade);
  });
};

main();
