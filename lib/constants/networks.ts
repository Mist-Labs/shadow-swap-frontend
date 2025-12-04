export enum StarknetChainId {
  MAINNET = '0x534e5f4d41494e',
  SEPOLIA = '0x534e5f5345504f4c4941',
}

export interface NetworkConfig {
  chainId: string;
  chainName: string;
  rpcUrl: string;
  explorerUrl: string;
}

export const NETWORKS: Record<string, NetworkConfig> = {
  mainnet: {
    chainId: StarknetChainId.MAINNET,
    chainName: 'Starknet Mainnet',
    rpcUrl: 'https://starknet-mainnet.public.blastapi.io',
    explorerUrl: 'https://starkscan.co',
  },
  sepolia: {
    chainId: StarknetChainId.SEPOLIA,
    chainName: 'Starknet Sepolia',
    rpcUrl: 'https://starknet-sepolia.infura.io/v3/eef769b164304dd796259eb3836f295a',
    explorerUrl: 'https://sepolia.starkscan.co',
  },
};

export const DEFAULT_NETWORK =
  process.env.NEXT_PUBLIC_STARKNET_NETWORK || 'sepolia';

export function getNetworkConfig(network: string = DEFAULT_NETWORK): NetworkConfig {
  return NETWORKS[network] || NETWORKS.mainnet;
}

