import dotenv from "dotenv";
dotenv.config();

export default class EmailValidator {
  static validateEmail(emailData) {
    const result = [
      this.#validateAddressFrom(emailData.from),
      validateEmailType(emailData.subject),
    ];
    return result;
  }

  static #validateAddressFrom(addressFrom) {
    const allowedDomains = ["tony-masek.com", process.env.TRADER_DOMAIN];

    const domain = addressFrom.value[0].address.split("@")[1];
    return allowedDomains.includes(domain);
  }

  // Makes sure we only act upon the trade alerts
  static validateEmailType(subject) {
    const regex = /\w+\s+(alert|Alert):\s+\w{0,}\/\w{0,}/g;
    return subject.test(regex);
  }
}
