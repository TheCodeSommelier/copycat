import { MainClient, USDMClient } from "binance";
import { binanceConfig } from "../../config/binance.js";
import logger from "../../services/loggerService.js";

/**
 * Calculate the quantity of assets to buy based on order data and available USDT
 * @param {Object} orderData - Order data containing price and symbol information
 * @param {string} orderData.type - Order type (e.g. 'MARKET', 'LIMIT')
 * @param {string} orderData.symbol - Trading pair symbol (e.g. 'BTCUSDT')
 * @param {string} [orderData.stopPrice] - Stop price for stop loss and take profit orders
 * @param {string} [orderData.price] - Entry price for limit orders
 * @param {boolean} isFutures - True if using futures client, false for spot
 * @returns {Promise<number>} Quantity of assets that can be bought with available USDT
 */
export async function getQuantity(orderData, isFutures, isHalf) {
  let baseAssetPrice = 0.0;

  if (orderData.type !== "MARKET") {
    baseAssetPrice = orderData.stopPrice || orderData.price;
  } else {
    baseAssetPrice = await _getPrice(orderData.symbol, isFutures);
  }

  const usdtAmount = await _quoteAssetAmount();
  const quantity =
    usdtAmount === "0" ? 0 : usdtAmount / baseAssetPrice;
  return isHalf ? quantity * 0.5 : quantity;
}

// Private functions

/**
 * Get current price for a symbol from either futures or spot market
 * @param {string} symbol - Trading pair symbol (e.g. 'BTCUSDT')
 * @param {boolean} isFutures - True if using futures client, false for spot
 * @returns {Promise<number>} Current price of the asset
 * @private
 */
async function _getPrice({ symbol, isFutures }) {
  return isFutures ? await _futuresPrice({ symbol }) : await _spotPrice({ symbol });
}

/**
 * Get index price from futures market
 * @param {string} symbol - Trading pair symbol (e.g. 'BTCUSDT')
 * @returns {Promise<number>} Index price of the asset
 * @private
 */
async function _futuresPrice({ symbol }) {
  const client = new USDMClient(binanceConfig);
  return await client
    .getMarkPrice({ symbol: symbol })
    .then((result) => parseFloat(result.indexPrice))
    .catch((err) => logger.error(err));
}

/**
 * Get current price from spot market
 * @param {string} symbol - Trading pair symbol (e.g. 'BTCUSDT')
 * @returns {Promise<number>} Current spot price of the asset
 * @private
 */
async function _spotPrice({ symbol }) {
  const client = new MainClient(binanceConfig);
  return await client
    .getSymbolPriceTicker({ symbol: symbol })
    .then((result) => parseFloat(result.price))
    .catch((err) => logger.error(err));
}

/**
 * Get available USDT balance from user's wallet
 * @returns {Promise<number>} Available USDT balance
 * @private
 */
async function _quoteAssetAmount() {
  const client = new MainClient(binanceConfig);
  const quoteAssetAmount = await client.getUserAsset({
    asset: "USDT",
    timestamp: Date.now,
  });

  const quantityQuoteAsset =
    quoteAssetAmount.filter((assetObj) => assetObj.asset === "USDT")[0]?.free ||
    "0";

  return parseFloat(quantityQuoteAsset);
}
