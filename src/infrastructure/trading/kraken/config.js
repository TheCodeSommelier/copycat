import dotenv from "dotenv";
import { tradeIsActive } from "../../../constants.js";
dotenv.config();

const liveSpotConfig = {
  api_key: process.env.KRAKEN_API_KEY_SPOT,
  secret: process.env.KRAKEN_API_SECRET_SPOT,
  base_url: "https://api.kraken.com",
};

const liveFuturesConfig = {
  api_key: process.env.KRAKEN_API_KEY_FUTURES,
  secret: process.env.KRAKEN_API_SECRET_FUTURES,
  base_url: "https://futures.kraken.com",
};

const testSpotConfig = {
  api_key: process.env.KRAKEN_API_KEY_TEST,
  secret: process.env.KRAKEN_API_SECRET_TEST,
  base_url: "https://api.vip.uat.lobster.kraken.com",
};

const testFuturesConfig = {
  api_key: process.env.KRAKEN_API_KEY_TEST,
  secret: process.env.KRAKEN_API_SECRET_TEST,
  base_url: "https://demo-futures.kraken.com/",
};

export const krakenSpotConfig = tradeIsActive ? liveSpotConfig : testSpotConfig;
export const krakenFuturesConfig = tradeIsActive ? liveFuturesConfig : testFuturesConfig;
