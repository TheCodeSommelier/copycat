import dotenv from "dotenv";
dotenv.config();

export const tradeIsActive = process.env.TRADING_ACTIVE == "true";
export const spotUrl = tradeIsActive ? "https://api.binance.com" : "https://testnet.binance.vision/api";
export const futuresUrl = tradeIsActive ? "https://fapi.binance.com": "https://testnet.binancefuture.com";
export const publicMarketDataUrl = "https://data-api.binance.vision";
