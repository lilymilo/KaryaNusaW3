/**
 * Resolves the MetaMask EIP-1193 provider.
 *
 * When several wallets inject into the page, `window.ethereum` is often a *proxy* to the
 * "last installed" or default wallet (e.g. Coinbase Wallet, Phantom EVM). That object may
 * have `isMetaMask === false` even though MetaMask is installed. MetaMask is then exposed
 * on `window.ethereum.providers[]` alongside the others.
 *
 * Ini murni sisi browser / ekstensi — tidak ada hubungan dengan Supabase.
 */
export function getMetaMaskProvider() {
  if (typeof window === 'undefined') return null;

  const { ethereum } = window;
  if (!ethereum) return null;

  const list = Array.isArray(ethereum.providers) && ethereum.providers.length > 0
    ? ethereum.providers
    : [ethereum];

  const metaMask = list.find(
    (p) => p && typeof p.request === 'function' && p.isMetaMask === true
  );

  return metaMask ?? null;
}
