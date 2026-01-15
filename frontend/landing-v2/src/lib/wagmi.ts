import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mantleSepoliaTestnet } from 'viem/chains';
import { http } from 'wagmi';

export const config = getDefaultConfig({
    appName: 'LYNQ',
    projectId: '38a61c4d631a8ed3bc768c65f17e5800',
    chains: [mantleSepoliaTestnet],
    transports: {
        [mantleSepoliaTestnet.id]: http(),
    },
});
