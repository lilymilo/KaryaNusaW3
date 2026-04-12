import { supabase, supabaseAdmin, getAuthClient } from '../config/supabaseClient.js';
import { transferNFT, isNFTEnabled } from '../services/nftService.js';
import { ethers } from 'ethers';

export const getOrders = async (req, res) => {
  try {
    const authSupabase = getAuthClient(req);
    const { data, error } = await authSupabase
      .from('orders')
      .select('*, order_items(*, products(*))')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const authSupabase = getAuthClient(req);
    const { data, error } = await authSupabase
      .from('orders')
      .select('*, order_items(*, products(*))')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const validateWA = (num) => {
  if (!num) return null;
  let cleaned = num.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
  const waRegex = /^628[1-9]\d{7,11}$/;
  return waRegex.test(cleaned) ? cleaned : null;
};

export const createOrder = async (req, res) => {
  try {
    const { 
      items, total_amount, delivery_email, phone, 
      payment_method, notes, tx_hash, buyer_wallet_address,
      buyer_location, is_testnet
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Keranjang belanja kosong" });
    }

    const isCryptoPayment = payment_method === 'crypto_eth' || payment_method === 'crypto_sol';
    
    let validatedPhone = null;
    if (!isCryptoPayment) {
      validatedPhone = validateWA(phone);
      if (!validatedPhone) {
        return res.status(400).json({ error: "Nomor WhatsApp tidak valid. Gunakan format 08xx atau +628xx" });
      }
    } else {
      validatedPhone = phone ? validateWA(phone) : null;
    }

    if (isCryptoPayment && !tx_hash) {
      return res.status(400).json({ error: "Transaction hash diperlukan untuk pembayaran crypto" });
    }

    const authSupabase = getAuthClient(req);

    const orderStatus = isCryptoPayment ? 'processing' : 'pending';

    const { data: order, error: orderError } = await authSupabase
      .from('orders')
      .insert([{
        user_id: req.user.id,
        total_amount: Number(total_amount),
        status: orderStatus,
        delivery_email,
        phone: validatedPhone,
        payment_method,
        notes,
        tx_hash: tx_hash || null,
        buyer_wallet_address: buyer_wallet_address || null,
        buyer_location: buyer_location || null,
        is_testnet: !!is_testnet
      }])
      .select()
      .single();

    if (orderError) throw new Error(`Gagal membuat pesanan: ${orderError.message}`);

    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.productId || item.id, // Support both formats
      quantity: Number(item.quantity),
      price: Number(item.price)
    }));

    const { error: itemsError } = await authSupabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      await authSupabase.from('orders').delete().eq('id', order.id);
      throw new Error(`Gagal membuat detail pesanan: ${itemsError.message}`);
    }

    for (const item of items) {
      const productId = item.productId || item.id;
      const { error: rpcError } = await authSupabase.rpc('increment_sold', { 
        row_id: productId, 
        qty: Number(item.quantity) 
      });
      if (rpcError) console.error(`Gagal update stok untuk ${productId}:`, rpcError.message);
    }

    if (!req.body.is_direct) {
      await authSupabase
        .from('cart')
        .delete()
        .eq('user_id', req.user.id);
    }

    let nftTransfers = [];
    if (isCryptoPayment && buyer_wallet_address && isNFTEnabled()) {
      for (const item of items) {
        const productId = item.productId || item.id;
        
        const { data: product } = await authSupabase
          .from('products')
          .select('token_id, profiles(wallet_address)')
          .eq('id', productId)
          .single();

        if (product?.token_id && product?.profiles?.wallet_address) {
          const transferResult = await transferNFT(
            product.profiles.wallet_address,
            buyer_wallet_address,
            product.token_id
          );

          if (transferResult) {
            nftTransfers.push({
              productId,
              tokenId: product.token_id,
              txHash: transferResult.txHash
            });
          }
        }
      }

      if (nftTransfers.length > 0) {
        await authSupabase
          .from('orders')
          .update({ nft_transfer_tx_hash: nftTransfers[0].txHash })
          .eq('id', order.id);
      }
    }

    if (isCryptoPayment && supabaseAdmin) {
      for (const item of items) {
        const productId = item.productId || item.id;
        const { data: prod } = await supabaseAdmin
          .from('products')
          .select('seller_id')
          .eq('id', productId)
          .single();

        if (prod?.seller_id) {
          const { error: balError } = await supabaseAdmin.rpc('increment_balance', {
            p_user_id: prod.seller_id,
            p_amount: Number(item.price) * Number(item.quantity)
          });
          if (balError) console.error(`Gagal update saldo untuk seller ${prod.seller_id}:`, balError.message);
          else console.log(`✅ Saldo seller ${prod.seller_id} bertambah: +${Number(item.price) * Number(item.quantity)}`);
        }
      }
    }

    res.status(201).json({ 
      message: isCryptoPayment 
        ? "Pembayaran crypto berhasil! Pesanan dikonfirmasi." 
        : "Pesanan berhasil dibuat!",
      orderId: order.id,
      nftTransfers: nftTransfers.length > 0 ? nftTransfers : undefined
    });
  } catch (error) {
    console.error('[createOrder] Error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const authSupabase = getAuthClient(req);

    const { data, error } = await authSupabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json({ message: "Status pesanan diupdate", data: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const requestPayout = async (req, res) => {
  try {
    const { amount, wallet_address, chain } = req.body;
    const authSupabase = getAuthClient(req);

    if (!amount || amount <= 0) return res.status(400).json({ error: "Jumlah penarikan tidak valid" });
    if (!wallet_address) return res.status(400).json({ error: "Alamat wallet tujuan wajib diisi" });

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('balance')
      .eq('id', req.user.id)
      .single();

    if (profileErr) throw profileErr;
    if ((profile?.balance || 0) < amount) {
      return res.status(400).json({ error: "Saldo tidak mencukupi" });
    }

    const { error: deductError } = await supabaseAdmin.rpc('increment_balance', {
      p_user_id: req.user.id,
      p_amount: -Number(amount)
    });

    if (deductError) throw deductError;

    let txHash = null;
    let finalStatus = 'pending';
    
    console.log(`[Auto-Payout] Memulai proses untuk chain: ${chain}, Amount: ${amount}`);
    if (chain === 'evm' && process.env.MERCHANT_PRIVATE_KEY) {
      try {
        const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545'); // Hardhat local
        const wallet = new ethers.Wallet(process.env.MERCHANT_PRIVATE_KEY, provider);
        
        // Konversi IDR ke ETH (Asumsi 1 ETH = Rp 50.000.000)
        // Gunakan presisi yang lebih tinggi untuk ethers.parseEther
        const ethAmount = (amount / 50000000).toFixed(12);
        
        console.log(`[Auto-Payout ETH] Mengirim ${ethAmount} ETH ke ${wallet_address}...`);
        
        // Cek saldo merchant sebelum kirim
        const merchantBalance = await provider.getBalance(wallet.address);
        const amountWei = ethers.parseEther(ethAmount);
        
        if (merchantBalance < amountWei) {
            throw new Error(`Saldo Merchant (Hardhat) tidak mencukupi untuk penarikan ini. Saldo: ${ethers.formatEther(merchantBalance)} ETH`);
        }

        const tx = await wallet.sendTransaction({
          to: wallet_address,
          value: amountWei
        });
        
        console.log(`[Auto-Payout ETH] Transaksi dikirim: ${tx.hash}. Menunggu konfirmasi...`);
        await tx.wait(); 
        txHash = tx.hash;
        finalStatus = 'completed';
        console.log(`[Auto-Payout ETH] Sukses! Hash: ${txHash}`);
      } catch (err) {
        console.error('[Auto-Payout ETH] Gagal transfer kripto:', err.message);
        // Jika gagal karena saldo atau teknis, status tetap pending agar bisa diproses admin
        finalStatus = 'pending'; 
      }
    }

    const { data, error: payoutError } = await supabaseAdmin
      .from('payout_requests')
      .insert([{
        user_id: req.user.id,
        amount: Number(amount),
        wallet_address,
        chain: chain || 'evm',
        status: finalStatus,
        tx_hash: txHash
      }])
      .select()
      .single();

    if (payoutError) {
      await supabaseAdmin.rpc('increment_balance', { p_user_id: req.user.id, p_amount: Number(amount) });
      throw payoutError;
    }

    const resMsg = finalStatus === 'completed' 
      ? "Pencairan dana otomatis berhasil! Saldo telah masuk ke wallet Anda."
      : "Permintaan pencairan dana diterima! Sedang dalam proses manual.";

    res.json({ message: resMsg, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPayouts = async (req, res) => {
  try {
    const authSupabase = getAuthClient(req);
    const { data, error } = await authSupabase
      .from('payout_requests')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const transferBalance = async (req, res) => {
  try {
    const { recipientUsername, amount } = req.body;
    const authSupabase = getAuthClient(req);

    if (!amount || amount <= 0) return res.status(400).json({ error: "Jumlah transfer tidak valid" });
    if (!recipientUsername) return res.status(400).json({ error: "Username tujuan wajib diisi" });
    if (recipientUsername === req.user.user_metadata?.username || recipientUsername === req.user.id) {
        return res.status(400).json({ error: "Tidak bisa mengirim ke diri sendiri" });
    }

    // 1. Cari penerima
    const { data: recipient, error: recErr } = await supabaseAdmin
      .from('profiles')
      .select('id, balance, username')
      .eq('username', recipientUsername)
      .single();

    if (recErr || !recipient) return res.status(404).json({ error: `User "${recipientUsername}" tidak ditemukan` });

    // 2. Cek saldo pengirim
    const { data: sender, error: senderErr } = await supabaseAdmin
      .from('profiles')
      .select('balance')
      .eq('id', req.user.id)
      .single();

    if (senderErr) throw senderErr;
    if ((sender?.balance || 0) < amount) return res.status(400).json({ error: "Saldo tidak mencukupi" });

    // 3. Eksekusi transfer (Atomic via RPC)
    const { error: deductErr } = await supabaseAdmin.rpc('increment_balance', {
      p_user_id: req.user.id,
      p_amount: -Number(amount)
    });
    if (deductErr) throw deductErr;

    const { error: addErr } = await supabaseAdmin.rpc('increment_balance', {
      p_user_id: recipient.id,
      p_amount: Number(amount)
    });

    if (addErr) {
      // Rollback sender balance if recipient update fails
      await supabaseAdmin.rpc('increment_balance', { p_user_id: req.user.id, p_amount: Number(amount) });
      throw addErr;
    }

    // 4. Log transaksi (menggunakan tabel payout_requests sebagai general ledger sementara)
    await supabaseAdmin
      .from('payout_requests')
      .insert([
        {
          user_id: req.user.id,
          amount: Number(amount),
          wallet_address: `Transfer to @${recipientUsername}`,
          chain: 'internal',
          status: 'completed',
          tx_hash: `FROM_${req.user.id}_TO_${recipient.id}`
        },
        {
          user_id: recipient.id,
          amount: Number(amount),
          wallet_address: `Received from @${req.user.user_metadata?.username || 'user'}`,
          chain: 'internal',
          status: 'completed',
          tx_hash: `INCOMING_${req.user.id}`
        }
      ]);

    res.json({ message: `Berhasil mengirim ${amount} ke @${recipientUsername}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
