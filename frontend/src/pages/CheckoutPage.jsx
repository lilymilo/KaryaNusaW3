import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Phone, CreditCard, Wallet, Building2, ArrowLeft, ShoppingBag, Bitcoin, Loader2, AlertTriangle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWallet, WALLET_TYPES } from '../context/WalletContext';
import { formatPrice } from '../utils/format';
import api from '../api/axios';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { id: 'bank_transfer', label: 'Transfer Bank', icon: Building2, desc: 'BCA, Mandiri, BNI, BRI' },
  { id: 'credit_card', label: 'Kartu Kredit', icon: CreditCard, desc: 'Visa, Mastercard, JCB' },
  { id: 'e_wallet', label: 'E-Wallet', icon: Wallet, desc: 'GoPay, OVO, Dana' },
  { id: 'crypto', label: 'Cryptocurrency', icon: Bitcoin, desc: 'ETH (MetaMask)' },
];

const validateWA = (num) => {
  if (!num) return null;
  let cleaned = num.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
  const waRegex = /^628[1-9]\d{7,11}$/;
  return waRegex.test(cleaned) ? cleaned : null;
};

const TESTNET_RATES = { eth: 48_000_000 };
const IS_LOCALNET = import.meta.env.VITE_USE_LOCALNET === 'true';

