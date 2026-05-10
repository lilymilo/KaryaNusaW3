import { memo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function PdfCover({ url, className }) {
  if (!url) return null;

  return (
    <div className={`flex items-center justify-center overflow-hidden bg-white dark:bg-gray-800 ${className || ''}`}>
      <Document
        file={url}
        loading={
          <div className="w-full h-full min-h-[100px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 animate-pulse">
            <span className="text-gray-400 font-bold text-xs">Memuat PDF...</span>
          </div>
        }
        error={
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 p-2">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-1">
              <span className="text-red-500 font-black text-[10px]">PDF</span>
            </div>
            <span className="text-red-400 font-bold text-[8px] text-center">Gagal memuat cover</span>
          </div>
        }
      >
        <Page
          pageNumber={1}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="w-full h-full flex justify-center items-center"
          width={400} // Set a fixed max width to ensure it scales reasonably within its container
        />
      </Document>
    </div>
  );
}

export default memo(PdfCover);
