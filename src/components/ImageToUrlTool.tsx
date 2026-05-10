import React, { useState } from 'react';
import { Copy, Check, Link as LinkIcon, RefreshCcw, FileCode, Globe, Loader2, ExternalLink } from 'lucide-react';
import Dropzone from './Dropzone';
import { fileToDataUrl, cn } from '../lib/utils';
import confetti from 'canvas-confetti';

export default function ImageToUrlTool() {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [onlineUrl, setOnlineUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'data' | 'public'>('data');

  const handleFiles = async (files: File[]) => {
    const file = files[0];
    setCurrentFile(file);
    setFileName(file.name);
    setFileSize(file.size);
    const result = await fileToDataUrl(file);
    setSourceImage(result);
    setDataUrl(result);
    setOnlineUrl(null); // Reset online URL on new image
  };

  const uploadToCloud = async () => {
    if (!currentFile || isUploading) return;
    
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      // Use 'file' as key for our proxy server
      formData.append('file', currentFile);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const contentType = response.headers.get('content-type');
      if (!response.ok || !contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Server error response:', text);
        throw new Error(text.includes('<html>') ? 'Server error. Please try again later.' : text || 'Upload failed');
      }
      
      const data = await response.json();
      
      if (data.success && data.link) {
        setOnlineUrl(data.link);
        setActiveTab('public');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        throw new Error(data.description || 'Upload failed');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError('Public upload failed. This usually happens due to temporary server issues or file size limits. Please use the "Data URL" tab above instead.');
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setSourceImage(null);
    setCurrentFile(null);
    setDataUrl(null);
    setOnlineUrl(null);
    setCopied(false);
  };

  return (
    <div className="space-y-6">
      {!sourceImage ? (
        <Dropzone onFiles={handleFiles} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card rounded-3xl overflow-hidden bg-slate-900 border-none aspect-video flex items-center justify-center relative group">
              {sourceImage && <img src={sourceImage} className="max-w-full max-h-full object-contain" alt="Preview" />}
              <div className="absolute bottom-4 right-4 glass px-3 py-1.5 rounded-full text-[10px] font-bold text-white shadow-xl">
                {(fileSize / 1024).toFixed(1)} KB
              </div>
            </div>

            <div className="glass-card !p-0 overflow-hidden">
               <div className="flex border-b border-slate-100 dark:border-slate-800">
                  <button 
                    onClick={() => setActiveTab('data')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-wider transition-all",
                      activeTab === 'data' ? "bg-slate-50 dark:bg-slate-800/50 text-indigo-600 border-b-2 border-indigo-600" : "text-slate-400"
                    )}
                  >
                    <FileCode size={14} />
                    Data URL
                  </button>
                  <button 
                    onClick={() => setActiveTab('public')}
                    disabled={!onlineUrl}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40",
                      activeTab === 'public' ? "bg-slate-50 dark:bg-slate-800/50 text-indigo-600 border-b-2 border-indigo-600" : "text-slate-400"
                    )}
                  >
                    <Globe size={14} />
                    Public Link
                  </button>
               </div>
               
               <div className="p-4 space-y-4">
                 {activeTab === 'data' ? (
                   <div className="space-y-2">
                     <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                       <span>Base64 String</span>
                       <span>{dataUrl?.length.toLocaleString()} characters</span>
                     </div>
                     <textarea 
                      readOnly
                      value={dataUrl || ''}
                      className="w-full h-40 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none font-mono text-[10px] resize-none focus:ring-2 ring-indigo-500 transition-all text-slate-600 dark:text-slate-300"
                    />
                   </div>
                 ) : (
                   <div className="space-y-4 py-4 text-center">
                     {error && (
                       <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 rounded-2xl flex items-start gap-3 text-left">
                         <div className="p-1 px-2.5 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 font-bold text-xs">!</div>
                         <p className="text-[11px] text-red-600 dark:text-red-400 font-medium leading-relaxed">{error}</p>
                       </div>
                     )}
                     {onlineUrl ? (
                       <div className="space-y-4">
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/30 break-all">
                            <p className="text-sm font-mono text-blue-700 dark:text-blue-400 font-bold">{onlineUrl}</p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => copyToClipboard(onlineUrl)}
                              className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                            >
                              {copied ? <Check size={18} /> : <Copy size={18} />}
                              {copied ? 'Copied' : 'Copy Link'}
                            </button>
                            <a 
                              href={onlineUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center"
                            >
                              <ExternalLink size={18} />
                            </a>
                          </div>
                          <p className="text-[10px] text-slate-400">This is a temporary link that will expire in 7 days.</p>
                       </div>
                     ) : (
                       <div className="py-8 space-y-2">
                         <Globe size={32} className="mx-auto text-slate-300" />
                         <p className="text-sm text-slate-500 font-medium">Generate a shareable public link for this image.</p>
                       </div>
                     )}
                   </div>
                 )}
               </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-card space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Sharing Options</h3>
              
              {!onlineUrl && (
                <button
                  onClick={uploadToCloud}
                  disabled={isUploading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
                >
                  {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Globe size={20} />}
                  {isUploading ? 'Uploading...' : 'Generate Public Link'}
                </button>
              )}

              <button
                onClick={() => copyToClipboard(activeTab === 'data' ? dataUrl! : onlineUrl!)}
                disabled={activeTab === 'public' && !onlineUrl}
                className={cn(
                  "w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50",
                  copied 
                    ? "bg-green-600 text-white shadow-green-600/20" 
                    : "glass-card !bg-white/50 dark:!bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                )}
              >
                {copied ? <Check size={20} /> : <Copy size={20} />}
                {copied ? 'Copied!' : `Copy ${activeTab === 'data' ? 'Data URL' : 'Public Link'}`}
              </button>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50">
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  {activeTab === 'data' 
                    ? "Data URLs embed images directly into code. Best for small icons and assets."
                    : "Public links allow you to share this image with anyone via a temporary URL."}
                </p>
              </div>

              <button
                onClick={reset}
                className="w-full glass-card !py-3 font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCcw size={16} />
                New Image
              </button>
            </div>

            <div className="glass-card p-4 space-y-3">
              <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">File Info</h4>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Filename</span>
                <span className="text-slate-900 dark:text-white font-bold truncate max-w-[150px]">{fileName}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">MIME Type</span>
                <span className="text-slate-900 dark:text-white font-bold">{dataUrl?.split(';')[0].split(':')[1]}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
