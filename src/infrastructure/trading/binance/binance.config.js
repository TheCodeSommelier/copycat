import dotenv from "dotenv";
dotenv.config();

export const binanceConfigLive = {
  api_key: process.env.BINANCE_API_KEY,
  api_secret: process.env.BINANCE_API_SECRET,
};

export const binanceConfigTestSpot = {
  api_key: process.env.BINANCE_API_KEY_SPOT_TEST,
  api_secret: process.env.BINANCE_API_SECRET_SPOT_TEST
}

export const binanceConfigTestFutures = {
  api_key: process.env.BINANCE_API_KEY_FUTURES_TEST,
  api_secret: process.env.BINANCE_API_SECRET_FUTURES_TEST
}
