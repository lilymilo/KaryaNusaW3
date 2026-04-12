import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { BrowserProvider } from 'ethers';
import toast from 'react-hot-toast';
import { getMetaMaskProvider } from '../utils/evmProvider';

const WalletContext = createContext();

export const WALLET_TYPES = {
  METAMASK: 'metamask',
};

const SEPOLIA_CHAIN_ID = '0xaa36a7';
const SEPOLIA_CONFIG = {
  chainId: SEPOLIA_CHAIN_ID,
  chainName: 'Sepolia Testnet',
  nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://ethereum-sepolia.publicnode.com', 'https://rpc.sepolia.org'],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
};

const HARDHAT_CHAIN_ID = '0x7a69';
const HARDHAT_CONFIG = {
  chainId: HARDHAT_CHAIN_ID,
  chainName: 'Hardhat Localhost',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['http://127.0.0.1:8545'],
  blockExplorerUrls: [],
};

/** Use Hardhat localnet when VITE_USE_LOCALNET=true, otherwise Sepolia in dev. */
const useLocalnet = () => import.meta.env.VITE_USE_LOCALNET === 'true';
const shouldAutoSwitchSepolia = () =>
  !useLocalnet() && (import.meta.env.DEV || import.meta.env.VITE_USE_SEPOLIA === 'true');
const shouldAutoSwitchLocalnet = () => useLocalnet();

/**
 * Wraps a promise with a timeout. Rejects if the promise doesn't resolve
 * within `ms` milliseconds. Prevents infinite loading states.
 */
