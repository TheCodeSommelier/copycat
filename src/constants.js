import dotenv from "dotenv";
dotenv.config();

export const tradeIsActive = process.env.TRADING_ACTIVE == "true";
export const spotUrl = tradeIsActive ? "https://api.binance.com" : "https://testnet.binance.vision";
export const futuresUrl = tradeIsActive ? "https://fapi.binance.com" : "https://testnet.binancefuture.com";
export const okxBaseUrl = "https://www.okx.com";
export const publicMarketDataUrl = "https://data-api.binance.vision";
export const isProduction = process.env.NODE_ENV?.toLowerCase() === "production";
