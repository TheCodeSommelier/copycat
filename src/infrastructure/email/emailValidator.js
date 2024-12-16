import dotenv from "dotenv";
dotenv.config();

export default class EmailValidator {
  static validateEmail(emailData) {
    const result = [];
    const messages = [];

    this.#validateAddressFrom(emailData.from, result, messages);
    this.#validateEmailHtml(emailData.html, result, messages);

    return { result, messages };
  }

  static #validateAddressFrom(addressFrom, result, messages) {
    const allowedDomains = ["tony-masek.com", process.env.TRADER_DOMAIN];
    const email = addressFrom.value[0]?.address;
    const domain = email ? email.split("@")[1] : "";

    if (
      allowedDomains.includes(domain) &&
      typeof addressFrom === "object" &&
      addressFrom.value.length !== 0
    ) {
      result.push(true);
      return;
    }
    messages.push("Needs to come from the allowed sender!");
    result.push(false);
  }

  static #validateEmailHtml(html, result, messages) {
    if (html && html.length > 0 && typeof html === "string") {
      result.push(true);
      return;
    }
    messages.push("Html cannot be empty!!");
    result.push(false);
  }
}
