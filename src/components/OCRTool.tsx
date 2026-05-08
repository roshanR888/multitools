import { useState } from 'react';
import { Copy, Check, RefreshCw, X } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { AnimatePresence, motion } from 'motion/react';
import Dropzone from './Dropzone';
import { fileToDataUrl } from '../lib/utils';

export default function OCRTool() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setError(null);
    const dataUrl = await fileToDataUrl(file);
    setSourceImage(dataUrl);
    performOCR(dataUrl);
  };

  const performOCR = async (url: string) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    
    let worker;
    try {
      setStatus('Initializing AI engine...');
      worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setStatus('Recognizing text...');
            setProgress(Math.round(m.progress * 100));
          } else {
            setStatus(m.status.replace(/_/g, ' '));
          }
        }
      });
      
      const { data: { text } } = await worker.recognize(url);
      setExtractedText(text || "No text found in image.");
      await worker.terminate();
    } catch (err: any) {
      console.error('OCR Error:', err);
      setError("Failed to extract text. This can happen with very large images or restricted connections.");
    } finally {
      setIsProcessing(false);
      setStatus('');
    }
  };

  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {!sourceImage ? (
        <Dropzone onFiles={handleFiles} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="glass-card !p-0 overflow-hidden aspect-video relative flex items-center justify-center bg-slate-100 dark:bg-slate-800">
             {sourceImage && <img src={sourceImage} className="max-w-full max-h-full object-contain" alt="Source" />}
             
             <AnimatePresence>
               {isProcessing && (
                 <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-4 z-20"
                 >
                   <RefreshCw className="animate-spin text-blue-400" size={40} />
                   <div className="text-center px-4 w-full max-w-xs">
                      <p className="font-bold text-lg mb-1">{status}</p>
                      {progress > 0 && <p className="text-sm font-medium text-blue-300 mb-3">{progress}%</p>}
                      <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-blue-500" 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                        />
                      </div>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>

             {error && (
               <div className="absolute inset-0 bg-red-500/10 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
                 <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-xl flex flex-col items-center gap-3 border border-red-500/20">
                   <p className="text-red-500 font-bold text-sm">{error}</p>
                   <button 
                     onClick={() => { setSourceImage(null); setExtractedText(''); setError(null); }}
                     className="text-xs font-bold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
                   >
                     Try Again
                   </button>
                 </div>
               </div>
             )}
          </div>

          <div className="glass-card space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-400 uppercase tracking-wider text-xs">Extracted Text</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  disabled={!extractedText || isProcessing}
                  className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
              </div>
            </div>
            <textarea
              readOnly
              value={extractedText}
              placeholder={isProcessing ? "Analyzing image..." : "Extracted text will appear here..."}
              className="w-full h-48 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm focus:outline-none ring-0 border-none resize-none font-mono text-slate-700 dark:text-slate-300"
            />
          </div>

          <button
            onClick={() => {
              setSourceImage(null);
              setExtractedText('');
              setError(null);
            }}
            className="glass-card !py-4 font-bold text-slate-600 dark:text-white flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
            Reset Tool
          </button>
        </div>
      )}
    </div>
  );
}
