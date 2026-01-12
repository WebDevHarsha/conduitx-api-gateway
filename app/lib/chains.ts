import { defineChain } from 'viem';

export const shardeumMezame = defineChain({
    id: 8119,
    name: 'Shardeum EVM Testnet',
    nativeCurrency: {
        decimals: 18,
        name: 'Shardeum',
        symbol: 'SHM',
    },
    rpcUrls: {
        default: { http: ['https://api-mezame.shardeum.org'] },
    },
    blockExplorers: {
        default: { name: 'Shardeum Explorer', url: 'https://explorer-mezame.shardeum.org' },
    },
    testnet: true,
});
