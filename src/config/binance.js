import dotenv from "dotenv";
dotenv.config();

export const binanceConfig = {
  api_key: process.env.BINANCE_API_KEY,
  api_secret: process.env.BINANCE_API_SECRET,
};
