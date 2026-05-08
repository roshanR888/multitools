import { useState, useEffect } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import Dropzone from './Dropzone';
import { fileToDataUrl, downloadBlob, formatBytes, dataUrlToBlob } from '../lib/utils';
import confetti from 'canvas-confetti';

export default function CompressorTool() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [targetSizeKb, setTargetSizeKb] = useState(50);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFiles = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setOriginalFile(file);
    const dataUrl = await fileToDataUrl(file);
    setSourceImage(dataUrl);
    compress(dataUrl, targetSizeKb);
  };

  const compress = (dataUrl: string, targetKb: number) => {
    setIsProcessing(true);
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      let quality = 0.9;
      let resultDataUrl = '';
      
      // Binary search or iterative adjustment for target size
      // For simplicity, we use quality adjustment
      const targetBytes = targetKb * 1024;
      
      const attempt = (q: number) => {
        const tempUrl = canvas.toDataURL('image/jpeg', q);
        const bytes = Math.round((tempUrl.length * 3) / 4);
        return { url: tempUrl, bytes };
      };

      let bestResult = attempt(quality);
      
      // Crude iteration to get closer to target
      for (let i = 0; i < 10; i++) {
        if (bestResult.bytes > targetBytes && quality > 0.05) {
          quality -= 0.1;
          bestResult = attempt(quality);
        } else {
          break;
        }
      }

      setCompressedImage(bestResult.url);
      setCompressedSize(bestResult.bytes);
      setIsProcessing(false);
    };
  };

  useEffect(() => {
    if (sourceImage) {
      compress(sourceImage, targetSizeKb);
    }
  }, [targetSizeKb]);

  const handleDownload = async () => {
    if (compressedImage) {
      const blob = await dataUrlToBlob(compressedImage);
      downloadBlob(blob, `compressed-${originalFile?.name || 'image.jpg'}`);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#4f46e5', '#8b5cf6']
      });
    }
  };

  return (
    <div className="space-y-6">
      {!sourceImage ? (
        <Dropzone onFiles={handleFiles} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Original</p>
              <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <img src={sourceImage} className="w-full h-full object-contain" alt="Original" />
              </div>
              <p className="text-sm font-semibold">{formatBytes(originalFile?.size || 0)}</p>
            </div>
            
            <div className="glass-card space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Compressed</p>
              <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative">
                {isProcessing ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10">
                    <RefreshCw className="animate-spin text-blue-600" />
                  </div>
                ) : null}
                {compressedImage && <img src={compressedImage} className="w-full h-full object-contain" alt="Compressed" />}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-blue-600">{formatBytes(compressedSize || 0)}</p>
                <div className="text-xs font-bold px-2 py-1 bg-green-500/10 text-green-500 rounded-lg">
                  -{Math.round((1 - (compressedSize || 0) / (originalFile?.size || 1)) * 100)}%
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold">Target Size: <span className="text-blue-600">{targetSizeKb} KB</span></label>
            </div>
            <input 
              type="range" 
              min="10" 
              max="1000" 
              step="10"
              value={targetSizeKb}
              onChange={(e) => setTargetSizeKb(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleDownload}
              disabled={isProcessing}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50"
            >
              <Download size={20} />
              Download Compressed Image
            </button>
            <button
              onClick={() => {
                setSourceImage(null);
                setCompressedImage(null);
              }}
              className="glass-card !py-4 px-8 font-bold text-slate-600 dark:text-white"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
