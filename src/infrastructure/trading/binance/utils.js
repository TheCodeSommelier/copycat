import logger from "../../logger/logger.js";
import { binanceConfigLive } from "./binance.config.js";
import { futuresUrl, spotUrl, tradeIsActive } from "../../../constants.js";
import BinanceAdapter from "./binance.adapter.js";
import crypto from "crypto";

/**
 * Calculate order quantity based on asset balance and price
 * @param {string} baseAsset - Base asset symbol
 * @param {Object} orderData - Order parameters
 * @param {boolean} isFutures - Whether it's a futures order
 * @param {boolean} isHalf - Whether to use half quantity
 * @returns {Promise<string>} Formatted quantity string
 */
export async function getQuantity(baseAsset, orderData, isFutures, isHalf) {
  const [minQuantity, stepSize] = await _getBaseAssetMinLotSize(
    orderData.symbol,
    isFutures
  );

  if (orderData.type === "MARKET") {
    return await _calculateMarketOrderQuantity(baseAsset, stepSize, isHalf);
  }

  return await _calculateLimitOrderQuantity(orderData, minQuantity, stepSize);
}

export function getDataToSend(data, apiSecret) {
  const queryString = _getQueryString(data);
  const signature = _createSignature(queryString, apiSecret);
  return { queryString, signature };
}

export async function formatPrice(symbol, isFutures, price) {
  const baseUrl = isFutures
    ? `${futuresUrl}/fapi/v1/exchangeInfo`
    : `${spotUrl}/api/v3/exchangeInfo?symbol=${symbol}`;

  const result = await BinanceAdapter.binanceApiCall(baseUrl, "GET", {});

  let { minPrice, tickSize } = result.symbols
    .filter((ticker) => ticker.symbol === symbol)[0]
    .filters.filter((filter) => filter.filterType === "PRICE_FILTER")[0];

  tickSize =
    parseInt(tickSize) > 0 ? 0 : tickSize.split(".")[1].indexOf("1") + 1;

  if (minPrice > price && minPrice <= price + price * 0.1)
    return parseFloat(minPrice);
  return Number(price).toFixed(tickSize);
}

// Private functions

/**
 * Calculate quantity for market orders
 * @private
 */
async function _calculateMarketOrderQuantity(baseAsset, stepSize, isHalf) {
  const qty = await _assetAmount(baseAsset);
  const amount = isHalf ? qty * 0.5 : qty;
  return _formatQuantity(amount, stepSize);
}

/**
 * Calculate quantity for limit/stop orders
 * @private
 */
async function _calculateLimitOrderQuantity(orderData, minQuantity, stepSize) {
  const baseAssetPrice = orderData.stopPrice || orderData.price;
  const usdtAmount = await _assetAmount("USDT");

  if (usdtAmount === 0) return "0";

  let qty = usdtAmount / baseAssetPrice;

  // Round down if necessary
  if (!Number.isInteger(qty) && stepSize === 0) {
    qty = Math.floor(qty);
  }

  // Check minimum quantity constraints
  if (_isWithinMinQuantityBuffer(qty, minQuantity)) {
    return String(minQuantity);
  }

  if (qty < minQuantity) {
    return "0";
  }

  return _formatQuantity(qty, stepSize);
}

/**
 * Check if quantity is within 10% of minimum
 * @private
 */
function _isWithinMinQuantityBuffer(quantity, minQuantity) {
  return minQuantity > quantity && minQuantity <= quantity + quantity * 0.1;
}

/**
 * Format quantity with proper decimal places
 * @private
 */
function _formatQuantity(quantity, stepSize) {
  return Number(quantity).toFixed(stepSize);
}

async function _getBaseAssetMinLotSize(symbol, isFutures) {
  const baseUrl = isFutures
    ? `${futuresUrl}/fapi/v1/exchangeInfo`
    : `${spotUrl}/api/v3/exchangeInfo?symbol=${symbol}`;

  const result = await BinanceAdapter.binanceApiCall(baseUrl, "GET", {});

  const { minQty, stepSize } = result.symbols
    .filter((ticker) => ticker.symbol === symbol)[0]
    .filters.filter((filter) => filter.filterType === "LOT_SIZE")[0];

  const finalStepSize =
    parseInt(stepSize) > 0 ? 0 : stepSize.split(".")[1].indexOf("1") + 1;

  return [parseFloat(minQty), finalStepSize];
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
  if (!tradeIsActive) return 300;
  try {
    const data = {
      asset,
      timestamp: Date.now(),
    };

    const { queryString, signature } = getDataToSend(
      data,
      binanceConfigLive.api_secret
    );

    const quoteAssetAmount = await BinanceAdapter.binanceApiCall(
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
