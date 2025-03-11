import crypto from "crypto";
import ImapAdapter from "./infrastructure/email/adapters/imap.adapter.js";
import { imapConfig } from "./infrastructure/email/adapters/imap.config.js";
import EmailParser from "./core/use-cases/email.parser.js";
import logger from "./infrastructure/logger/logger.js";
import { isProduction, tradeIsActive } from "./constants.js";
import dotenv from "dotenv";
import KrakenAdapter from "./infrastructure/trading/kraken/adapters/kraken.adapter.js";
import KrakenSpotAdapter from "./infrastructure/trading/kraken/adapters/spot.adapter.js";
import KrakenFuturesAdapter from "./infrastructure/trading/kraken/adapters/futures.adapter.js";
import KrakenTradeParser from "./core/use-cases/kraken/trade.parser.js";
import KrakenAccountService from "./infrastructure/trading/kraken/services/account.service.js";
import KrakenApiService from "./infrastructure/trading/kraken/services/api.service.js";
import TickerNormalizer from "./infrastructure/trading/kraken/services/tickerNormalizer.service.js";
import Redis from "./infrastructure/repositories/redis.adapter.js";
dotenv.config();

const main = async () => {
  const redis = new Redis(logger);
  const apiClient = new KrakenApiService(logger);
  const accountService = new KrakenAccountService(logger, apiClient);
  const futuresAdapter = new KrakenFuturesAdapter(logger, apiClient, accountService, redis);
  const spotAdapter = new KrakenSpotAdapter(logger, apiClient, accountService, redis);
  const cexAdapter = new KrakenAdapter(logger, spotAdapter, futuresAdapter);
  const tickerNormalizer = new TickerNormalizer(logger, apiClient);
  const tradeParser = new KrakenTradeParser(logger, tickerNormalizer);

  const emailParser = new EmailParser(logger);
  const reciever = new ImapAdapter(imapConfig, logger, emailParser);

  console.log("Trade Is Active:", tradeIsActive);
  console.log("In prod env:", isProduction);
  console.log(`Redis ping: ${await redis.ping()}\n`);

  reciever.monitorEmails();
  reciever.onTradeSignal(async (email) => {
    const trade = await tradeParser.parseData(email);
    logger.info(`Here it is!`, trade);

    trade.exchangeType === "CEX" ? await cexAdapter.placeOrder(trade) : logger.warn("DEX not implemented yet...");
  });
};

main();
