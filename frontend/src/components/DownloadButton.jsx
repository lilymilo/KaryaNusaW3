import { useState } from 'react';
import { Archive, FileText, Video, Image as ImageIcon, Download, Loader2, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DownloadButton({ url, defaultName, isPrimary, isPreview }) {
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
    if (loading || isPreview) return;
    
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

  const baseClasses = "flex items-center gap-3 p-3 w-full sm:w-auto min-w-[240px] backdrop-blur-lg border shadow-sm rounded-xl transition-all group text-left";
  
  let conditionalClasses = "";
  let IconWrapperClasses = "";
  let StatusBadge = null;

  if (isPreview) {
    conditionalClasses = "bg-gray-50/50 dark:bg-gray-800/30 border-gray-200/40 dark:border-gray-700/40 opacity-60 cursor-not-allowed";
    IconWrapperClasses = "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400";
    StatusBadge = <span className="bg-gray-400 dark:bg-gray-600 text-white px-1.5 py-[1px] rounded-[4px] text-[8px] font-black tracking-widest shrink-0">PREVIEW</span>;
  } else if (isPrimary) {
    conditionalClasses = "bg-green-50/80 dark:bg-emerald-900/30 border-green-300/60 dark:border-emerald-700/60 hover:bg-green-100/90 dark:hover:bg-emerald-800/50 hover:shadow-md cursor-pointer";
    IconWrapperClasses = "bg-green-500 dark:bg-emerald-500 text-white group-hover:scale-105 shadow-sm";
    StatusBadge = <span className="bg-green-500 dark:bg-emerald-500 text-white px-1.5 py-[1px] rounded-[4px] text-[8px] font-black tracking-widest shrink-0">PRODUK UTAMA</span>;
  } else {
    conditionalClasses = "bg-white/70 dark:bg-gray-800/70 border-gray-200/60 dark:border-gray-700/60 hover:bg-white/90 dark:hover:bg-gray-800/90 hover:shadow cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed";
    IconWrapperClasses = "bg-green-50 dark:bg-emerald-900/20 text-green-600 dark:text-emerald-400 group-hover:scale-105 shadow-sm";
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading || isPreview}
      className={`${baseClasses} ${conditionalClasses}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform ${IconWrapperClasses}`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold truncate ${isPreview ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`} title={fileName}>
          {fileName}
        </p>
        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mt-1 flex items-center gap-1.5">
          {StatusBadge}
          <span className="truncate">{label} {ext && `• ${ext}`}</span>
        </p>
      </div>
      <div className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all ${
        isPreview 
          ? 'bg-transparent text-gray-400 dark:text-gray-500' 
          : 'bg-white/50 dark:bg-gray-900/50 text-gray-400 group-hover:text-green-600 dark:group-hover:text-emerald-400 group-hover:bg-green-50 dark:group-hover:bg-emerald-900/30'
      }`}>
        {loading ? (
          <Loader2 size={16} className="animate-spin text-green-600 dark:text-emerald-400" />
        ) : isPreview ? (
          <EyeOff size={16} strokeWidth={2} />
        ) : (
          <Download size={16} strokeWidth={2.5} />
        )}
      </div>
    </button>
  );
}
