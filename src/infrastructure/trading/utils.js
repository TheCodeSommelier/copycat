import { MainClient, USDMClient } from "binance";
import { binanceConfig } from "../../config/binance.js";

export async function getQuantity(orderData, isFutures) {
  let baseAssetPrice = 0.0;

  if (orderData.type !== "MARKET") {
    baseAssetPrice = orderData.stopPrice || orderData.price;
  } else {
    baseAssetPrice = await _getPrice(orderData.symbol, isFutures);
  }

  const usdtAmount = await _quoteAssetAmount();
  const quantity =
    usdtAmount === "0" ? 0 : parseFloat(usdtAmount) / baseAssetPrice;
  return quantity;
}

async function _getPrice({ symbol, isFutures }) {
  return isFutures ? await _futuresPrice(symbol) : await _spotPrice(symbol);
}

async function _futuresPrice({ symbol }) {
  const client = new USDMClient(binanceConfig);
  return await client
    .getMarkPrice({ symbol: symbol })
    .then((result) => result.indexPrice)
    .catch((err) => console.log(err));
}

async function _spotPrice({ symbol }) {
  const client = new MainClient(binanceConfig);
  return await client
    .getSymbolPriceTicker({ symbol: symbol })
    .then((result) => result.price)
    .catch((err) => console.log(err));
}

async function _quoteAssetAmount() {
  const client = new MainClient(binanceConfig);
  const quoteAssetAmount = await client.getUserAsset({
    asset: "USDT",
    timestamp: Date.now,
  });

  console.log(quoteAssetAmount);

  const result =
    quoteAssetAmount.filter((assetObj) => assetObj.asset === "USDT")[0]?.free ||
    "0";

  return result;
}
