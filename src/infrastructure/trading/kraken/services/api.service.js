import crypto from "crypto";
import querystring from "querystring";

export default class KrakenApiService {
  constructor(logger) {
    this.logger = logger;
  }

  async makeFuturesApiCall(apiConfig, method, endpoint, data = {}, needSign = true) {
    try {
      // Construct base URL
      let url = `${apiConfig.baseUrl}${endpoint}`;
      let queryParams = "";
      let postData = "";
      const nonce = Date.now().toString();

      const headers = {
        Accept: "application/json",
      };

      if (method === "POST") {
        data.nonce = nonce;
        postData = JSON.stringify(data);
        headers["Content-Type"] = "application/json";
      } else if (method === "GET" && Object.keys(data).length > 0) {
        // For GET with parameters, properly URL encode them
        const urlSearchParams = new URLSearchParams();
        Object.entries(data).forEach(([key, value]) => {
          urlSearchParams.append(key, value);
        });

        queryParams = urlSearchParams.toString();
        postData = queryParams;
        url = `${url}?${queryParams}`;
      }

      if (needSign) {
        headers["APIKey"] = apiConfig.apiKey;
        headers["Nonce"] = nonce;
        headers["Authent"] = this.#signReq(apiConfig.secret, endpoint, postData);

        this.logger.warn("Futures API call details:", {
          method,
          endpoint,
          nonce,
          url,
        });
      }

      const fetchOptions = {
        method,
        headers,
      };

      if (method === "POST" && Object.keys(data).length > 0) {
        fetchOptions.body = JSON.stringify(data);
      }

      this.logger.warn("Making Futures API request:", {
        url,
        options: { ...fetchOptions, body: fetchOptions.body ? "..." : undefined },
      });
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const errMsg = await response.text();
        throw new Error(`Kraken Futures API error (${response.status}): ${errMsg}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error("Kraken Futures API call failed:", error);
      throw error;
    }
  }

  /**
   * Makes an API call or the kraken exchange
   * @param {Object} apiConfig - Object with the api key, api secret and the base url
   * @param {String} method - REST method (GET, DELETE, POST, PUT)
   * @param {String} endpoint - Endpoint to for the call to go to
   * @param {Object} body - Body to be sent in the request
   * @param {Boolean} needSign - If true req will be signed
   * @returns {JSON} - API response
   */
  async makeApiCall(apiConfig, method, endpoint, body = {}, needSign = true) {
    try {
      const headers = {};
      if (needSign) {
        console.log("I ran and needSing is:", needSign);

        body.nonce = Date.now().toString();
        let actualEndpoint = endpoint;

        const sign = this.#signReq(apiConfig.secret, actualEndpoint, body);
        headers["API-Key"] = apiConfig.apiKey;
        headers["API-Sign"] = sign;
        headers["Content-Type"] = "application/x-www-form-urlencoded";
        if (method === "GET") {
          actualEndpoint += `?nonce=${body.nonce}`;
          console.log("actualEndpoint:", actualEndpoint);
        }
      }

      const fetchOptions = {
        method,
        headers,
      };

      if (method === "POST") {
        fetchOptions.body = querystring.stringify(body);
      }

      const result = await fetch(`${apiConfig.baseUrl}${endpoint}`, fetchOptions);

      if (!result.ok) {
        const errMsg = await result.text();
        throw new Error(`Kraken API error (${result.status}): ${errMsg}`);
      }

      const response = await result.json();
      return response;
    } catch (error) {
      this.logger.error("Kraken api call failed: ", error);
      throw error;
    }
  }

  #signReq(secret, urlPath, data) {
    try {
      let encoded;
      if (typeof data === "string") {
        const jsonData = JSON.parse(data);
        encoded = jsonData.nonce + data;
      } else if (typeof data === "object") {
        const dataStr = querystring.stringify(data);
        encoded = data.nonce + dataStr;
      } else {
        throw new Error("Invalid data type");
      }

      const sha256Hash = crypto.createHash("sha256").update(encoded).digest();
      const message = urlPath + sha256Hash.toString("binary");
      const secretBuffer = Buffer.from(secret, "base64");
      const hmac = crypto.createHmac("sha512", secretBuffer);
      hmac.update(message, "binary");
      const signature = hmac.digest("base64");
      return signature;
    } catch (error) {
      throw new Error(`Failed to sign request: ${error.message}`);
    }
  }
}
