import TradingPort from "../../../core/ports/trading.port.js";
import FuturesAdapter from "./futures.adapter.js";
import SpotAdapter from "./spot.adapter.js";
import logger from "../../logger/logger.js";

export default class BinanceAdapter extends TradingPort {
  constructor() {
    super();
    this.spotAdapter = new SpotAdapter();
    this.futuresAdapter = new FuturesAdapter();
  }

  executeTrade(tradeData) {
    return tradeData.clientType === "SPOT"
      ? this.spotAdapter.executeTrade(tradeData)
      : this.futuresAdapter.executeTrade(tradeData);
  }

  static async binanceApiCall(signedUrl, method, headers, maxRetries = 10) {
    let retryCount = 0;
    const rateLimitState = {
      usedWeight: 0,
      orderCount: 0,
      retryAfter: 0,
      isIpBanned: false,
    };

    while (retryCount <= maxRetries) {
      try {
        if (rateLimitState.retryAfter > 0) {
          await this.#sleep(rateLimitState.retryAfter * 1000);
          rateLimitState.retryAfter = 0;
        }

        const response = await fetch(signedUrl, {
          method: method,
          headers: headers,
        });

        this.#updateRateLimitState(response.headers, rateLimitState);

        if (response.status === 429) {
          this.#handleRateLimit(response, rateLimitState);
          retryCount++;
          continue;
        }

        if (response.status === 418) {
          this.#handleIpBan(response, rateLimitState);
          throw new Error("IP banned from API");
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await this.#validateAndParseResponse(response);
        return data;
      } catch (error) {
        if (retryCount === maxRetries || rateLimitState.isIpBanned) {
          logger.error("Max retries exceeded or permanent error:", error);
          throw error;
        }
        retryCount++;
        await this.#sleep(Math.pow(2, retryCount) * 1000);
      }
    }
  }

  // Private

  /**
   * Update rate limit tracking state from response headers
   * @param {Headers} headers - Response headers
   * @param {RateLimitState} state - Current rate limit state
   * @private
   */
  static #updateRateLimitState(headers, state) {
    const weightHeader = headers.get("X-MBX-USED-WEIGHT-1m");
    if (weightHeader) {
      state.usedWeight = parseInt(weightHeader);
    }

    const orderHeader = headers.get("X-MBX-ORDER-COUNT-1m");
    if (orderHeader) {
      state.orderCount = parseInt(orderHeader);
    }
  }

  /**
   * Handle 429 rate limit responses
   * @param {Response} response - API response
   * @param {RateLimitState} state - Current rate limit state
   * @private
   */
  static #handleRateLimit(response, state) {
    const retryAfter = response.headers.get("Retry-After");
    if (retryAfter) {
      state.retryAfter = parseInt(retryAfter);
      logger.warn(`Rate limit exceeded. Waiting ${state.retryAfter} seconds`);
    }
  }

  /**
   * Handle 418 IP ban responses
   * @param {Response} response - API response
   * @param {RateLimitState} state - Current rate limit state
   * @private
   */
  static #handleIpBan(response, state) {
    state.isIpBanned = true;
    state.retryAfter = parseInt(response.headers.get("Retry-After") || "120");
    logger.error(`IP banned. Ban expires in ${state.retryAfter} seconds`);
  }

  /**
   * Validate and parse JSON response
   * @param {Response} response - API response
   * @returns {Promise<Object>} Parsed response data
   * @throws {Error} If response is invalid
   * @private
   */
  static async #validateAndParseResponse(response) {
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      throw new Error("Invalid content type");
    }

    try {
      return await response.json();
    } catch (error) {
      throw new Error("Invalid JSON response");
    }
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   * @private
   */
  static #sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
