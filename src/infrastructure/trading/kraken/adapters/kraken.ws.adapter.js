import { krakenWsSpotConfig } from "../config.js";
import WebSocket from "ws";
import EventEmitter from "events";

export default class KrakenWsAdapter extends EventEmitter {
  #config;

  constructor(logger, apiClient) {
    super();
    this.logger = logger;
    this.ws = null;
    this.#config = krakenWsSpotConfig;
    this.ws = null;
    this.pingInterval = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.apiClient = apiClient;
    this.#connect();
  }

  async #connect() {
    try {
      this.ws = new WebSocket(this.#config.wsUrl);

      this.ws.on("open", () => {
        this.logger.info("WebSocket connected");
        this.reconnectAttempts = 0;
        this.#setupPingInterval();
        this.#subscribe("executions");
      });

      this.ws.on("message", (data) => {
        this.#handleMessage(data);
      });

      this.ws.on("error", (error) => {
        this.logger.error("WebSocket error:", error);
      });

      this.ws.on("close", () => {
        this.logger.warn("WebSocket connection closed");
        this.#cleanup();
        this.#handleReconnect();
      });
    } catch (error) {
      this.logger.error("Failed to connect WebSocket:", error);
      throw error;
    }
  }

  async #subscribe(channelName) {
    try {
      const token = await this.#getWsToken();
      const subscribeMessage = {
        method: "subscribe",
        params: {
          token,
          channel: channelName,
        },
      };

      this.logger.info("Sending subscription message:", subscribeMessage);
      this.ws.send(JSON.stringify(subscribeMessage));
    } catch (err) {
      this.logger.error("Subscription error: ", err);
      throw err;
    }
  }

  async #getWsToken() {
    try {
      const response = await this.apiClient.makeApiCall(this.#config, "POST", "/0/private/GetWebSocketsToken");
      return response.result.token;
    } catch (error) {
      this.logger.error("WS Token not retrieved due to:", error);
      throw new Error("WS Token not retrieved due to:", error);
    }
  }

  #handleMessage(data) {
    try {
      const message = JSON.parse(data.toString());

      // Enhanced debugging
      this.logger.info("Raw WS message received:", {
        messageType: message.event || "data update",
        content: message,
      });

      // Handle subscription status with more detail
      if (message.event === "subscriptionStatus") {
        this.logger.warn("Subscription status update:", {
          status: message.status,
          subscription: message.subscription,
          errorMessage: message.errorMessage,
        });

        if (message.status === "error") {
          this.logger.error("Subscription failed:", {
            error: message.errorMessage,
            subscription: message.subscription,
          });
        }
      }

      if (message.channel !== "heartbeat") {
        this.logger.info("Received message:", message);
        const ordersData = message.data;
        const limitOrders = ordersData.filter((orderObj) => {
          if (orderObj.order_type === "limit" && orderObj.order_status === "filled") return orderObj;
        });
        console.log("Limit orders =>", limitOrders);
      }
    } catch (error) {
      this.logger.error("Error processing message:", error);
      this.logger.error("Raw message data:", data.toString());
    }
  }

  /**
   * Handle subscription status messages
   * @param {Object} message Status message
   * @private
   */
  #handleSubscriptionStatus(message) {
    if (message.status === "subscribed") {
      this.logger.info("Successfully subscribed to order updates");
    } else if (message.status === "error") {
      this.logger.error("Subscription error:", message.errorMessage);
    }
  }

  /**
   * Handle trade update messages
   * @param {Object} message Trade message
   * @private
   */
  #handleTradeUpdate(message) {
    // Emit trade event for external handling
    this.emit("orderUpdate", {
      orderId: message.orderId,
      status: message.status,
      timestamp: message.timestamp,
      price: message.price,
      volume: message.volume,
    });
  }

  /**
   * Setup WebSocket ping interval
   * @private
   */
  #setupPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, 30000);
  }

  /**
   * Handle WebSocket reconnection
   * @private
   */
  #handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

      this.logger.info(`Attempting to reconnect in ${delay / 1000} seconds...`);

      setTimeout(() => {
        this.#connect();
      }, delay);
    } else {
      this.logger.error("Max reconnection attempts reached");
      this.emit("error", new Error("Max reconnection attempts reached"));
    }
  }

  /**
   * Clean up WebSocket resources
   * @private
   */
  #cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.ws) {
      this.ws.removeAllListeners();
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }
      this.ws = null;
    }
  }
}
