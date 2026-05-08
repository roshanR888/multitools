import { useState, useEffect } from 'react';
import { Download, RefreshCw, AlertCircle, RefreshCcw } from 'lucide-react';
import { removeBackground } from '@imgly/background-removal';
import Dropzone from './Dropzone';
import { fileToDataUrl, downloadBlob, cn } from '../lib/utils';
import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'motion/react';

export default function BgRemoverTool() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFiles = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setError(null);
    const dataUrl = await fileToDataUrl(file);
    setSourceImage(dataUrl);
    processBackgroundRemoval(file);
  };

  const processBackgroundRemoval = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    try {
      // @imgly/background-removal process
      const blob = await removeBackground(file, {
        progress: (key, current, total) => {
          const p = Math.round((current / total) * 100);
          setProgress(p);
        },
        model: 'isnet_fp16' as any, // Use specific model type
      });
      
      if (!blob) throw new Error("Background removal failed to produce an image.");

      const resultUrl = URL.createObjectURL(blob);
      setProcessedImage(resultUrl);
      
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981']
      });
    } catch (err: any) {
      console.error('BG Removal Error:', err);
      setError("Failed to remove background. This tool requires a modern browser and may download model data on first use.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (processedImage) {
      fetch(processedImage)
        .then(res => res.blob())
        .then(blob => {
          downloadBlob(blob, 'background-removed-mediaspark.png');
        });
    }
  };

  return (
    <div className="space-y-6">
      {!sourceImage ? (
        <div className="space-y-4">
          <Dropzone onFiles={handleFiles} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Before</p>
              <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {sourceImage && <img src={sourceImage} className="w-full h-full object-contain" alt="Original" />}
              </div>
            </div>
            
            <div className="glass-card space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">After (Transparency)</p>
              <div className={cn(
                "aspect-square rounded-xl overflow-hidden flex items-center justify-center relative",
                "bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] bg-slate-200 dark:bg-slate-800"
              )}>
                <AnimatePresence>
                  {isProcessing && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 p-6"
                    >
                      <div className="flex flex-col items-center gap-4 w-full max-w-[200px]">
                        <div className="relative">
                          <RefreshCw className="animate-spin text-blue-600" size={40} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-blue-600">AI</span>
                          </div>
                        </div>
                        <div className="w-full space-y-2">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                            <span>Processing</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-blue-600"
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 animate-pulse text-center">
                          {progress < 20 ? "Loading AI models..." : "Removing background..."}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <div className="p-8 text-center flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
                      <AlertCircle size={24} />
                    </div>
                    <p className="text-red-500 font-bold text-sm leading-relaxed">
                      {error}
                    </p>
                    <button 
                      onClick={() => processBackgroundRemoval(dataUrlToFile(sourceImage, 'temp.jpg'))}
                      className="text-xs font-bold flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <RefreshCcw size={14} /> Retry Process
                    </button>
                  </div>
                )}
                
                {processedImage && (
                  <motion.img 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    src={processedImage} 
                    className="w-full h-full object-contain z-0" 
                    alt="Processed" 
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleDownload}
              disabled={isProcessing || !processedImage}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50"
            >
              <Download size={20} />
              Save with Transparency
            </button>
            <button
              onClick={() => {
                setSourceImage(null);
                setProcessedImage(null);
                setError(null);
              }}
              className="glass-card !py-4 px-8 font-bold text-slate-600 dark:text-white hover:bg-slate-200 transition-colors"
            >
              Start New
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to convert dataURL back to File for retry
function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

