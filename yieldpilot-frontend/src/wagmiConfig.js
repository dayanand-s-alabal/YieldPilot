import { http, fallback, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { metaMask, injected } from 'wagmi/connectors';
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'YieldPilot',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://yieldpilot.app',
      },
    }),
    injected(),
  ],
  transports: {
    [sepolia.id]: fallback([
      http('https://rpc.sepolia.org'),
      http('https://ethereum-sepolia-rpc.publicnode.com'),
      http('https://sepolia.drpc.org'),
      http(),
    ]),
  },
});