const balanceCoversAmount = (bal, need) =>
  bal === null || need === null || bal === undefined || need === undefined
    ? true
    : bal + 1e-12 >= need;

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { walletAddress, connectWallet, walletType, disconnectWallet, sendETH, sendSOL, balance, isTestnet } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();
  const directItem = location.state?.directItem;
  const prefilledBuyerLocation = location.state?.buyerLocation ?? '';

  const checkoutItems = useMemo(() => (directItem ? [directItem] : cart), [directItem, cart]);
  const checkoutTotal = directItem ? directItem.products.price * directItem.quantity : cartTotal;
  const isDirect = !!directItem;

  const [form, setForm] = useState({
    delivery_email: '',
    phone: '',
    buyer_location: prefilledBuyerLocation,
    paymentMethod: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState({ eth: 0, sol: 0 });
  const [txStatus, setTxStatus] = useState('');
  const cryptoPhaseRef = useRef('');

  useEffect(() => {
    if (prefilledBuyerLocation) {
      setForm((f) => ({ ...f, buyer_location: prefilledBuyerLocation }));
    }
  }, [prefilledBuyerLocation]);

  useEffect(() => {
    const ac = new AbortController();

    if (IS_LOCALNET || isTestnet) {
      setRates(TESTNET_RATES);
      return () => ac.abort();
    }

    (async () => {
      try {
        const url =
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=idr';
        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) throw new Error('rates');
        const data = await res.json();
        if (!ac.signal.aborted) {
          setRates({ eth: data.ethereum.idr, sol: data.solana.idr });
        }
      } catch (e) {
        if (e.name === 'AbortError') return;
        if (!ac.signal.aborted) setRates({ eth: TESTNET_RATES.eth });
      }
    })();

    return () => ac.abort();
  }, [isTestnet]);

  const cryptoAmt = useMemo(() => {
    if (form.paymentMethod !== 'crypto' || !walletType) return null;

    if (walletType === WALLET_TYPES.METAMASK && rates.eth) {
      return {
        symbol: 'ETH',
        amount: Number((checkoutTotal / rates.eth).toFixed(6)),
        merchant: import.meta.env.VITE_MERCHANT_ETH_ADDRESS || '0x32a2148b30ae6d8a34f0d8a476fc3bdea6192237',
      };
    }
    return null;
  }, [form.paymentMethod, walletType, rates, checkoutTotal]);

  const handleConnectWallet = useCallback(
    async (type) => {
      try {
        await connectWallet(type);
      } catch (err) {
        toast.error(err.message || 'Gagal menyambungkan dompet');
      }
    },
    [connectWallet]
  );

  const handlePaymentMethodChange = useCallback(
    (id) => {
      setForm((f) => ({ ...f, paymentMethod: id }));
      if (id !== 'crypto' && walletAddress) disconnectWallet();
    },
    [walletAddress, disconnectWallet]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.delivery_email || !form.paymentMethod) {
      return toast.error('Email pengiriman dan metode pembayaran wajib diisi');
    }

    const isCrypto = form.paymentMethod === 'crypto';

    let validatedPhone = null;
    if (!isCrypto) {
      if (!form.phone) return toast.error('Nomor telepon wajib diisi untuk pembayaran reguler');
      validatedPhone = validateWA(form.phone);
      if (!validatedPhone) {
        return toast.error('Nomor WhatsApp tidak valid (Gunakan format 08xx atau +628xx)');
      }
    } else {
      validatedPhone = form.phone ? validateWA(form.phone) : null;
    }

    if (isCrypto && !walletAddress) {
      return toast.error('Harap hubungkan dompet (wallet) Anda terlebih dahulu');
    }

    if (isCrypto && !cryptoAmt) {
      return toast.error('Gagal menghitung konversi harga crypto');
    }

    if (isCrypto && !balanceCoversAmount(balance, cryptoAmt?.amount)) {
      return toast.error(`Saldo ${cryptoAmt.symbol} Anda tidak cukup!`);
    }

    setLoading(true);
    cryptoPhaseRef.current = '';
    let txHash = null;

    try {
      if (isCrypto) {
        cryptoPhaseRef.current = 'confirming';
        setTxStatus('confirming');

        const merchantEth = import.meta.env.VITE_MERCHANT_ETH_ADDRESS || cryptoAmt.merchant;
        const merchantSol = import.meta.env.VITE_MERCHANT_SOL_ADDRESS || cryptoAmt.merchant;

        let result;
        const onSent = (hash) => {
          txHash = hash;
          cryptoPhaseRef.current = 'processing';
          setTxStatus('processing');
        };

        if (walletType === WALLET_TYPES.METAMASK) {
          result = await sendETH(merchantEth, cryptoAmt.amount, onSent);
        } else {
          throw new Error('Hanya MetaMask yang didukung saat ini');
        }

        txHash = result.txHash;
        cryptoPhaseRef.current = 'processing';
        setTxStatus('processing');
        toast.success('Transaksi di blockchain berhasil! Memproses pesanan...');
      }

      const payload = {
        items: checkoutItems.map((item) => ({
          productId: item.product_id,
          quantity: item.quantity,
          price: item.products?.price,
          name: item.products?.name,
        })),
        total_amount: checkoutTotal,
        delivery_email: form.delivery_email,
        buyer_location: form.buyer_location.trim() || null,
        phone: validatedPhone,
        payment_method: isCrypto ? 'crypto_eth' : form.paymentMethod,
        notes: form.notes,
        is_direct: isDirect,
        tx_hash: txHash,
        buyer_wallet_address: walletAddress,
        is_testnet: isTestnet,
      };

      const { data: orderRes } = await api.post('/orders', payload);
      const orderId = orderRes.orderId;
      
      // Kosongkan keranjang jika bukan beli langsung
      if (!isDirect) {
        clearCart();
      }

      cryptoPhaseRef.current = 'done';
      setTxStatus('done');
      toast.success(isCrypto ? 'Pembayaran Crypto Diterima!' : 'Pesanan berhasil dibuat!');

      setTimeout(() => navigate(`/order-success/${orderId}`, { replace: true }), 1000);
    } catch (err) {
      const phase = cryptoPhaseRef.current;
      if (phase === 'confirming') {
        const rejected = err?.code === 'ACTION_REJECTED' || err?.message?.toLowerCase?.().includes('user rejected');
        const revertReason = err?.reason || err?.message || 'Transaksi gagal dieksekusi di wallet.';
        toast.error(rejected ? 'Transaksi ditolak di wallet.' : `Gagal: ${revertReason}`);
      } else {
        toast.error(err.response?.data?.message || err.response?.data?.error || err.message || 'Gagal memproses pesanan');
      }
    } finally {
      cryptoPhaseRef.current = '';
      setLoading(false);
      setTxStatus('');
    }
  };

  if (checkoutItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <ShoppingBag size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-6 font-medium">Keranjang kosong</p>
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="btn-primary px-6 py-2.5 rounded-xl text-white font-bold shadow-sm w-full sm:w-auto"
          >
            Kembali Belanja
          </button>
        </div>
      </div>
    );
  }

  const insufficientCrypto =
    form.paymentMethod === 'crypto' && walletAddress && balance !== null && cryptoAmt && !balanceCoversAmount(balance, cryptoAmt.amount);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-8 pb-24 px-4">
      {txStatus ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/85 dark:bg-gray-950/85 backdrop-blur-md p-4"
          role="status"
          aria-live="polite"
        >
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center shadow-xl">
            {txStatus === 'confirming' && (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-4 border-green-100 bg-green-50 text-green-600 dark:border-green-900/40 dark:bg-green-900/20 dark:text-emerald-400">
                  <Wallet size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Konfirmasi wallet</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Setujui transaksi di MetaMask.
                </p>
              </>
            )}
            {txStatus === 'processing' && (
              <>
                <div className="mx-auto mb-4 relative">
                  <div className="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-20"></div>
                  <Loader2 size={48} className="relative mx-auto animate-spin text-green-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Memverifikasi Jaringan</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Menunggu konfirmasi dari blockchain…</p>
              </>
            )}
            {txStatus === 'done' && (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-green-600 dark:text-emerald-400">Berhasil</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Pesanan dikonfirmasi.</p>
              </>
            )}
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 font-medium text-gray-500 transition-colors hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft size={20} /> Kembali
        </button>

        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Checkout</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Lengkapi data pengiriman digital dan pembayaran.</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
                <ShoppingBag size={18} className="text-green-600 dark:text-emerald-400" />
                Pengiriman digital
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email pengiriman <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="contoh@email.com"
                    value={form.delivery_email}
                    onChange={(e) => setForm((f) => ({ ...f, delivery_email: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <MapPin size={14} className="mr-1 inline text-gray-400" />
                    Lokasi pembeli
                  </label>
                  <input
                    type="text"
                    autoComplete="address-level1"
                    placeholder="Kota, provinsi, atau negara"
                    value={form.buyer_location}
                    onChange={(e) => setForm((f) => ({ ...f, buyer_location: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Phone size={14} className="mr-1 inline text-gray-400" />
                    WhatsApp {form.paymentMethod !== 'crypto' && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="tel"
                    autoComplete="tel"
                    placeholder="08xxxxxxxxxx"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Catatan (opsional)</label>
                  <textarea
                    rows={2}
                    placeholder="Instruksi tambahan…"
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
                <CreditCard size={18} className="text-green-600 dark:text-emerald-400" />
                Metode pembayaran
              </h2>
              <ul className="space-y-3">
                {PAYMENT_METHODS.map(({ id, label, icon: Icon, desc }) => (
                  <li key={id}>
                    <label
                      className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors ${
                        form.paymentMethod === id
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={id}
                        checked={form.paymentMethod === id}
                        onChange={() => handlePaymentMethodChange(id)}
                        className="sr-only"
                      />
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          form.paymentMethod === id
                            ? id === 'crypto'
                              ? 'bg-orange-500 text-white'
                              : 'btn-primary text-white shadow-sm'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        <Icon size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-gray-900 dark:text-white">{label}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{desc}</span>
                      </span>
                      {form.paymentMethod === id ? (
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${id === 'crypto' ? 'bg-orange-500' : 'btn-primary'}`}
                        >
                          <span className="h-2 w-2 rounded-full bg-white" />
                        </span>
                      ) : null}
                    </label>

                    {id === 'crypto' && form.paymentMethod === 'crypto' ? (
                      <div className="mt-3 ml-2 space-y-3 border-l-2 border-gray-200 pl-4 dark:border-gray-700">
                        {isTestnet ? (
                          <div className="flex gap-2 rounded-xl border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800/50 dark:bg-yellow-900/20">
                            <AlertTriangle size={16} className="shrink-0 text-yellow-600 dark:text-yellow-400" />
                            <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-200">
                              Testnet (Sepolia): ETH tidak bernilai riil. Pastikan merchant address di .env adalah wallet Anda di Sepolia.
                            </p>
                          </div>
                        ) : null}

                        {!walletAddress ? (
                            <button
                              type="button"
                              onClick={() => handleConnectWallet(WALLET_TYPES.METAMASK)}
                              className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 px-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                            >
                              <img
                                src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                                alt=""
                                className="h-6 w-6"
                                width={24}
                                height={24}
                              />
                              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">MetaMask</span>
                            </button>
                        ) : (
                          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                Terhubung (MetaMask)
                                {isTestnet ? (
                                  <span className="text-yellow-600 dark:text-yellow-400"> · {IS_LOCALNET ? 'Hardhat' : 'testnet'}</span>
                                ) : null}
                              </span>
                              <button type="button" onClick={disconnectWallet} className="text-xs font-bold text-red-500 hover:underline">
                                Putuskan
                              </button>
                            </div>
                            <p className="mb-1 break-all font-mono text-sm font-bold text-gray-900 dark:text-white">
                              {walletAddress.slice(0, 10)}…{walletAddress.slice(-8)}
                            </p>
                            <div className="mt-2 space-y-1">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Saldo:{' '}
                                <span className={`font-bold ${insufficientCrypto ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                                  {balance !== null ? balance.toFixed(6) : '…'} ETH
                                </span>
                              </p>
                              {cryptoAmt && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Perlu:{' '}
                                  <span className={`font-bold ${insufficientCrypto ? 'text-red-500' : 'text-green-600 dark:text-emerald-400'}`}>
                                    {cryptoAmt.amount} {cryptoAmt.symbol}
                                  </span>
                                </p>
                              )}
                            </div>
                            <p className="mt-3 border-t border-gray-200 pt-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                              {(IS_LOCALNET || isTestnet) ? 'Kurs mock (testnet/localnet)' : 'Kurs saat ini'}: 1 ETH ≈{' '}
                              {formatPrice(rates.eth)}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="lg:col-span-2">
            <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Ringkasan</h2>
              <ul className="mb-4 max-h-64 space-y-3 overflow-y-auto pr-1">
                {checkoutItems.map((item) => (
                  <li key={item.id || item.product_id} className="flex gap-3">
                    <img
                      src={item.products?.image}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg border border-gray-100 object-cover dark:border-gray-700"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400';
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">{item.products?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">×{item.quantity}</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-gray-900 dark:text-white">
                      {formatPrice((item.products?.price || 0) * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Total (IDR)</span>
                  <span className="text-lg font-black text-gray-900 dark:text-white">{formatPrice(checkoutTotal)}</span>
                </div>

                {form.paymentMethod === 'crypto' && cryptoAmt ? (
                  <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-gray-900 dark:text-white">
                      <Bitcoin size={16} className="text-orange-500" aria-hidden />
                      Crypto
                    </span>
                    <span className="text-lg font-black text-orange-500">
                      {cryptoAmt.amount} {cryptoAmt.symbol}
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">Bayar</span>
                    <span className="text-lg font-black text-green-600 dark:text-emerald-400">{formatPrice(checkoutTotal)}</span>
                  </div>
                )}
              </div>

              {form.paymentMethod === 'crypto' && !walletAddress ? (
                <button
                  type="button"
                  onClick={() => toast.error('Hubungkan wallet di bagian metode pembayaran terlebih dahulu.')}
                  className="mt-6 w-full cursor-not-allowed rounded-xl bg-gray-200 py-3 font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                >
                  Pilih wallet
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || insufficientCrypto}
                  className={`mt-6 w-full rounded-xl py-3 font-bold text-white shadow-sm transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
                    form.paymentMethod === 'crypto' ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'btn-primary'
                  }`}
                >
                  {loading ? 'Memproses…' : form.paymentMethod === 'crypto' ? 'Bayar dengan crypto' : 'Bayar sekarang'}
                </button>
              )}

              {insufficientCrypto ? (
                <p className="mt-3 text-center text-xs font-bold text-red-500">Saldo tidak mencukupi untuk transaksi ini.</p>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
