import { useState } from 'react';
import { Download } from 'lucide-react';
import Dropzone from './Dropzone';
import { fileToDataUrl, downloadBlob, dataUrlToBlob } from '../lib/utils';
import confetti from 'canvas-confetti';

export default function WebPTool() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [webpData, setWebpData] = useState<string | null>(null);

  const handleFiles = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setOriginalFile(file);
    const dataUrl = await fileToDataUrl(file);
    setSourceImage(dataUrl);
    convertToWebP(dataUrl);
  };

  const convertToWebP = (url: string) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const webpUrl = canvas.toDataURL('image/webp', 0.9);
      setWebpData(webpUrl);
    };
  };

  const handleDownload = async () => {
    if (webpData) {
      const blob = await dataUrlToBlob(webpData);
      downloadBlob(blob, `${originalFile?.name.split('.')[0] || 'converted'}.webp`);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  return (
    <div className="space-y-6">
      {!sourceImage ? (
        <Dropzone onFiles={handleFiles} />
      ) : (
        <div className="space-y-6 text-center">
          <div className="glass-card flex flex-col items-center gap-6">
             <div className="w-full flex items-center justify-center gap-4">
                <div className="glass-card flex-1 !p-3 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Input</span>
                  <p className="font-bold">{originalFile?.type.split('/')[1].toUpperCase()}</p>
                </div>
                <div className="w-8 h-[2px] bg-slate-300"></div>
                <div className="glass-card flex-1 !p-3 flex flex-col items-center border-blue-500/30">
                  <span className="text-[10px] font-bold text-blue-400 uppercase">Output</span>
                  <p className="font-bold text-blue-600">WEBP</p>
                </div>
             </div>
             
             <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
               {sourceImage && <img src={sourceImage} className="w-full h-full object-contain" />}
             </div>

             <div className="w-full space-y-4">
                <button
                  onClick={handleDownload}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                  <Download size={20} />
                  Download WebP Image
                </button>
                <button
                  onClick={() => {
                    setSourceImage(null);
                    setWebpData(null);
                  }}
                  className="w-full glass-card !py-4 font-bold text-slate-600 dark:text-white"
                >
                  Convert Another
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
