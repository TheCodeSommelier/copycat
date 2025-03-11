import dotenv from "dotenv";
import { tradeIsActive } from "../../../constants.js";
dotenv.config();

const liveSpotConfig = {
  apiKey: process.env.KRAKEN_API_KEY_SPOT,
  secret: process.env.KRAKEN_API_SECRET_SPOT,
  baseUrl: "https://api.kraken.com",
};

const liveFuturesConfig = {
  apiKey: process.env.KRAKEN_API_KEY_FUTURES,
  secret: process.env.KRAKEN_API_SECRET_FUTURES,
  baseUrl: "https://futures.kraken.com",
};

const testSpotConfig = {
  apiKey: process.env.KRAKEN_API_KEY_FUTURES,
  secret: process.env.KRAKEN_API_SECRET_FUTURES,
  baseUrl: "https://api.vip.uat.lobster.kraken.com",
};

const testFuturesConfig = {
  apiKey: process.env.KRAKEN_API_KEY_FUTURES_TEST,
  secret: process.env.KRAKEN_API_SECRET_FUTURES_TEST,
  baseUrl: "https://demo-futures.kraken.com",
};

const testSpotWs2Config = {
  apiKey: process.env.KRAKEN_WS_KEY_TEST,
  secret: process.env.KRAKEN_WS_SECET_TEST,
  baseUrl: "https://api.vip.uat.lobster.kraken.com",
  wsUrl:  "wss://eu-west-1-2.vip-ws-auth.vip.uat.lobster.kraken.com/v2"
};

const liveSpotWs2Config = {
  apiKey: process.env.KRAKEN_WS_KEY_LIVE,
  secret: process.env.KRAKEN_WS_SECRET_LIVE,
  baseUrl: "https://api.kraken.com",
  wsUrl: "wss://ws-auth.kraken.com"
};

export const krakenSpotConfig = tradeIsActive ? liveSpotConfig : testSpotConfig;
export const krakenFuturesConfig = tradeIsActive ? liveFuturesConfig : testFuturesConfig;
export const krakenWsSpotConfig = tradeIsActive ? liveSpotWs2Config : testSpotWs2Config;
