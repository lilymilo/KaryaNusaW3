import { useState } from 'react';
import { Archive, FileText, Video, Image as ImageIcon, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DownloadButton({ url, defaultName }) {
  const [loading, setLoading] = useState(false);

  if (!url) return null;

  const getExtension = (url) => {
    try {
      const pathname = new URL(url).pathname;
      const parts = pathname.split('.');
      if (parts.length > 1) {
        return parts.pop().toLowerCase();
      }
    } catch {
      const parts = url.split('.');
      if (parts.length > 1) {
        return parts.pop().toLowerCase();
      }
    }
    return '';
  };

  const ext = getExtension(url);
  
  let Icon = FileText;
  let label = 'Dokumen';

  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    Icon = Archive;
    label = 'Arsip';
  } else if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) {
    Icon = Video;
    label = 'Video';
  } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
    Icon = ImageIcon;
    label = 'Gambar';
  } else if (ext === 'pdf') {
    Icon = FileText;
    label = 'PDF';
  }

  // Generate safe filename from URL or defaultName
  const getFilenameFromUrl = (url) => {
    try {
      const pathname = new URL(url).pathname;
      return pathname.split('/').pop();
    } catch {
      return url.split('/').pop();
    }
  };

  const urlFilename = getFilenameFromUrl(url);
  const fileName = defaultName ? `${defaultName}.${ext || 'file'}` : (urlFilename || `download.${ext || 'file'}`);

  const handleDownload = async () => {
    if (loading) return;
    
    setLoading(true);
    toast.loading(`Mendownload ${fileName}...`, { id: `dl-${url}` });
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      
      const blobUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = fileName;
      
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
      
      toast.success(`${fileName} berhasil diunduh!`, { id: `dl-${url}` });
    } catch (err) {
      console.error("Download error:", err);
      toast.error(`Gagal mendownload via Blob, membuka tab baru...`, { id: `dl-${url}` });
      // Fallback to standard open in new tab if CORS or other network issue
      window.open(url, '_blank');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-3 p-3 w-full sm:w-auto min-w-[240px] bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/60 shadow-sm rounded-xl hover:bg-white/90 dark:hover:bg-gray-800/90 hover:shadow transition-all group text-left disabled:opacity-70 disabled:cursor-not-allowed"
    >
      <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-emerald-900/20 flex items-center justify-center text-green-600 dark:text-emerald-400 group-hover:scale-105 transition-transform shrink-0 shadow-sm">
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-900 dark:text-white truncate" title={fileName}>
          {fileName}
        </p>
        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mt-0.5">
          {label} {ext && `• ${ext}`}
        </p>
      </div>
      <div className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 dark:bg-gray-900/50 text-gray-400 group-hover:text-green-600 dark:group-hover:text-emerald-400 group-hover:bg-green-50 dark:group-hover:bg-emerald-900/30 transition-all">
        {loading ? (
          <Loader2 size={16} className="animate-spin text-green-600 dark:text-emerald-400" />
        ) : (
          <Download size={16} strokeWidth={2.5} />
        )}
      </div>
    </button>
  );
}
