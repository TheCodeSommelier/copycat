export default class KrakenAccountService {
  constructor(logger, apiClient) {
    this.logger = logger;
    this.apiClient = apiClient;
  }

  async getBalance(apiConfig, endpoint, asset) {
    const nonce = Date.now().toString();
    const apiCallBlcObj = await this.apiClient.apiCall(apiConfig, "POST", endpoint, { nonce });
    const blc = apiCallBlcObj.result[asset];
    console.log("Api call result... BALANCE", apiCallBlcObj);
    console.log("BALANCE", blc);
    return blc;
  }
}
