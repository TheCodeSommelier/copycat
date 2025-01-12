import logger from "../../logger/logger.js";
import { binanceConfigLive } from "../../../config/binance.js";
import { futuresUrl, spotUrl, tradeIsActive } from "../../../constants.js";
import crypto from "crypto";

export async function binanceApiCall(signedUrl, method, headers) {
  try {
    console.trace("Trace that back!");
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
      logger.error("Failed to parse JSON response:", error);
      throw new Error("Invalid JSON response from API");
    }
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
export async function getQuantity(baseAsset, orderData, isFutures, isHalf) {
  let baseAssetPrice = 0.0;

  const [minQuantity, stepSize] = await _getBaseAssetMinLotSize(
    orderData.symbol,
    isFutures
  );

  if (orderData.type === "MARKET") {
    const qty = await _assetAmount(baseAsset);
    const formatedQty = isHalf
      ? Number(qty * 0.5).toFixed(stepSize)
      : Number(qty).toFixed(stepSize);
    return String(formatedQty);
  } else {
    baseAssetPrice = orderData.stopPrice || orderData.price;
  }

  const usdtAmount = await _assetAmount("USDT");
  const quantity = usdtAmount === 0.0 ? 0.0 : usdtAmount / baseAssetPrice;

  console.log("usdtAmount", usdtAmount);

  if (minQuantity > quantity && minQuantity <= quantity + quantity * 0.1) {
    return String(minQuantity);
  } else if (minQuantity > quantity) {
    return "0";
  }

  return Number(quantity).toFixed(stepSize);
}

export function getDataToSend(data, apiSecret) {
  const queryString = _getQueryString(data);
  const signature = _createSignature(queryString, apiSecret);
  return { queryString, signature };
}

// Private functions

async function _getBaseAssetMinLotSize(symbol, isFutures) {
  const baseUrl = isFutures
    ? `${futuresUrl}/fapi/v1/exchangeInfo`
    : `${spotUrl}/api/v3/exchangeInfo?symbol=${symbol}`;

  const result = await binanceApiCall(baseUrl, "GET", {});

  const { minQty, stepSize } = result.symbols
    .filter((ticker) => ticker.symbol === symbol)[0]
    .filters.filter((filter) => filter.filterType === "LOT_SIZE")[0];

  return [parseFloat(minQty), stepSize.split(".")[1].indexOf("1") + 1];
}

function _createSignature(queryString, apiSecret) {
  return crypto
    .createHmac("sha256", apiSecret)
    .update(queryString)
    .digest("hex");
}

function _getQueryString(data) {
  return Object.entries(data)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&");
}

/**
 * Get available USDT balance from user's wallet
 * @returns {Promise<number>} Available USDT balance
 * @private
 */
async function _assetAmount(asset) {
  if (!tradeIsActive) return 20.86;
  try {
    const data = {
      asset,
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

    const quantityAsset =
      quoteAssetAmount.filter((assetObj) => assetObj.asset === "USDT")[0]
        ?.free || "0";

    console.log("quantityAsset => ", quantityAsset);


    return parseFloat(quantityAsset);
  } catch (error) {
    logger.error(error);
    throw error;
  }
}
