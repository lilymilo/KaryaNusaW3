/**
 * Midtrans Snap.js loader — lazy loads the Snap script only when needed.
 * Avoids loading the script on every page.
 */

let snapPromise = null;

/**
 * Load Midtrans Snap.js script and return the window.snap object.
 * Idempotent — calling multiple times returns the same promise.
 */
export const loadSnap = () => {
  if (snapPromise) return snapPromise;

  snapPromise = new Promise((resolve, reject) => {
    // Sudah ter-load
    if (window.snap) {
      resolve(window.snap);
      return;
    }

    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
    if (!clientKey) {
      reject(new Error('VITE_MIDTRANS_CLIENT_KEY belum dikonfigurasi'));
      return;
    }

    const isProd = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true';
    const src = isProd
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';

    const script = document.createElement('script');
    script.src = src;
    script.setAttribute('data-client-key', clientKey);
    script.async = true;

    script.onload = () => {
      if (window.snap) {
        resolve(window.snap);
      } else {
        reject(new Error('Midtrans Snap gagal dimuat'));
      }
    };

    script.onerror = () => {
      snapPromise = null; // Reset agar bisa dicoba lagi
      reject(new Error('Gagal memuat script Midtrans Snap'));
    };

    document.head.appendChild(script);
  });

  return snapPromise;
};
