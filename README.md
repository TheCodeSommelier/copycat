# Trading Bot Email Parser

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
├── src/
│   ├── config/                # Configuration
│   │
│   ├── core/                  # Core business logic
│   │   ├── entities/          # Business objects
│   │   ├── ports/             # Interface definitions
│   │   └── use-cases/         # Business use cases
│   │
│   ├── infrastructure/        # External implementations
│   │   ├── email/             # Email handling
│   │   ├── trading/           # Trading operations
│   │   └── security/          # Security services
│   │
│   ├── services/              # Application services
│   │   ├── emailService.js    # Email processing
│   │   ├── tradingService.js  # Trading operations
│   │   └── loggerService.js   # Logging utilities
│   │
│   ├── utils/                 # Utility functions
│   └── app.js                 # Application entry
│
├── tests/                     # Test files
└── [Configuration files]
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
cp .env.email .env.trading .env
```

### Configuration
Create a `.env.email` file with the following variables:
```
EMAIL_USER=your_email
EMAIL_PASSWORD=your_password
IMAP_HOST=imap.active24.com
IMAP_PORT=993
```
Create a `.env.trading` file with the following variables:
```
BINANCE_API_KEY=your_binance_key
BINANCE_API_SECRET=your_binance_secret
ENCRYPTION_KEY=your-32-character-encryption-key
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

# Run with coverage
npm run test:coverage
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
