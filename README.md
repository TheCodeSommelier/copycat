# Trading Bot Email Parser

#### *🛑 !Early dev stages: Please keep in mind the docs are subject to change and so is the code! 🛑*

## Overview
A Node.js application that monitors an email inbox for trading instructions and executes them on the Binance exchange. The application follows clean architecture principles for maintainability and scalability.

## Features
- Email monitoring (IMAP/POP3)
- Automated trade execution
- Secure credential management
- Comprehensive logging
- Error handling and notifications
- Real-time email processing

## Project Structure
```
trading-bot/
├── src
├── app.js
├── config
│   ├── binance.js
│   ├── email.js
│   ├── imap.js
│   ├── index.js
│   └── trading.js
├── core
│   ├── entities
│   │   ├── email.js
│   │   ├── futuresTrade.js
│   │   ├── index.js
│   │   └── spotTrade.js
│   ├── ports
│   │   ├── emailPort.js
│   │   ├── index.js
│   │   └── tradingPort.js
│   └── use-cases
│       ├── executeTrade.js
│       ├── index.js
│       └── processEmail.js
├── infrastructure
│   ├── email
│   │   ├── emailParser.js
│   │   ├── emailValidator.js
│   │   ├── imapClient.js
│   │   ├── index.js
│   │   └── TradeDataParser.js
│   └── trading
│       ├── binance
│       │   ├── futuresClient.js
│       │   └── spotClient.js
│       ├── index.js
│       ├── tradeValidator.js
│       └── utils.js
├── services
│   ├── emailService.js
│   ├── logger.js
│   └── tradingService.js
├── tests
│   ├── integration
│   └── unit
│       ├── infrastructure
│       └── services
├── utils
|   ├── errors.js
|   ├── index.js
|   └── validation.js
├── .env
├── .gitignore
├── package-lock.json
├── package.json
└── README.md
```

## Architecture Overview

### Core Layer
- **Entities**: Define the core business objects (emails, trades)
- **Ports**: Define interfaces for external services
- **Use Cases**: Implement business logic

### Infrastructure Layer
- Implements external service interactions
- Provides concrete implementations of ports
- Handles external API communications

### Services Layer
- Orchestrates between different parts of the application
- Manages business processes
- Handles cross-cutting concerns

## Setup

### Prerequisites
- Node.js (v22 or higher)
- npm

### Installation
```bash
# Clone the repository
git clone https://github.com/TheCodeSommelier/copycat.git

# Install dependencies
npm install

# Create environment files
cp .env
```

### Configuration
Create a `.env` file with the following variables:
```
EMAIL_USER=your_email
EMAIL_PASSWORD=your_password
IMAP_HOST=imap.active24.com
IMAP_PORT=993

BINANCE_API_KEY=your_binance_key
BINANCE_API_SECRET=your_binance_secret
```

### Running the Application !!!TBD!!!
```bash
# Development
npm run dev

# To run on your computer in the background
npm run copy-trades

# To check logs
npm run logs
```

## Email Format !!!TBD!!!
The application expects emails in the following format:
```
Subject: [TICKER] [ACTION]
Body:
Quantity: [AMOUNT]
Price: [PRICE]
```

Example:
```
Subject: BTC BUY
Body:
Quantity: 0.1
Price: 50000
```

## Security
- Encrypted credential storage
- Secure email communication
- API key protection
- Input validation
- Error handling

## Testing
```bash
# Run all tests
npm test
```

## Development Commands
```bash
# Start development server
npm run dev

# Lint code
npm run lint

# Format code
npm run format
```

## Architecture Details

### Ports
The application uses ports (interfaces) to define contracts between different parts of the system:
- **EmailPort**: Defines email service capabilities
- **TradingPort**: Defines trading service capabilities

This allows for:
- Easy testing through mocking
- Simple implementation swapping
- Clear service boundaries

### Error Handling
- Custom error classes for different scenarios
- Comprehensive logging
- Error recovery mechanisms

### Logging
- Different log levels (error, info, debug)
- File and console logging
- Structured log format

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License !!!TBD!!!
[Your License Choice]

## Support
For support, email tm@tony-masek.com or create an issue in the repository.

