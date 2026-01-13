"use client";

import React, { useState } from "react";
import { useAccount, useConnect, useDisconnect, useWalletClient, useSwitchChain, usePublicClient } from "wagmi";
import { shardeumMezame } from "./lib/chains";
import { parseAbi, formatUnits } from "viem";

export default function Page() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [mounted, setMounted] = useState(false);

  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !walletClient) {
      setError("Please connect wallet first");
      return;
    }

    setLoading(true);
    setError("");
    setResponse("");
    setPaymentStatus("Sending request...");

    try {
      // 1. Initial Request
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (res.status === 402) {
        setPaymentStatus("Payment Required (402). Parsing details...");
        const tokenAddr = res.headers.get("x-payment-token");
        const amount = res.headers.get("x-payment-amount");
        const recipient = res.headers.get("x-payment-recipient");

        if (!tokenAddr || !amount || !recipient) {
          throw new Error("Invalid 402 Response headers");
        }

        // 2. Execute Payment
        setPaymentStatus(`Paying ${amount} CAT to ${recipient.slice(0, 6)}...`);

        const ERC20_ABI = parseAbi([
          'function transfer(address recipient, uint256 amount) returns (bool)'
        ]);

        const hash = await walletClient.writeContract({
          address: tokenAddr as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [recipient as `0x${string}`, BigInt(Number(amount) * 10 ** 18)],
          chain: shardeumMezame,
          account: address
        });

        setPaymentStatus(`Transaction sent: ${hash}. Waiting for confirmation...`);

        await publicClient?.waitForTransactionReceipt({ hash });

        // 3. Retry with Proof
        setPaymentStatus("Transaction confirmed! Getting content...");

        const paidRes = await fetch("/api/ai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Token ${hash}`
          },
          body: JSON.stringify({ prompt }),
        });

        const data = await paidRes.json();
        if (data.success) {
          setResponse(data.data.text);
          setPaymentStatus("");
        } else {
          setError(data.error || "Failed after payment");
        }

      } else if (res.ok) {
        const data = await res.json();
        setResponse(data.data.text);
      } else {
        const data = await res.json();
        setError(data.error || "Request Failed");
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-indigo-700">Shardeum Gateway</h1>

        {/* Wallet Control */}
        <div className="flex justify-between items-center mb-8 p-4 bg-gray-100 rounded-lg">
          {mounted && isConnected ? (
            <div className="flex items-center gap-4">
              <span className="font-mono text-sm">{address?.slice(0, 6)}...</span>
              <button onClick={() => disconnect()} className="text-red-500 text-sm hover:underline">Disconnect</button>
              {chain?.id !== shardeumMezame.id && (
                <button
                  onClick={() => switchChain({ chainId: shardeumMezame.id })}
                  className="bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                >
                  Switch to Shardeum
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => connect({ connector: connectors[0] })}
              className="bg-indigo-600 text-white px-4 py-2 rounded"
            >
              Connect Wallet
            </button>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">AI Prompt</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Ask Gemini something..."
            />
          </div>

          <button
            type="submit"
            disabled={!mounted || loading || !isConnected}
            className="w-full bg-black text-white py-3 rounded-lg font-bold disabled:opacity-50 hover:bg-gray-800 transition"
          >
            {loading ? "Processing..." : "Generate (Cost: 1 CAT)"}
          </button>
        </form>

        {/* Status & Output */}
        <div className="mt-6 space-y-4">
          {paymentStatus && (
            <div className="p-3 bg-blue-50 text-blue-700 rounded border border-blue-200 text-sm">
              {paymentStatus}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200">
              {error}
            </div>
          )}

          {response && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-bold text-green-800 mb-2">Response:</h3>
              <p className="whitespace-pre-wrap text-gray-800">{response}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
