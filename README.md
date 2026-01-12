# ConduitX AI Gateway

An AI-powered API gateway that integrates Google Gemini with the x402 payment protocol for micropayments.

## Features

- 🤖 **AI-Powered**: Uses Google Gemini 2.0 Flash for content generation
- 💰 **x402 Payment Protocol**: Accepts crypto payments via Base Sepolia testnet
- 🔒 **Payment-Gated API**: Routes protected by micropayment requirements
- 🌐 **Next.js 16**: Built with the latest Next.js App Router
- 🎨 **Modern UI**: Clean, responsive interface with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- A crypto wallet (EVM-compatible, e.g., MetaMask)
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add:
   - `GOOGLE_API_KEY`: Your Google Gemini API key
   - `WALLET_ADDRESS`: Your EVM wallet address to receive payments

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## API Documentation

### Endpoint: `POST /api/ai`

Generate AI content using Gemini with x402 payment protection.

**Payment Required:**
- Cost: $0.01 per request (USDC)
- Network: Base Sepolia (testnet)
- Protocol: x402

**Request Body:**
```json
{
  "prompt": "Your prompt here",
  "model": "gemini-2.0-flash-exp" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "text": "AI-generated response",
    "model": "gemini-2.0-flash-exp",
    "timestamp": "2026-01-12T00:00:00.000Z"
  }
}
```

### Testing the Payment Flow

1. **Make a request without payment:**
   ```bash
   curl -X POST http://localhost:3000/api/ai \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Explain AI in simple terms"}'
   ```
   
   Response: `402 Payment Required` with payment instructions

2. **Complete payment using x402 client:**
   See the [x402 Buyer's Guide](https://docs.cdp.coinbase.com/x402/quickstart-for-buyers) for client setup

3. **Retry request with payment signature:**
   Include the `PAYMENT-SIGNATURE` header with your request

## Project Structure

```
conduitx-api-gateway/
├── app/
│   ├── api/
│   │   └── ai/
│   │       └── route.ts      # x402-protected AI endpoint
│   ├── layout.tsx
│   ├── page.tsx              # Frontend UI
│   └── globals.css
├── .env.example              # Environment template
├── package.json
└── README.md
```

## Moving to Production (Mainnet)

To accept real payments on Base mainnet:

1. **Get CDP API Keys:**
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
   Use a real mainnet wallet address where you want to receive USDC

## Technologies Used

- **Next.js 16** - React framework
- **Google Gemini** - AI model
- **x402 Protocol** - Crypto payment middleware
- **Base Sepolia** - Testnet blockchain
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## Resources

- [x402 Documentation](https://docs.cdp.coinbase.com/x402)
- [Google Gemini API](https://ai.google.dev/)
- [Base Network](https://base.org/)
- [Coinbase Developer Platform](https://cdp.coinbase.com/)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## License

MIT

## Support

For questions or issues:
- x402 Discord: [discord.gg/cdp](https://discord.gg/cdp)
- Open an issue on GitHub
