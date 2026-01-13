# ConduitX AI Gateway

An AI-powered API gateway that integrates Google Gemini with the x402 payment protocol for micropayments on multiple blockchain networks.

## Features

- 🤖 **AI-Powered**: Uses Google Gemini 2.0 Flash for content generation
- 💰 **Multi-Chain Payment Protocol**: Accepts crypto payments via Base Sepolia testnet and Shardeum testnet
- 🔒 **Payment-Gated API**: Routes protected by micropayment requirements
- 🌐 **Next.js 16**: Built with the latest Next.js App Router
- 🎨 **Modern UI**: Clean, responsive interface with Tailwind CSS
- 🪙 **Custom Token Support**: CAT token on Shardeum testnet

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- A crypto wallet (EVM-compatible, e.g., MetaMask)
- Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add the following configuration:

#### Google Gemini API Key
Get one here: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

```bash
GOOGLE_API_KEY={put your gemini api key from google ai studio here}
```

#### Shardeum Payment Configuration

Default: CAT Token on Shardeum Testnet

```bash
# CAT Token Address on Shardeum Testnet
CAT_TOKEN_ADDRESS=0x4f84710401a38d70F78A7978912Cd8fd1F51E583

# Server Wallet Address (Recipient of payments)
# Replace this with your own wallet address if needed
SERVER_WALLET_ADDRESS=0x742d35Cc6634C0532925a3b844Bc454e4438f44e
```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## API Documentation

### Endpoint: `POST /api/ai`

Generate AI content using Gemini with x402 payment protection.

**Payment Options:**
- **Base Sepolia (Testnet)**: USDC payments
  - Cost: $0.01 per request
  - Network: Base Sepolia
  - Protocol: x402

- **Shardeum Testnet**: CAT Token payments
  - Cost: CAT tokens per request (configurable)
  - Network: Shardeum Testnet
  - Token: CAT (0x4f84710401a38d70F78A7978912Cd8fd1F51E583)
  - Protocol: x402

**Request Body:**
```json
{
  "prompt": "Your prompt here",
  "model": "gemini-2.0-flash-exp",
  "network": "shardeum" // optional, defaults to base sepolia
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "text": "AI-generated response",
    "model": "gemini-2.0-flash-exp",
    "timestamp": "2026-01-13T00:00:00.000Z",
    "network": "shardeum"
  }
}
```

### Testing the Payment Flow

1. **Make a request without payment:**
   ```bash
   curl -X POST http://localhost:3000/api/ai \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Explain AI in simple terms", "network": "shardeum"}'
   ```
   
   Response: `402 Payment Required` with payment instructions

2. **Complete payment using x402 client:**
   - For Base Sepolia: See the [x402 Buyer's Guide](https://docs.cdp.coinbase.com/x402/quickstart-for-buyers)
   - For Shardeum: Use CAT token with the configured CAT_TOKEN_ADDRESS

3. **Retry request with payment signature:**
   Include the `PAYMENT-SIGNATURE` header with your request

## Project Structure

```
conduitx-api-gateway/
├── app/
│   ├── api/
│   │   └── ai/
│   │       └── route.ts           # x402-protected AI endpoint
│   ├── layout.tsx
│   ├── page.tsx                   # Frontend UI
│   └── globals.css
├── .env.example                   # Environment template
├── package.json
└── README.md
```

## Configuration Guide

### Environment Variables (.env)

```bash
# Google Gemini API Configuration
GOOGLE_API_KEY=your_gemini_api_key_here

# Shardeum Testnet Configuration
CAT_TOKEN_ADDRESS=0x4f84710401a38d70F78A7978912Cd8fd1F51E583
SERVER_WALLET_ADDRESS=0x742d35Cc6634C0532925a3b844Bc454e4438f44e

# Optional: Custom Model Configuration
GEMINI_MODEL=gemini-2.0-flash-exp
```

## Supported Networks

### Base Sepolia (Testnet)
- **Network ID**: eip155:84532
- **Token**: USDC
- **Status**: Testnet (recommended for development)

### Shardeum Testnet
- **Network ID**: Shardeum Testnet
- **Token**: CAT (Custom AI Token)
- **Token Address**: 0x4f84710401a38d70F78A7978912Cd8fd1F51E583
- **Status**: Testnet (AI-optimized payments)

## Moving to Production (Mainnet)

To accept real payments on Base mainnet or Shardeum mainnet:

1. **Get CDP API Keys (for Base mainnet):**
   - Sign up at [cdp.coinbase.com](https://cdp.coinbase.com/)
   - Create API credentials

2. **Update environment variables:**
   ```bash
   CDP_API_KEY_ID=your_api_key_id
   CDP_API_KEY_SECRET=your_api_key_secret
   ```

3. **Update the API route** ([app/api/ai/route.ts](app/api/ai/route.ts)):
   ```typescript
   // Change facilitator URL
   const facilitatorClient = new HTTPFacilitatorClient({
     url: "https://api.cdp.coinbase.com/platform/v2/x402"
   });
   
   // Change network to mainnet
   const server = new x402ResourceServer(facilitatorClient)
     .register("eip155:8453", new ExactEvmScheme()); // Base mainnet
   
   // Update route config
   network: "eip155:8453", // Base mainnet
   ```

4. **Update wallet address:**
   Use a real mainnet wallet address where you want to receive payments

5. **For Shardeum mainnet:**
   - Update CAT_TOKEN_ADDRESS to mainnet token address
   - Update SERVER_WALLET_ADDRESS to your mainnet wallet
   - Configure mainnet RPC endpoint

## Technologies Used

- **Next.js 16** - React framework
- **Google Gemini** - AI model for content generation
- **x402 Protocol** - Crypto payment middleware
- **Base Sepolia** - Testnet blockchain (USDC payments)
- **Shardeum Testnet** - Testnet blockchain (CAT token payments)
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## Resources

- [Google Gemini API](https://ai.google.dev/)
- [x402 Documentation](https://docs.cdp.coinbase.com/x402)
- [Base Network](https://base.org/)
- [Shardeum Network](https://shardeum.org/)
- [Coinbase Developer Platform](https://cdp.coinbase.com/)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## License

MIT

## Support

For questions or issues:
- x402 Discord: [discord.gg/cdp](https://discord.gg/cdp)
- Shardeum Community: [discord.gg/shardeum](https://discord.gg/shardeum)
- Open an issue on GitHub
