"use client";

import React, { useState } from "react";
import { useAccount, useConnect, useDisconnect, useWalletClient, useSwitchChain } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { x402Client } from "@x402/core/client";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import type { WalletClient, Account } from "viem";
import type { ClientEvmSigner } from "@x402/evm";

// Convert wagmi wallet client to x402 signer
function wagmiToClientSigner(walletClient: WalletClient): ClientEvmSigner {
  if (!walletClient.account) {
    throw new Error("Wallet client must have an account");
  }

  return {
    address: walletClient.account.address,
    signTypedData: async (message) => {
      const signature = await walletClient.signTypedData({
        account: walletClient.account as Account,
        domain: message.domain,
        types: message.types,
        primaryType: message.primaryType,
        message: message.message,
      });
      return signature;
    },
  };
}

export default function Page() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState<any>(null);
  const [paymentRequired, setPaymentRequired] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [mounted, setMounted] = useState(false);

  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient({ chainId: baseSepolia.id });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    console.log("Wallet state changed - isConnected:", isConnected, "chain:", chain?.id, "walletClient:", walletClient);
  }, [isConnected, chain, walletClient]);

  const getApiInfo = async () => {
    try {
      const res = await fetch("/api/ai");
      const data = await res.json();
      setInfo(data);
    } catch (err) {
      console.error("Failed to fetch API info:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Submit clicked - isConnected:", isConnected, "walletClient:", walletClient);
    
    if (!isConnected || !walletClient) {
      const errorMsg = !isConnected 
        ? "Wallet not connected" 
        : "Wallet client not loaded - please try again in a moment";
      console.error("Cannot submit:", errorMsg);
      setError(errorMsg);
      return;
    }

    setLoading(true);
    setError("");
    setResponse("");
    setPaymentRequired(null);
    setPaymentStatus("Making initial request...");

    try {
      // Step 1: Make initial request without payment
      const initialRes = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (initialRes.status === 402) {
        // Step 2: Payment required - parse payment requirements
        setPaymentStatus("Payment required - preparing transaction...");
        const paymentHeader = initialRes.headers.get("PAYMENT-REQUIRED");
        
        if (!paymentHeader) {
          throw new Error("Payment required but no payment instructions received");
        }

        // Decode base64 payment requirements (v2 protocol)
        const paymentData = JSON.parse(atob(paymentHeader));
        setPaymentRequired(paymentData);

        // Step 3: Create x402 client and sign payment
        setPaymentStatus("Please sign the payment in MetaMask...");
        
        console.log("Creating x402 client...");
        const client = new x402Client();
        const signer = wagmiToClientSigner(walletClient);
        registerExactEvmScheme(client, { signer });

        console.log("Creating payment payload...", paymentData);
        // Create payment payload
        const paymentPayload = await client.createPaymentPayload(paymentData);
        console.log("Payment payload created:", paymentPayload);
        
        // Encode payment signature (v2 protocol uses base64 JSON)
        const paymentSignature = btoa(JSON.stringify(paymentPayload));
        console.log("Payment signature encoded");

        // Step 4: Retry request with payment signature
        setPaymentStatus("Payment signed - sending request...");
        const paidRes = await fetch("/api/ai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "PAYMENT-SIGNATURE": paymentSignature,
          },
          body: JSON.stringify({ prompt }),
        });

        console.log("Paid response status:", paidRes.status);

        if (!paidRes.ok) {
          const errorData = await paidRes.json();
          console.error("Paid request failed:", errorData);
          throw new Error(errorData.error || "Request failed after payment");
        }

        // Step 5: Success! Get the AI response
        const data = await paidRes.json();
        setResponse(data.data.text);
        setPaymentStatus("Payment successful! ✅");
        
      } else if (!initialRes.ok) {
        const data = await initialRes.json();
        throw new Error(data.error || "Failed to generate response");
      } else {
        // No payment required (shouldn't happen with current setup)
        const data = await initialRes.json();
        setResponse(data.data.text);
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "Payment failed");
      setPaymentStatus("");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    getApiInfo();
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Wallet Connection Header */}
        <div className="flex justify-end mb-4">
          {mounted && (
            <>
              {isConnected ? (
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-md">
                  <div className="text-sm">
                    <p className="text-gray-600">Connected:</p>
                    <p className="font-mono font-semibold text-gray-900">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </p>
                  </div>
                  <button
                    onClick={() => disconnect()}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors text-sm"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => connect({ connector: connectors[0] })}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md"
                >
                  🦊 Connect MetaMask
                </button>
              )}
            </>
          )}
        </div>

        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            ConduitX AI Gateway
          </h1>
          <p className="text-xl text-gray-600">
            AI-powered content generation with x402 payment protocol
          </p>
        </div>

        {/* {info && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              API Information
            </h2>
            <div className="space-y-2 text-gray-700">
              <p>
                <span className="font-semibold">Endpoint:</span> {info.endpoint}
              </p>
              <p>
                <span className="font-semibold">Method:</span> {info.method}
              </p>
              <p>
                <span className="font-semibold">Cost:</span> {info.cost}
              </p>
              <p>
                <span className="font-semibold">Network:</span> {info.network}
              </p>
              <p className="text-sm text-yellow-600 mt-4">
                ⚠️ Note: This is a testnet demo. To make payments, you need an
                x402-compatible client or use the command-line examples below.
              </p>
            </div>
          </div>
        )} */}

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="prompt"
                className="block text-lg font-medium text-gray-700 mb-2"
              >
                Enter your prompt
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Explain how blockchain works in simple terms"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-900"
                rows={4}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !prompt.trim() || !isConnected || !walletClient}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading
                ? paymentStatus || "Processing..."
                : !isConnected
                  ? "Connect Wallet to Continue"
                  : !walletClient
                    ? "Loading wallet..."
                    : "Generate AI Response ($0.01)"}
            </button>

            {!isConnected && (
              <p className="text-sm text-gray-600 text-center mt-2">
                Please connect your MetaMask wallet to use the AI gateway
              </p>
            )}
            
            {isConnected && chain?.id !== baseSepolia.id && (
              <div className="text-center mt-3">
                <button
                  onClick={() => switchChain?.({ chainId: baseSepolia.id })}
                  className="bg-yellow-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
                >
                  ⚠️ Switch to Base Sepolia Network
                </button>
              </div>
            )}
            
            {isConnected && chain?.id === baseSepolia.id && !walletClient && (
              <p className="text-sm text-yellow-600 text-center mt-2">
                ⏳ Loading wallet client... Please wait a moment
              </p>
            )}
          </form>

          {paymentStatus && !error && !response && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 font-semibold">
                {paymentStatus}
              </p>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold">{error}</p>
              
              {paymentRequired && (
                <div className="mt-3 text-sm text-red-700">
                  <p>Payment Requirements:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Network: Base Sepolia (Testnet)</li>
                    <li>Cost: $0.01 USDC</li>
                    <li>
                      Get testnet USDC:{" "}
                      <a
                        href="https://faucet.circle.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-red-900"
                      >
                        Circle Faucet
                      </a>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {response && (
            <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                AI Response:
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{response}</p>
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-gray-600">
          <p className="text-sm">
            Powered by Google Gemini + x402 Protocol on Base Sepolia
          </p>
        </div>
      </div>
    </div>
  );
}
