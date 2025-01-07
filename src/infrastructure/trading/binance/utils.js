import logger from "../../logger/logger.js";
import {
  binanceConfigLive,
  binanceConfigTestFutures,
  binanceConfigTestSpot,
} from "../../../config/binance.js";
import { futuresUrl, tradeIsActive } from "../../../constants.js";
import crypto from "crypto";

export async function binanceApiCall(signedUrl, method, headers) {
  try {
    const response = await fetch(signedUrl, {
      method: method,
      headers: headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Binance API error: ${response.status} ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status} ${errorText}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      logger.error(`Invalid content type or empty response: ${text}`);
      throw new Error("Invalid response format");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === "SyntaxError") {
      // JSON parsing error
      logger.error("Failed to parse JSON response:", error);
      throw new Error("Invalid JSON response from API");
    }

    // Other errors (network, etc)
    logger.error("Binance API call failed:", error);
    throw error;
  }
}

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
  const quantity = usdtAmount === 0.0 ? 0.0 : usdtAmount / baseAssetPrice;
  return isHalf ? quantity * 0.5 : quantity;
}

export function getDataToSend(data, apiSecret) {
  const queryString = _getQueryString(data);
  const signature = _createSignature(queryString, apiSecret);
  return { queryString, signature };
}

// Private functions

export function _createSignature(queryString, apiSecret) {
  return crypto
    .createHmac("sha256", apiSecret)
    .update(queryString)
    .digest("hex");
}

export function _getQueryString(data) {
  return Object.entries(data)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&");
}

/**
 * Get current price for a symbol from either futures or spot market
 * @param {string} symbol - Trading pair symbol (e.g. 'BTCUSDT')
 * @param {boolean} isFutures - True if using futures client, false for spot
 * @returns {Promise<number>} Current price of the asset
 * @private
 */
async function _getPrice(symbol, isFutures) {
  return isFutures
    ? await _futuresPrice({ symbol })
    : await _spotPrice({ symbol });
}

/**
 * Get index price from futures market
 * @param {string} symbol - Trading pair symbol (e.g. 'BTCUSDT')
 * @returns {Promise<number>} Index price of the asset
 * @private
 */
async function _futuresPrice({ symbol }) {
  try {
    const binanceConfig = tradeIsActive
      ? binanceConfigLive
      : binanceConfigTestFutures;
    const data = { symbol: symbol };
    const { queryString, signature } = getDataToSend(
      data,
      binanceConfigLive.api_secret
    );

    const indexPrice = await binanceApiCall(
      `${futuresUrl}/fapi/v1/premiumIndex?${queryString}&signature=${signature}`,
      "GET",
      {
        "X-MBX-APIKEY": binanceConfig.api_key,
        "Content-Type": "application/json",
      }
    );
    return parseFloat(indexPrice);
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

/**
 * Get current price from spot market
 * @param {string} symbol - Trading pair symbol (e.g. 'BTCUSDT')
 * @returns {Promise<number>} Current spot price of the asset
 * @private
 */
async function _spotPrice({ symbol }) {
  try {
    const data = { symbol: symbol };
    const { queryString, signature } = getDataToSend(
      data,
      binanceConfigLive.api_secret
    );

    const price = await binanceApiCall(
      `https://api.binance.com/api/v3/ticker/price?${queryString}`,
      "GET",
      {
        "X-MBX-APIKEY": binanceConfigLive.api_key,
        "Content-Type": "application/json",
      }
    );
    return parseFloat(price);
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

/**
 * Get available USDT balance from user's wallet
 * @returns {Promise<number>} Available USDT balance
 * @private
 */
async function _quoteAssetAmount() {
  if (!tradeIsActive) return 1000.0;
  try {
    const data = {
      asset: "USDT",
      timestamp: Date.now(),
    };

    const { queryString, signature } = getDataToSend(
      data,
      binanceConfigLive.api_secret
    );

    const quoteAssetAmount = await binanceApiCall(
      `https://api.binance.com/sapi/v3/asset/getUserAsset?${queryString}&signature=${signature}`,
      "POST",
      {
        "X-MBX-APIKEY": binanceConfigLive.api_key,
        "Content-Type": "application/json",
      }
    );

    const quantityQuoteAsset =
      quoteAssetAmount.filter((assetObj) => assetObj.asset === "USDT")[0]
        ?.free || "0";

    return parseFloat(quantityQuoteAsset);
  } catch (error) {
    logger.error(error);
    throw error;
  }
}
