import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { withX402 } from "@x402/next";
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { registerExactEvmScheme } from "@x402/evm/exact/server";

// Initialize Gemini AI
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

// Your receiving wallet address
const payTo = process.env.WALLET_ADDRESS || "0xYourWalletAddressHere";

// Create facilitator client (testnet - Base Sepolia)
const facilitatorClient = new HTTPFacilitatorClient({
  url: "https://x402.org/facilitator"
});

// Create resource server and register EVM scheme
const server = new x402ResourceServer(facilitatorClient);
registerExactEvmScheme(server); // Register the EVM scheme

// Define payment configuration
const routeConfig = {
  accepts: [
    {
      scheme: "exact" as const,
      price: "$0.01", // 1 cent per AI request
      network: "eip155:84532" as `${string}:${string}`, // Base Sepolia testnet
      payTo,
    },
  ],
  description: "AI-powered content generation using Google Gemini 2.5 Flash",
  mimeType: "application/json",
  extensions: {
    bazaar: {
      discoverable: true,
      category: "ai",
      tags: ["gemini", "ai", "generation", "llm"],
    },
  },
};

// API route handler with AI logic
const handler = async (req: NextRequest): Promise<NextResponse> => {
  try {
    // Parse request body
    const body = await req.json();
    const { prompt, model = "gemini-2.5-flash" } = body;

    // Validate prompt
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Invalid request: 'prompt' is required and must be a string" },
        { status: 400 }
      );
    }

    // Generate AI response using Gemini
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    // Return the AI-generated content
    return NextResponse.json({
      success: true,
      data: {
        text: response.text,
        model,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate AI response",
        details: error.message,
      },
      { status: 500 }
    );
  }
};

// Wrap the handler with x402 payment protection
// Payment is only settled after successful response (status < 400)
export const POST = withX402(handler, routeConfig, server);
export const GET = async (req: NextRequest) => {
  return NextResponse.json({
    message: "AI API Gateway is running",
    endpoint: "/api/ai",
    method: "POST",
    paymentRequired: true,
    cost: "$0.01 per request",
    network: "Base Sepolia (testnet)",
    body: {
      prompt: "Your prompt here",
      model: "gemini-2.5-flash",
    },
  });
};
