/**
 * Resolves an EIP-1193 EVM provider.
 *
 * When several wallets inject into the page, `window.ethereum` is often a *proxy* to the
 * "last installed" or default wallet (e.g. Coinbase Wallet, Phantom EVM).
 * This function returns the first available valid provider.
 *
 * Ini murni sisi browser / ekstensi — tidak ada hubungan dengan Supabase.
 */
export function getMetaMaskProvider() {
  if (typeof window === 'undefined') return null;

  const { ethereum } = window;
  if (!ethereum) return null;

  // If providers array exists, use the first valid one
  const list = Array.isArray(ethereum.providers) && ethereum.providers.length > 0
    ? ethereum.providers
    : [ethereum];

  // Cari provider yang valid (memiliki fungsi request)
  // Tidak lagi membatasi hanya untuk isMetaMask === true agar mendukung Phantom, Coinbase, dll.
  const provider = list.find(
    (p) => p && typeof p.request === 'function'
  );

  return provider ?? null;
}
