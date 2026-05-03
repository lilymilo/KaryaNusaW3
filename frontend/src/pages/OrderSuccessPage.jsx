import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle, Package, Mail, ExternalLink, Home, ClipboardList,
  Bitcoin, Shield, Clock, Copy, Check, ArrowRight
} from 'lucide-react';
import { formatPrice, formatDate } from '../utils/format';
import api from '../api/axios';

export default function OrderSuccessPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!order);
  const [copied, setCopied] = useState(null); // 'hash' | 'email' | null

  useEffect(() => {
    if (order) return;
    (async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data);
      } catch {
        navigate('/orders', { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [id, order, navigate]);

  const copyToClipboard = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* fallback ignored */ }
  };

  const isCrypto = order?.payment_method?.startsWith('crypto_');
  const isETH = order?.payment_method === 'crypto_eth';
  const isSOL = order?.payment_method === 'crypto_sol';
  const isLocalnet = import.meta.env.VITE_USE_LOCALNET === 'true' && isETH;
  const explorerUrl = isSOL
    ? `https://explorer.solana.com/tx/${order?.tx_hash}?cluster=devnet`
    : isLocalnet
      ? null  // No public explorer for local Hardhat
      : `https://sepolia.etherscan.io/tx/${order?.tx_hash}`;
  const nftExplorerUrl = order?.nft_transfer_tx_hash && !isLocalnet
    ? `https://sepolia.etherscan.io/tx/${order?.nft_transfer_tx_hash}`
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-8 pb-8 px-4 transition-colors">
      <div className="mx-auto max-w-2xl">

        <div className="text-center mb-8">
          <div className="relative mx-auto mb-6 w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-[ping_1.5s_ease-out_1]" />
            <div className="absolute inset-2 rounded-full bg-green-500/15 animate-[ping_1.5s_ease-out_0.3s_1]" />
            <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-500/30 animate-[scaleIn_0.5s_ease-out]">
              <svg
                width="48" height="48" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className="animate-[drawCheck_0.6s_ease-out_0.3s_both]"
                aria-hidden
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Pembayaran Berhasil!
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
            Pesanan Anda telah dikonfirmasi dan sedang diproses
          </p>

          {order.is_testnet && (
            <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs font-bold border border-yellow-200 dark:border-yellow-800/50 rounded-full">
              <Shield size={12} /> {isLocalnet ? 'Hardhat Localnet' : 'Testnet (Sepolia)'}
            </span>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden animate-[slideUp_0.5s_ease-out_0.2s_both]">

          <div className={`px-6 py-4 ${
            isCrypto
              ? 'bg-gradient-to-r from-orange-500/10 to-amber-500/10 dark:from-orange-500/5 dark:to-amber-500/5 border-b border-orange-200/50 dark:border-orange-800/30'
              : 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/5 dark:to-emerald-500/5 border-b border-green-200/50 dark:border-green-800/30'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400">ID Pesanan</p>
                <p className="text-sm font-mono font-black text-gray-900 dark:text-white tracking-wide">
                  {order.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  <Clock size={10} className="inline mr-1" />
                  {formatDate(order.created_at)}
                </p>
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-emerald-400 text-xs font-bold rounded-full">
                  <CheckCircle size={10} /> Dikonfirmasi
                </span>
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white mb-4">
              <Package size={16} className="text-green-600 dark:text-emerald-400" />
              Produk Dipesan
            </h2>
            <div className="space-y-3">
              {order.order_items?.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 transition-colors"
                  style={{ animationDelay: `${0.3 + i * 0.1}s` }}
                >
                  <img
                    src={item.products?.image}
                    alt={item.products?.name}
                    className="w-14 h-14 object-cover rounded-lg flex-shrink-0 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                      {item.products?.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      ×{item.quantity} · {formatPrice(item.price)}
                    </p>
                  </div>
                  <p className="text-sm font-black text-gray-900 dark:text-white flex-shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-5 border-t border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Total</span>
              <span className={`text-xl font-black ${isCrypto ? 'text-orange-500' : 'text-green-600 dark:text-emerald-400'}`}>
                {formatPrice(order.total_amount)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Metode</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                {isCrypto && <Bitcoin size={14} className="text-orange-500" />}
                {order.payment_method?.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Mail size={12} /> Email
              </span>
              <button
                onClick={() => copyToClipboard(order.delivery_email, 'email')}
                className="group text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5 hover:text-green-600 dark:hover:text-emerald-400 transition-colors truncate max-w-[60%]"
              >
                <span className="truncate">{order.delivery_email}</span>
                {copied === 'email' ? <Check size={12} className="text-green-500 flex-shrink-0" /> : <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />}
              </button>
            </div>


          </div>

          {isCrypto && order.tx_hash && (
            <div className="px-6 py-5 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Shield size={14} className="text-orange-500" />
                Verifikasi Blockchain
              </h3>

              <div className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 border border-orange-200/60 dark:border-orange-800/30 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    Transaction Hash
                  </span>
                  <button
                    onClick={() => copyToClipboard(order.tx_hash, 'hash')}
                    className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
                  >
                    {copied === 'hash' ? <><Check size={12} /> Tersalin</> : <><Copy size={12} /> Salin</>}
                  </button>
                </div>
                <p className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all leading-relaxed">
                  {order.tx_hash}
                </p>
                {explorerUrl ? (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-800/50 rounded-lg text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors shadow-sm"
                  >
                    <ExternalLink size={12} />
                    Lihat di {isETH ? 'Etherscan' : 'Solscan'}
                    <ArrowRight size={12} />
                  </a>
                ) : (
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 italic">
                    Local Hardhat node — tidak ada block explorer publik
                  </p>
                )}
              </div>

              {nftExplorerUrl && order.nft_transfer_tx_hash && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/10 dark:to-violet-900/10 border border-purple-200/60 dark:border-purple-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      NFT Transfer
                    </span>
                  </div>
                  <p className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all leading-relaxed">
                    {order.nft_transfer_tx_hash}
                  </p>
                  <a
                    href={nftExplorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800/50 rounded-lg text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors shadow-sm"
                  >
                    <ExternalLink size={12} />
                    Lihat NFT Transfer
                    <ArrowRight size={12} />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 animate-[slideUp_0.5s_ease-out_0.5s_both]">
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center justify-center gap-2 py-3.5 px-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:border-green-500 hover:text-green-600 dark:hover:text-emerald-400 transition-all shadow-sm active:scale-[0.98]"
          >
            <ClipboardList size={18} />
            Pesanan Saya
          </button>
          <button
            onClick={() => navigate('/home')}
            className="flex items-center justify-center gap-2 py-3.5 px-4 btn-primary rounded-xl text-sm font-bold text-white shadow-sm active:scale-[0.98] transition-transform"
          >
            <Home size={18} />
            Kembali Beranda
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500 font-medium">
          Detail produk digital akan dikirim ke email Anda.
          <br />
          Hubungi kami jika ada pertanyaan.
        </p>
      </div>
    </div>
  );
}
