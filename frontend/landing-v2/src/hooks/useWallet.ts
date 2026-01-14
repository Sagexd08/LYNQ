import { useState, useCallback, useEffect, useRef } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';

export interface WalletState {
    address: string | null;
    chainId: number | null;
    isConnected: boolean;
    isConnecting: boolean;
    provider: BrowserProvider | null;
    signer: JsonRpcSigner | null;
    error: string | null;
}

const SUPPORTED_CHAINS: Record<number, string> = {
    1: 'Ethereum Mainnet',
    5: 'Goerli Testnet',
    11155111: 'Sepolia Testnet',
    137: 'Polygon Mainnet',
    80001: 'Mumbai Testnet',
    31337: 'Localhost',
};

function getEthereum(): any {
    if (typeof window !== 'undefined') {
        return (window as any).ethereum;
    }
    return undefined;
}

export function useWallet() {
    const [state, setState] = useState<WalletState>({
        address: null,
        chainId: null,
        isConnected: false,
        isConnecting: false,
        provider: null,
        signer: null,
        error: null,
    });

    const accountsChangedHandler = useRef<((accounts: string[]) => void) | null>(null);
    const chainChangedHandler = useRef<(() => void) | null>(null);

    const checkConnection = useCallback(async () => {
        const ethereum = getEthereum();
        if (!ethereum) return;

        try {
            const provider = new BrowserProvider(ethereum);
            const accounts = await provider.listAccounts();

            if (accounts.length > 0) {
                const signer = await provider.getSigner();
                const address = await signer.getAddress();
                const network = await provider.getNetwork();

                setState({
                    address,
                    chainId: Number(network.chainId),
                    isConnected: true,
                    isConnecting: false,
                    provider,
                    signer,
                    error: null,
                });
            }
        } catch (error) {
            console.error('Failed to check wallet connection:', error);
        }
    }, []);

    const connect = useCallback(async () => {
        const ethereum = getEthereum();
        if (!ethereum) {
            setState(prev => ({
                ...prev,
                error: 'Please install MetaMask or another Web3 wallet',
            }));
            return;
        }

        setState(prev => ({ ...prev, isConnecting: true, error: null }));

        try {
            const provider = new BrowserProvider(ethereum);
            await ethereum.request({ method: 'eth_requestAccounts' });

            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            const network = await provider.getNetwork();

            setState({
                address,
                chainId: Number(network.chainId),
                isConnected: true,
                isConnecting: false,
                provider,
                signer,
                error: null,
            });
        } catch (error: any) {
            setState(prev => ({
                ...prev,
                isConnecting: false,
                error: error.message || 'Failed to connect wallet',
            }));
        }
    }, []);

    const disconnect = useCallback(() => {
        setState({
            address: null,
            chainId: null,
            isConnected: false,
            isConnecting: false,
            provider: null,
            signer: null,
            error: null,
        });
    }, []);

    const switchChain = useCallback(async (chainId: number) => {
        const ethereum = getEthereum();
        if (!ethereum) return;

        try {
            await ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${chainId.toString(16)}` }],
            });
        } catch (error: any) {
            if (error.code === 4902) {
                setState(prev => ({
                    ...prev,
                    error: 'Please add this network to your wallet',
                }));
            } else {
                setState(prev => ({
                    ...prev,
                    error: error.message || 'Failed to switch network',
                }));
            }
        }
    }, []);

    const signMessage = useCallback(async (message: string): Promise<string | null> => {
        if (!state.signer) {
            setState(prev => ({
                ...prev,
                error: 'Wallet not connected',
            }));
            return null;
        }

        try {
            const signature = await state.signer.signMessage(message);
            return signature;
        } catch (error: any) {
            setState(prev => ({
                ...prev,
                error: error.message || 'Failed to sign message',
            }));
            return null;
        }
    }, [state.signer]);

    useEffect(() => {
        checkConnection();

        const ethereum = getEthereum();
        if (ethereum) {
            accountsChangedHandler.current = (accounts: string[]) => {
                if (accounts.length === 0) {
                    disconnect();
                } else {
                    checkConnection();
                }
            };

            chainChangedHandler.current = () => {
                checkConnection();
            };

            ethereum.on('accountsChanged', accountsChangedHandler.current);
            ethereum.on('chainChanged', chainChangedHandler.current);
        }

        return () => {
            const eth = getEthereum();
            if (eth && accountsChangedHandler.current) {
                eth.removeListener('accountsChanged', accountsChangedHandler.current);
            }
            if (eth && chainChangedHandler.current) {
                eth.removeListener('chainChanged', chainChangedHandler.current);
            }
        };
    }, [checkConnection, disconnect]);

    return {
        ...state,
        connect,
        disconnect,
        switchChain,
        signMessage,
        isSupported: !!getEthereum(),
        chainName: state.chainId ? SUPPORTED_CHAINS[state.chainId] || 'Unknown Network' : null,
    };
}