const withTimeout = (promise, ms, errorMsg = 'Operasi timeout. Silakan coba lagi.') =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms)),
  ]);

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletType, setWalletType] = useState(null);
  const [chain, setChain] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [balance, setBalance] = useState(null);
  const [isTestnet, setIsTestnet] = useState(false);

  const isMetaMaskAvailable = () => !!getMetaMaskProvider();

  useEffect(() => {
    const eth = getMetaMaskProvider();
    if (eth && eth.on) {
      const handleAccounts = (accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setWalletAddress(null);
          setWalletType(null);
          setBalance(null);
        }
      };
      
      const handleChain = () => {
        window.location.reload();
      };

      eth.on('accountsChanged', handleAccounts);
      eth.on('chainChanged', handleChain);

      return () => {
        if (eth.removeListener) {
          eth.removeListener('accountsChanged', handleAccounts);
          eth.removeListener('chainChanged', handleChain);
        }
      };
    }
  }, []);




  /**
   * Switches the given EIP-1193 provider to Sepolia. Must use the same provider as connect/sign.
   */
  const switchToSepolia = async (eth) => {
    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (switchErr) {
      if (switchErr.code === 4902) {
        await eth.request({
          method: 'wallet_addEthereumChain',
          params: [SEPOLIA_CONFIG],
        });
      } else {
        throw switchErr;
      }
    }
  };

  const switchToLocalnet = async (eth) => {
    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: HARDHAT_CHAIN_ID }],
      });
    } catch (switchErr) {
      if (switchErr.code === 4902) {
        await eth.request({
          method: 'wallet_addEthereumChain',
          params: [HARDHAT_CONFIG],
        });
      } else {
        throw switchErr;
      }
    }
  };

  const connectMetaMask = useCallback(async () => {
    const eth = getMetaMaskProvider();
    if (!eth) {
      throw new Error(
        'MetaMask tidak terdeteksi. Pasang ekstensi MetaMask, atau jika Anda memakai Coinbase/Phantom/Brave: ' +
          'nonaktifkan dompet lain sementara, atau pilih MetaMask sebagai dompet default di browser.'
      );
    }

    setConnecting(true);
    try {
      const accounts = await withTimeout(
        eth.request({ method: 'eth_requestAccounts' }),
        30000,
        'Koneksi MetaMask timeout. Silakan buka popup MetaMask dan setujui koneksi.'
      );
      const address = accounts[0];

      let currentChainId = await withTimeout(
        eth.request({ method: 'eth_chainId' }),
        15000,
        'MetaMask tidak merespons (chain id). Coba refresh halaman atau buka kunci MetaMask.'
      );

      const targetChainId = shouldAutoSwitchLocalnet() ? HARDHAT_CHAIN_ID : SEPOLIA_CHAIN_ID;
      const switchFn = shouldAutoSwitchLocalnet() ? switchToLocalnet : switchToSepolia;
      const networkName = shouldAutoSwitchLocalnet() ? 'Hardhat Localhost' : 'Sepolia';

      if ((shouldAutoSwitchSepolia() || shouldAutoSwitchLocalnet()) && currentChainId !== targetChainId) {
        try {
          await withTimeout(switchFn(eth), 60000, `Konfirmasi ganti jaringan ke ${networkName} di MetaMask (batas waktu 60 dtk).`);
        } catch (switchErr) {
          if (switchErr?.code === 4001) {
            toast('Ganti jaringan dibatalkan — login tetap dilanjutkan di jaringan saat ini.', { duration: 4000 });
          } else {
            console.warn('[wallet] network switch skipped:', switchErr);
            toast(`Tidak bisa beralih ke ${networkName} otomatis. Ubah jaringan manual jika perlu.`, {
              duration: 5000,
            });
          }
        }
        try {
          currentChainId = await withTimeout(
            eth.request({ method: 'eth_chainId' }),
            15000,
            'Timeout membaca jaringan setelah switch.'
          );
        } catch {
          /* keep previous currentChainId */
        }
      }

      const chainId = currentChainId;
      const testnet = chainId === SEPOLIA_CHAIN_ID || chainId === HARDHAT_CHAIN_ID;

      setWalletAddress(address);
      setWalletType(WALLET_TYPES.METAMASK);
      setChain(`evm:${chainId}`);
      setIsTestnet(testnet);

      let balEth = 0;
      try {
        const balHex = await withTimeout(
          eth.request({
            method: 'eth_getBalance',
            params: [address, 'latest'],
          }),
          20000,
          'Timeout membaca saldo ETH.'
        );
        balEth = parseInt(balHex, 16) / 1e18;
      } catch (balErr) {
        console.warn('[wallet] eth_getBalance:', balErr);
      }
      setBalance(balEth);

      return { address, chain: `evm:${chainId}`, balance: balEth, isTestnet: testnet };
    } catch (err) {
      if (err.code === 4001) {
        throw new Error('Koneksi wallet dibatalkan oleh pengguna.');
      }
      throw err;
    } finally {
      setConnecting(false);
    }
  }, []);


  const signWithMetaMask = useCallback(async (message) => {
    const eth = getMetaMaskProvider();
    if (!eth) throw new Error('MetaMask tidak tersedia. Refresh halaman atau matikan dompet EVM lain yang override window.ethereum.');

    const provider = new BrowserProvider(eth);
    const signer = await withTimeout(
      provider.getSigner(),
      20000,
      'MetaMask tidak merespons (signer). Pastikan ekstensi terbuka dan dompet tidak terkunci.'
    );
    const signature = await withTimeout(
      signer.signMessage(message),
      60000,
      'Penandatanganan timeout. Silakan setujui permintaan di MetaMask.'
    );
    return signature;
  }, []);


  const sendETH = useCallback(async (toAddress, amountInEth, onSent) => {
    const eth = getMetaMaskProvider();
    if (!eth) throw new Error('MetaMask tidak tersedia');
    
    const safeAddress = (toAddress || '').toLowerCase();
    
    if (!/^0x[a-f0-9]{40}$/.test(safeAddress)) {
      throw new Error('Alamat merchant ETH tidak valid. Set VITE_MERCHANT_ETH_ADDRESS di .env frontend.');
    }

    const { parseEther } = await import('ethers');

    const provider = new BrowserProvider(eth);
    const signer = await provider.getSigner();
    const from = await signer.getAddress();

    const ethString = Number(amountInEth).toLocaleString("en-US", { useGrouping: false, minimumFractionDigits: 0, maximumFractionDigits: 18 });
    const valueWei = parseEther(ethString);

    if (valueWei === 0n) {
      throw new Error('Jumlah ETH terlalu kecil (mendekati nol). Naikkan nilai order.');
    }

    const tx = await signer.sendTransaction({
      to: safeAddress,
      value: valueWei,
    });

    if (onSent) onSent(tx.hash);

    const receipt = await tx.wait();

    const balHex = await eth.request({
      method: 'eth_getBalance',
      params: [from, 'latest'],
    });
    setBalance(parseInt(balHex, 16) / 1e18);

    return { txHash: receipt.hash, status: receipt.status };
  }, []);


  const getETHBalance = useCallback(async () => {
    const eth = getMetaMaskProvider();
    if (!eth || !walletAddress) return 0;
    try {
      const balHex = await eth.request({
        method: 'eth_getBalance',
        params: [walletAddress, 'latest'],
      });
      const bal = parseInt(balHex, 16) / 1e18;
      setBalance(bal);
      return bal;
    } catch {
      return 0;
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletType === WALLET_TYPES.METAMASK && walletAddress) {
      getETHBalance();
    }
  }, [walletAddress, walletType, getETHBalance]);



  const connectWallet = useCallback(async (type) => {
    switch (type) {
      case WALLET_TYPES.METAMASK:
        return await connectMetaMask();
      default:
        throw new Error(`Tipe wallet "${type}" tidak didukung`);
    }
  }, [connectMetaMask]);

  const signMessage = useCallback(async (message, type) => {
    switch (type || walletType) {
      case WALLET_TYPES.METAMASK:
        return await signWithMetaMask(message);
      default:
        throw new Error('Tidak ada wallet yang terkoneksi');
    }
  }, [walletType, signWithMetaMask]);

  const disconnectWallet = useCallback(() => {
    setWalletAddress(null);
    setWalletType(null);
    setChain(null);
    setBalance(null);
    setIsTestnet(false);
  }, []);

  return (
    <WalletContext.Provider value={{
      walletAddress,
      walletType,
      chain,
      connecting,
      balance,
      isTestnet,
      connectWallet,
      signMessage,
      disconnectWallet,
      sendETH,
      getETHBalance,
      isMetaMaskAvailable,
      WALLET_TYPES,
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
