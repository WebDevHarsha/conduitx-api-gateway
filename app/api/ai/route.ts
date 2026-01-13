import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { verifyPayment } from "../../lib/payment";

// Initialize Gemini AI
// NOTE: Ensure GOOGLE_API_KEY is set in .env
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY || "",
});

const COST_IN_CAT = 1; // 1 CAT Token

// API route handler with AI logic
const handler = async (req: NextRequest): Promise<NextResponse> => {
  // 1. Verify Payment
  const paymentResponse = await verifyPayment(req, COST_IN_CAT);
  if (paymentResponse) {
    return paymentResponse;
  }

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

    // Check API Key
    if (!process.env.GOOGLE_API_KEY) {
      console.error("Error: GOOGLE_API_KEY is missing in environment variables.");
      return NextResponse.json(
        { error: "Server Configuration Error: Missing API Key" },
        { status: 500 }
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
    console.error("AI generation error full details:", error);
    return NextResponse.json(
      {
        error: "Failed to generate AI response",
        details: error.message || error.toString(),
      },
      { status: 500 }
    );
  }
};

export const POST = handler;

export const GET = async (req: NextRequest) => {
  return NextResponse.json({
    message: "AI API Gateway is running",
    endpoint: "/api/ai",
    method: "POST",
    paymentRequired: true,
    cost: "1 CAT Token",
    network: "Shardeum EVM Testnet",
  });
};
