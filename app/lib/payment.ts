import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { shardeumMezame } from './chains';


const CAT_TOKEN_ADDRESS = process.env.CAT_TOKEN_ADDRESS || '0x4f84710401a38d70F78A7978912Cd8fd1F51E583';
const SERVER_WALLET_ADDRESS = process.env.SERVER_WALLET_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'; // Using the one from my logs earlier or env


const client = createPublicClient({
    chain: shardeumMezame,
    transport: http(),
});

const PROCESSED_TXS = new Set<string>();

export async function verifyPayment(req: Request, costAmount: number): Promise<NextResponse | null> {
    const authHeader = req.headers.get('authorization');

    // 1. Check for Payment Header
    if (!authHeader || !authHeader.startsWith('Token ')) {
        // Return 402 with headers
        return NextResponse.json(
            {
                error: 'Payment Required',
                message: `Please pay ${costAmount} CAT to ${SERVER_WALLET_ADDRESS} on Shardeum Testnet`,
            },
            {
                status: 402,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'x-payment-network': 'shardeum-8119',
                    'x-payment-token': CAT_TOKEN_ADDRESS,
                    'x-payment-amount': costAmount.toString(),
                    'x-payment-recipient': SERVER_WALLET_ADDRESS,
                },
            }
        );
    }

    const txHash = authHeader.split(' ')[1] as `0x${string}`;

    if (PROCESSED_TXS.has(txHash)) {
        return NextResponse.json({ error: 'Transaction already used' }, { status: 403 });
    }

    try {
        // 2. Verify Transaction
        const receipt = await client.getTransactionReceipt({ hash: txHash });

        if (receipt.status !== 'success') {
            return NextResponse.json({ error: 'Payment Transaction Failed' }, { status: 402 });
        }

        const transferLog = receipt.logs.find(
            (log) =>
                log.address.toLowerCase() === CAT_TOKEN_ADDRESS.toLowerCase() &&
                log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
        );

        if (!transferLog) {
            return NextResponse.json({ error: 'Invalid Payment Token' }, { status: 402 });
        }

        // Check Recipient (Topic 2)
        const recipientInLog = '0x' + transferLog.topics[2]?.slice(26);
        if (!recipientInLog || recipientInLog.toLowerCase() !== SERVER_WALLET_ADDRESS.toLowerCase()) {
            return NextResponse.json({ error: 'Wrong Recipient' }, { status: 402 });
        }

        // Check Amount (Data)
        const paidAmount = BigInt(transferLog.data);
        const requiredAmount = BigInt(costAmount * 10 ** 18);

        if (paidAmount < requiredAmount) {
            return NextResponse.json(
                {
                    error: 'Insufficient Payment',
                    paid: paidAmount.toString(),
                    required: requiredAmount.toString(),
                },
                { status: 402 }
            );
        }

        // 3. Success
        PROCESSED_TXS.add(txHash);
        return null; // Continue processing

    } catch (error) {
        console.error('Payment verification failed:', error);
        return NextResponse.json({ error: 'Internal Payment Verification Error' }, { status: 500 });
    }
}