## Order types

1. LIMIT Order

```
{
  symbol: "BTCUSDT",
  side: "BUY",
  type: "LIMIT",
  timeInForce: "GTC", // GTC, IOC, FOK
  quantity: "0.001",
  price: "50000"
}
```

- Most basic type of order
- You specify the price and quantity
- Will only execute at the specified price or better
- TimeInForce options:

GTC (Good Till Cancelled)
IOC (Immediate or Cancel)
FOK (Fill or Kill)


2. MARKET Order

```
{
  symbol: "BTCUSDT",
  side: "BUY",
  type: "MARKET",
  quantity: "0.001"
}
```

- Executes immediately at best available price
- No price specification needed
- Higher fees than limit orders


3. STOP_LOSS Order

```
{
  symbol: "BTCUSDT",
  side: "SELL",
  type: "STOP_LOSS",
  quantity: "0.001",
  stopPrice: "45000"
}
```

- Triggers a market order when price reaches stopPrice
- Used to limit losses
- Executes at market price when triggered


4. STOP_LOSS_LIMIT Order

```
{
  symbol: "BTCUSDT",
  side: "SELL",
  type: "STOP_LOSS_LIMIT",
  timeInForce: "GTC",
  quantity: "0.001",
  price: "44900",
  stopPrice: "45000"
}
```

- Like STOP_LOSS but places limit order instead of market order
- Requires both stopPrice and limit price


5. TAKE_PROFIT Order

```
{
  symbol: "BTCUSDT",
  side: "SELL",
  type: "TAKE_PROFIT",
  quantity: "0.001",
  stopPrice: "55000"
}
```

- Similar to STOP_LOSS but for taking profits
- Triggers when price goes above stopPrice (for sells)


6. TAKE_PROFIT_LIMIT Order

```
{
  symbol: "BTCUSDT",
  side: "SELL",
  type: "TAKE_PROFIT_LIMIT",
  timeInForce: "GTC",
  quantity: "0.001",
  price: "55100",
  stopPrice: "55000"
}
```

- Like TAKE_PROFIT but places limit order instead of market order


7. LIMIT_MAKER Order

```
{
  symbol: "BTCUSDT",
  side: "BUY",
  type: "LIMIT_MAKER",
  quantity: "0.001",
  price: "50000"
}
```

- Limit order that will be rejected if it would immediately match and trade
- Ensures you are always the maker, never the taker


8. OCO (One-Cancels-the-Other) Order

```
{
  symbol: "BTCUSDT",
  side: "SELL",
  quantity: "0.001",
  price: "55000",        // Limit price
  stopPrice: "45000",    // Stop price
  stopLimitPrice: "44900" // If provided, makes stop-limit instead of stop-market
}
```

- Combination of STOP_LOSS and LIMIT order
- When one triggers, other is cancelled
- Good for setting both take profit and stop loss

Additional Order Parameters:

- Time In Force (TIF):
  - GTC (Good Till Cancelled) - Order valid until cancelled
  - IOC (Immediate Or Cancel) - Fill what's possible immediately, cancel rest
  - FOK (Fill Or Kill) - Fill entire order immediately or cancel all




Optional Parameters:
```
{
  newClientOrderId: "myOrder123",   // Custom order ID
  icebergQty: "1.0",               // For iceberg orders
  newOrderRespType: "FULL",        // ACK, RESULT, or FULL
  recvWindow: 5000                 // Request validity window
}
```

Special Order Features:

- Iceberg Orders
  - Add icebergQty to LIMIT orders
  - Only shows specified quantity to market
  - Must be larger than minimum allowed

- POST_ONLY Orders
  - Add timeInForce: "GTX" to ensure order is maker only
  - Alternative to LIMIT_MAKER type

Example of a complete order with all possible parameters:
```
{
  symbol: "BTCUSDT",
  side: "BUY",
  type: "LIMIT",
  timeInForce: "GTC",
  quantity: "0.001",
  price: "50000",
  newClientOrderId: "myOrder123",
  icebergQty: "0.0005",
  newOrderRespType: "FULL",
  recvWindow: 5000
}
```
