export default class EmailValidator {
  static validateEmail(emailData) {
    const result = [this.#validateAddressFrom(emailData.from)];
    return result;
  }

  static #validateAddressFrom(addressFrom) {
    const allowedDomains = ["tony-masek.com"];
    const domain = addressFrom.value[0].address.split("@")[1];
    return allowedDomains.includes(domain);
  }
}
