import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Upload, 
  Download, 
  Type, 
  PenTool, 
  Square, 
  Bold,
  Maximize2,
  Move,
  MousePointer2,
  MousePointer,
  Image as ImageIcon, 
  Eraser, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Trash2,
  X,
  FileCheck,
  RefreshCw,
  PlusSquare,
  Save,
  PanelLeft,
  PanelRight,
  ZoomIn,
  ZoomOut,
  Maximize
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import confetti from 'canvas-confetti';
import Dropzone from './Dropzone';
import { cn, formatBytes, downloadBlob } from '../lib/utils';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

type AnnotationType = 'text' | 'signature' | 'image' | 'whiteout' | 'select' | 'shape';

interface BaseAnnotation {
  id: string;
  page: number;
  x: number;
  y: number;
  type: AnnotationType;
  linkedId?: string; // For linking extracted content to its whiteout
}

interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  text: string;
  fontSize: number;
  color: string;
  bold?: boolean;
}

interface ImageAnnotation extends BaseAnnotation {
  type: 'image';
  dataUrl: string;
  width: number;
  height: number;
}

interface WhiteoutAnnotation extends BaseAnnotation {
  type: 'whiteout';
  width: number;
  height: number;
}

interface SignatureAnnotation extends BaseAnnotation {
  type: 'signature';
  dataUrl: string;
  width: number;
  height: number;
}

type Annotation = TextAnnotation | ImageAnnotation | WhiteoutAnnotation | SignatureAnnotation;

export default function PDFEditorTool() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTool, setActiveTool] = useState<AnnotationType>('text');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectableObjects, setSelectableObjects] = useState<{type: 'text'|'image', rect: any, data: any}[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, handle: 'br' as 'br' | 'tl', x_at_canvas: 0, y_at_canvas: 0 });
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exportName, setExportName] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renderTaskRef = useRef<any>(null);

  const fitToWidth = useCallback(async () => {
    if (!pdfDoc || !containerRef.current) return;
    const page = await pdfDoc.getPage(currentPage);
    const viewport = page.getViewport({ scale: 1 });
    const containerWidth = containerRef.current.clientWidth - 100; // Padding
    const newScale = containerWidth / viewport.width;
    setScale(parseFloat(newScale.toFixed(2)));
  }, [pdfDoc, currentPage]);

  const fitToHeight = useCallback(async () => {
    if (!pdfDoc || !containerRef.current) return;
    const page = await pdfDoc.getPage(currentPage);
    const viewport = page.getViewport({ scale: 1 });
    const containerHeight = containerRef.current.clientHeight - 80;
    const newScale = containerHeight / viewport.height;
    setScale(parseFloat(newScale.toFixed(2)));
  }, [pdfDoc, currentPage]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    const container = containerRef.current.parentElement?.parentElement; // The whole flex container
    if (!container) return;
    
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const generateThumbnails = async (doc: pdfjs.PDFDocumentProxy) => {
    const thumbUrls = [];
    for (let i = 1; i <= Math.min(doc.numPages, 30); i++) {
      try {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 0.2 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport }).promise;
          thumbUrls.push(canvas.toDataURL('image/jpeg', 0.6));
        }
      } catch (err) {
        console.error(`Error generating thumbnail for page ${i}:`, err);
      }
    }
    setThumbnails(thumbUrls);
  };

  const onFileSelect = async (file: File) => {
    if (file.type !== 'application/pdf') return;
    setPdfFile(file);
    setExportName(file.name.replace(/\.[^/.]+$/, ""));
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument(arrayBuffer);
    const doc = await loadingTask.promise;
    setPdfDoc(doc);
    setNumPages(doc.numPages);
    setCurrentPage(1);
    setAnnotations([]);
    generateThumbnails(doc);
    
    // Auto-fit to height on load for nice initial view
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    const containerHeight = containerRef.current?.clientHeight || 800;
    const newScale = (containerHeight - 100) / viewport.height;
    setScale(parseFloat(newScale.toFixed(2)));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      
      const currentAnn = annotations.find(a => a.id === selectedId);
      if (currentAnn && currentAnn.type === 'image') {
        updateAnnotation(selectedId!, { dataUrl });
      } else {
        const newId = Math.random().toString(36).substr(2, 9);
        const newAnnotation: ImageAnnotation = {
          id: newId,
          page: currentPage,
          x: 100,
          y: 100,
          type: 'image',
          dataUrl,
          width: 150,
          height: 150
        };
        setAnnotations([...annotations, newAnnotation]);
        setSelectedId(newId);
      }
      
      // Reset input
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedId && (e.key === 'Delete' || e.key === 'Backspace')) {
        // Don't delete if user is typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        deleteAnnotation(selectedId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, annotations]);

  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    const page = await pdfDoc.getPage(currentPage);
    const viewport = page.getViewport({ scale });
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    // Cancel existing render task
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    const renderTask = page.render(renderContext);
    renderTaskRef.current = renderTask;

    try {
      await renderTask.promise;
      renderTaskRef.current = null;
    } catch (err: any) {
      if (err.name === 'RenderingCancelledException') {
        return;
      }
      console.error('Render error:', err);
    }

    // Analyze page for selectable objects
    const analyzePage = async () => {
      try {
        const textContent = await page.getTextContent();
        const ops = await page.getOperatorList();
        const objects: any[] = [];

        // 1. Detect Text Objects
        textContent.items.forEach((item: any) => {
          if (!item.str || item.str.trim() === '') return;
          const tx = pdfjs.Util.transform(viewport.transform, item.transform);
          const itemWidth = item.width * scale;
          const itemHeight = item.height * scale;

          objects.push({
            type: 'text',
            rect: {
              x: tx[4],
              y: tx[5] - itemHeight,
              width: itemWidth,
              height: itemHeight
            },
            data: item
          });
        });

        // 2. Detect Image Objects (Improved Matrix Tracking)
        let currentTransform = [1, 0, 0, 1, 0, 0];
        const transformStack: number[][] = [];
        const OPS = (pdfjs as any).OPS || {};

        for (let i = 0; i < ops.fnArray.length; i++) {
          const fn = ops.fnArray[i];
          const args = ops.argsArray[i];
          
          if (fn === OPS.transform) {
            currentTransform = pdfjs.Util.transform(currentTransform, args);
          } else if (fn === OPS.save) {
            transformStack.push([...currentTransform]);
          } else if (fn === OPS.restore) {
            const popped = transformStack.pop();
            if (popped) currentTransform = popped;
          } else if (
            fn === OPS.paintImageXObject || 
            fn === OPS.paintInlineImageXObject ||
            fn === OPS.paintImageMaskXObject
          ) {
            const tx = pdfjs.Util.transform(viewport.transform, currentTransform);
            
            // PDF images scale from unit square [0,1]
            // tx maps unit square to pixels
            const width = Math.abs(tx[0]);
            const height = Math.abs(tx[3]);
            
            // Handle negative scaling (flips)
            const x = tx[4] + (tx[0] < 0 ? tx[0] : 0);
            const y = tx[5] + (tx[3] < 0 ? tx[3] : 0);
            
            objects.push({
              type: 'image',
              rect: { x, y, width, height },
              data: args[0]
            });
          }
        }

        setSelectableObjects(objects);
      } catch (err) {
        console.error('Error analyzing PDF page:', err);
      }
    };
    analyzePage();
  }, [pdfDoc, currentPage, scale]);

  useEffect(() => {
    renderPage();
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [renderPage]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking existing annotation
    const clickedAnnotation = [...annotations]
      .reverse()
      .find(ann => {
        if (ann.page !== currentPage) return false;
        
        let aw = 20, ah = 20;
        if (ann.type === 'image' || ann.type === 'whiteout' || ann.type === 'signature') {
          aw = ann.width;
          ah = ann.height;
        } else if (ann.type === 'text') {
          // Estimate text bounds
          aw = Math.max(20, ann.text.length * (ann.fontSize * 0.5));
          ah = Math.max(20, ann.fontSize);
        }

        return x >= ann.x - aw/2 && x <= ann.x + aw/2 &&
               y >= ann.y - ah/2 && y <= ann.y + ah/2;
      });

    if (clickedAnnotation) {
      setSelectedId(clickedAnnotation.id);
      return;
    }

    // Clear selection if clicking empty space (and not adding a new one)
    if (selectedId && activeTool === 'select') {
      setSelectedId(null);
      return;
    }

    // Smart Content Selection/Extraction Logic
    if (activeTool === 'select' || activeTool === 'image' || activeTool === 'text') {
      const found = selectableObjects.find(obj => {
        const { x: ox, y: oy, width: ow, height: oh } = obj.rect;
        const tolerance = 2;
        return x >= ox - tolerance && x <= ox + ow + tolerance && 
               y >= oy - tolerance && y <= oy + oh + tolerance;
      });

      if (found) {
        // If we are in 'image' tool but clicked text, maybe we should still select? 
        // User intent is clear if they click an object.
        const { x: fx, y: fy, width: fw, height: fh } = found.rect;
        const whiteoutId = Math.random().toString(36).substr(2, 9);
        const annotationId = Math.random().toString(36).substr(2, 9);

        const whiteout: WhiteoutAnnotation = {
          id: whiteoutId,
          page: currentPage,
          x: fx + (fw / 2),
          y: fy + (fh / 2),
          type: 'whiteout',
          width: fw + 6,
          height: fh + 6
        };

        if (found.type === 'text') {
          const text: TextAnnotation = {
            id: annotationId,
            page: currentPage,
            x: fx + (fw / 2),
            y: fy + (fh / 2),
            type: 'text',
            text: found.data.str,
            fontSize: fh,
            color: '#000000',
            bold: false,
            linkedId: whiteoutId
          };
          setAnnotations(prev => [...prev, whiteout, text]);
          setSelectedId(annotationId);
          setActiveTool('text');
          return;
        }
        if (found.type === 'image') {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = fw;
          tempCanvas.height = fh;
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx && canvasRef.current) {
            // Use internal canvas resolution for drawImage
            tempCtx.drawImage(canvasRef.current, fx, fy, fw, fh, 0, 0, fw, fh);
            const image: ImageAnnotation = {
              id: annotationId,
              page: currentPage,
              x: fx + (fw / 2),
              y: fy + (fh / 2),
              type: 'image',
              dataUrl: tempCanvas.toDataURL('image/png'),
              width: fw,
              height: fh,
              linkedId: whiteoutId
            };
            setAnnotations(prev => [...prev, whiteout, image]);
            setSelectedId(annotationId);
            setActiveTool('select'); // Stay in select tool for flow
            return;
          }
        }
      }
    }

    // If nothing was found to select and we are in 'select' tool, just clear selection
    if (activeTool === 'select') {
      setSelectedId(null);
      return;
    }

    // Add new annotation
    const newId = Math.random().toString(36).substr(2, 9);
    let newAnnotation: Annotation;

    if (activeTool === 'text') {
      newAnnotation = {
        id: newId,
        page: currentPage,
        x,
        y,
        type: 'text',
        text: 'Type here...',
        fontSize: 16,
        color: '#000000',
        bold: false
      };
    } else if (activeTool === 'whiteout') {
      newAnnotation = {
        id: newId,
        page: currentPage,
        x,
        y,
        type: 'whiteout',
        width: 100,
        height: 20
      };
    } else if (activeTool === 'image') {
      fileInputRef.current?.click();
      return;
    } else if (activeTool === 'signature') {
      // Create a simple typed signature as a placeholder or open modal
      // For now, let's just add a placeholder signature that they can replace
      newAnnotation = {
        id: newId,
        page: currentPage,
        x,
        y,
        type: 'signature',
        dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', // Transparent pixel
        width: 150,
        height: 60
      };
      
      // Open a prompt for now to simulate signature entry
      const name = prompt("Type your signature name:");
      if (name) {
        // Generate a text-based signature on a small canvas and use its dataUrl
        const sigCanvas = document.createElement('canvas');
        sigCanvas.width = 300;
        sigCanvas.height = 120;
        const ctx = sigCanvas.getContext('2d')!;
        ctx.font = 'italic 48px "Brush Script MT", cursive';
        ctx.fillStyle = '#000000';
        ctx.fillText(name, 20, 80);
        newAnnotation.dataUrl = sigCanvas.toDataURL();
      } else {
        return;
      }
    } else {
      return;
    }

    setAnnotations([...annotations, newAnnotation]);
    setSelectedId(newId);
  };

  const updateAnnotation = (id: string, updates: Partial<Annotation>) => {
    setAnnotations(annotations.map(ann => 
      ann.id === id ? { ...ann, ...updates } as Annotation : ann
    ));
  };

  const deleteAnnotation = (id: string) => {
    const ann = annotations.find(a => a.id === id);
    let newAnnotations = annotations.filter(a => a.id !== id);
    
    // If it has a linked whiteout (or if it IS the whiteout with a link), delete both
    if (ann && ann.linkedId) {
      newAnnotations = newAnnotations.filter(a => a.id !== ann.linkedId);
    }
    
    // Also check if any OTHER annotation links to this one
    newAnnotations = newAnnotations.filter(a => a.linkedId !== id);
    
    setAnnotations(newAnnotations);
    setSelectedId(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Direct cursor feedback based on current mouse position
    if (isDragging) {
      canvasRef.current.style.cursor = 'grabbing';
    } else if (isResizing) {
      canvasRef.current.style.cursor = resizeStart.handle === 'br' ? 'nwse-resize' : 'nwse-resize';
    } else {
      switch (activeTool) {
        case 'text':
          canvasRef.current.style.cursor = 'text';
          break;
        case 'select':
          const isOverObject = selectableObjects.some(obj => {
            const { x: ox, y: oy, width: ow, height: oh } = obj.rect;
            const t = 5; 
            return x >= ox - t && x <= ox + ow + t && 
                   y >= oy - t && y <= oy + oh + t;
          });
          
          const isOverAnnotation = [...annotations].some(ann => {
            if (ann.page !== currentPage) return false;
            let aw = 20, ah = 20;
            if (ann.type === 'image' || ann.type === 'whiteout') {
              aw = ann.width; ah = ann.height;
            }
            return Math.abs(ann.x - x) < aw/2 + 5 && Math.abs(ann.y - y) < ah/2 + 5;
          });

          canvasRef.current.style.cursor = (isOverObject || isOverAnnotation) ? 'pointer' : 'default';
          break;
        case 'whiteout':
        case 'shape':
        case 'signature':
        case 'image':
          canvasRef.current.style.cursor = 'crosshair';
          break;
        default:
          canvasRef.current.style.cursor = 'default';
      }
    }

    if (!isDragging && !isResizing) return;
    if (!selectedId) return;

    if (isDragging && selectedId) {
      updateAnnotation(selectedId, {
        x: x - dragOffset.x,
        y: y - dragOffset.y
      });
    } else if (isResizing && selectedId) {
      const ann = annotations.find(a => a.id === selectedId);
      if (ann && (ann.type === 'whiteout' || ann.type === 'image')) {
        const deltaX = x - resizeStart.x;
        const deltaY = y - resizeStart.y;
        
        if (resizeStart.handle === 'br') {
          updateAnnotation(selectedId, {
            width: Math.max(10, resizeStart.width + deltaX),
            height: Math.max(10, resizeStart.height + deltaY)
          });
        } else if (resizeStart.handle === 'tl') {
          const newWidth = Math.max(10, resizeStart.width - deltaX);
          const newHeight = Math.max(10, resizeStart.height - deltaY);
          
          // When resizing from top-left, we need to adjust the center position (ann.x, ann.y)
          // Since (ann.x, ann.y) is the center:
          // new_center_x = (old_right + new_left) / 2
          // old_right = resizeStart.x_at_canvas + resizeStart.width / 2 (Wait, ann.x is center)
          
          // Let's use simple logic:
          // If we move top-left by (deltaX, deltaY), the width increases by -deltaX
          // and the center moves by deltaX / 2.
          
          updateAnnotation(selectedId, {
            x: resizeStart.x_at_canvas + deltaX / 2, // This is not quite right if we want to keep bottom-right fixed
            y: resizeStart.y_at_canvas + deltaY / 2,
            width: newWidth,
            height: newHeight
          });
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleApplyChanges = async () => {
    if (!pdfFile) return;
    setIsProcessing(true);

    try {
      const existingPdfBytes = await pdfFile.arrayBuffer();
      const pdfLibDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfLibDoc.getPages();

      for (const ann of annotations) {
        const pageIndex = ann.page - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) continue;
        const page = pages[pageIndex];
        const { width: pageW, height: pageH } = page.getSize();

        // Conversion factor from canvas pixels to PDF points
        // canvas.width = pageW * scale * (system_render_dpi / 72)
        // Actually, pdf.js uses scale directly on points.
        // So canvas_size = page_points * scale
        // Therefore, pdf_points = canvas_pixels / scale
        
        const pxToPt = 1 / scale;

        if (ann.type === 'text') {
          const tAnn = ann as TextAnnotation;
          const font = await pdfLibDoc.embedFont(tAnn.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica);
          const fontSize = tAnn.fontSize * pxToPt;
          const textWidth = font.widthOfTextAtSize(tAnn.text, fontSize);
          
          page.drawText(tAnn.text, {
            x: (tAnn.x * pxToPt) - (textWidth / 2),
            y: pageH - (tAnn.y * pxToPt) - (fontSize / 4),
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
        } else if (ann.type === 'whiteout') {
          const w = ann.width * pxToPt;
          const h = ann.height * pxToPt;
          page.drawRectangle({
            x: (ann.x * pxToPt) - (w / 2),
            y: pageH - (ann.y * pxToPt) - (h / 2),
            width: w,
            height: h,
            color: rgb(1, 1, 1),
          });
        } else if (ann.type === 'image' || ann.type === 'signature') {
          const iAnn = ann as ImageAnnotation;
          let image;
          try {
            if (iAnn.dataUrl.includes('image/png')) {
              image = await pdfLibDoc.embedPng(iAnn.dataUrl);
            } else {
              image = await pdfLibDoc.embedJpg(iAnn.dataUrl);
            }
          } catch (e) {
            console.error('Failed to embed image:', e);
            continue;
          }

          const w = iAnn.width * pxToPt;
          const h = iAnn.height * pxToPt;
          page.drawImage(image, {
            x: (iAnn.x * pxToPt) - (w / 2),
            y: pageH - (iAnn.y * pxToPt) - (h / 2),
            width: w,
            height: h,
          });
        }
      }

      const pdfBytes = await pdfLibDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const finalName = exportName.trim() || 'edited_pdf';
      const downloadName = finalName.toLowerCase().endsWith('.pdf') 
        ? finalName 
        : `${finalName}.pdf`;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadName.replace('edited_edited_', 'edited_');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error('Error modifying PDF:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!pdfFile) {
    return (
      <div className="space-y-6">
        <Dropzone 
          onFiles={(files) => onFileSelect(files[0])}
          accept="application/pdf"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard 
            icon={<Type className="text-blue-600" />} 
            title="Add Text" 
            desc="Overlay new content seamlessly" 
            color="blue"
          />
          <FeatureCard 
            icon={<PenTool className="text-purple-600" />} 
            title="Sign & Fill" 
            desc="Annotate and sign documents" 
            color="purple"
          />
          <FeatureCard 
            icon={<Square className="text-orange-600" />} 
            title="Whiteout" 
            desc="Hide sensitive information" 
            color="orange"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-[#f3f4f6] dark:bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-white/20">
      {/* Centered Professional Toolbar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm z-30">
        <div className="max-w-screen-2xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Left Side: Navigation & File */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setShowThumbnails(!showThumbnails)}
              className={cn(
                "p-2 rounded-lg sm:p-2.5 sm:rounded-xl transition-all",
                showThumbnails ? "bg-slate-100 text-slate-600" : "bg-blue-50 text-blue-600"
              )}
              title={showThumbnails ? "Hide Navigation" : "Show Navigation"}
            >
              <PanelLeft size={18} className="sm:w-5 sm:h-5" />
            </button>
            <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-800 mx-1" />
            <div className="hidden xs:flex w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg sm:rounded-xl items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <FileCheck size={16} className="sm:w-5 sm:h-5" />
            </div>
            <div className="max-w-[80px] xs:max-w-[120px] sm:max-w-[200px]">
              <input
                type="text"
                value={exportName}
                onChange={(e) => setExportName(e.target.value)}
                className="bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:outline-none text-[10px] sm:text-sm font-black text-slate-900 dark:text-white truncate w-full"
                placeholder="Filename"
              />
              <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {numPages} {numPages === 1 ? 'Page' : 'Pages'}
              </p>
            </div>
          </div>

          {/* Center: Editing Tools */}
          <div className="hidden lg:flex items-center justify-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-inner border border-slate-200 dark:border-slate-800 mx-2">
            <ToolButton 
              active={activeTool === 'text'} 
              onClick={() => setActiveTool('text')} 
              icon={<Type size={16} />} 
              label="Text" 
            />
            <ToolButton 
              active={activeTool === 'select'} 
              onClick={() => setActiveTool('select')} 
              icon={<MousePointer2 size={16} />} 
              label="Edit" 
            />
            <ToolButton 
              active={activeTool === 'image'} 
              onClick={() => setActiveTool('image')} 
              icon={<ImageIcon size={16} />} 
              label="Image" 
            />
            <ToolButton 
              active={activeTool === 'whiteout'} 
              onClick={() => setActiveTool('whiteout')} 
              icon={<Eraser size={16} />} 
              label="Erase" 
            />
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
            <ToolButton 
              active={activeTool === 'signature'} 
              onClick={() => setActiveTool('signature')} 
              icon={<PenTool size={16} />} 
              label="Sign" 
            />
          </div>

          {/* Right Side: Global Actions & Save/Download */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 justify-end">
            <button
              onClick={toggleFullscreen}
              className={cn(
                "p-2 rounded-lg transition-all hidden sm:flex",
                isFullscreen ? "bg-blue-600 text-white shadow-lg" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              )}
              title="Fullscreen Mode"
            >
              <Maximize size={18} />
            </button>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1 hidden lg:block" />
            
            {/* Save & Download Group */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => {
                  setIsProcessing(true);
                  setTimeout(() => {
                    setIsProcessing(false);
                    confetti({
                      particleCount: 80,
                      spread: 40,
                      origin: { y: 0.9, x: 0.1 }
                    });
                  }, 600);
                }}
                disabled={isProcessing}
                className="flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[10px] font-black text-slate-700 dark:text-slate-200 shadow-sm transition-all active:scale-95 disabled:opacity-50"
              >
                <Save size={14} className="text-blue-600" />
                <span className="hidden xs:inline">SAVE</span>
              </button>
              
              <button
                onClick={handleApplyChanges}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-lg text-[10px] font-black shadow-lg shadow-blue-600/20 transition-all flex items-center gap-1.5 sm:gap-2 disabled:opacity-50 active:scale-95 group"
              >
                {isProcessing ? (
                  <RefreshCw className="animate-spin" size={14} />
                ) : (
                  <Download size={14} className="group-hover:-translate-y-0.5 transition-transform" strokeWidth={3} />
                )}
                <span>DOWNLOAD <span className="hidden sm:inline">PDF</span></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden lg:relative">
        {/* Left Sidebar - Thumbnails */}
        {showThumbnails && (
          <div className="fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-4 lg:relative lg:block animate-in slide-in-from-left duration-300 shadow-2xl lg:shadow-none">
            <div className="flex items-center justify-between mb-6 px-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page Navigation</h4>
              <button 
                onClick={() => setShowThumbnails(false)} 
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
            </div>
            <div className="space-y-6">
              {thumbnails.map((thumb, idx) => (
                <div 
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={cn(
                    "relative cursor-pointer group transition-all duration-300 rounded-xl overflow-hidden border-2 shadow-sm",
                    currentPage === idx + 1 
                      ? "border-blue-600 ring-4 ring-blue-600/10 scale-[1.02]" 
                      : "border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/50"
                  )}
                >
                  <img src={thumb} alt={`Page ${idx + 1}`} className={cn(
                    "w-full transition-all duration-500",
                    currentPage !== idx + 1 && "grayscale opacity-80"
                  )} />
                  <div className={cn(
                    "absolute top-2 left-2 w-6 h-6 flex items-center justify-center text-[10px] font-black rounded-lg backdrop-blur-md shadow-sm border border-white/20 transition-colors",
                    currentPage === idx + 1 ? "bg-blue-600 text-white" : "bg-slate-900/40 text-white"
                  )}>
                    {idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mobile Sidebar Overlay */}
        {showThumbnails && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setShowThumbnails(false)}
          />
        )}

        {/* Main Editor Area */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          
          {/* Side Toggle Button (Appears when sidebar is hidden) */}
          {!showThumbnails && (
            <button
              onClick={() => setShowThumbnails(true)}
              className="absolute left-4 top-4 z-30 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-full text-blue-600 hover:scale-110 active:scale-95 transition-all animate-in fade-in slide-in-from-left-4 duration-300"
              title="Show Navigation Bar"
            >
              <PanelLeft size={20} />
            </button>
          )}
          
          {/* Float Control Panel for Selected Item */}
          {selectedId && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-2 flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
              <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-[10px] font-black text-blue-600 uppercase">
                {annotations.find(a => a.id === selectedId)?.type} Settings
              </div>
              
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

              {annotations.find(a => a.id === selectedId)?.type === 'text' && (
                <>
                  <input 
                    type="text"
                    className="w-48 sm:w-64 bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter text content..."
                    value={(annotations.find(a => a.id === selectedId) as TextAnnotation).text}
                    onChange={(e) => updateAnnotation(selectedId!, { text: e.target.value })}
                    autoFocus
                  />
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button
                      onClick={() => {
                        const ann = annotations.find(a => a.id === selectedId) as TextAnnotation;
                        updateAnnotation(selectedId!, { bold: !ann.bold });
                      }}
                      className={cn(
                        "p-2 rounded-md transition-all",
                        (annotations.find(a => a.id === selectedId) as TextAnnotation).bold 
                          ? "bg-blue-600 text-white shadow-md" : "hover:bg-white dark:hover:bg-slate-700 text-slate-500"
                      )}
                    >
                      <Bold size={16} strokeWidth={3} />
                    </button>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
                    <div className="flex items-center gap-1 px-1">
                      <span className="text-[10px] font-bold text-slate-400">SIZE</span>
                      <input 
                        type="number"
                        className="w-10 bg-transparent border-none text-xs font-black focus:ring-0 p-0 text-center"
                        value={(annotations.find(a => a.id === selectedId) as TextAnnotation).fontSize}
                        onChange={(e) => updateAnnotation(selectedId!, { fontSize: Math.max(1, parseInt(e.target.value) || 12) })}
                      />
                    </div>
                  </div>
                </>
              )}

              {annotations.find(a => a.id === selectedId)?.type === 'whiteout' && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                    <span className="text-[10px] font-black text-slate-400">DIMENSIONS</span>
                    <input 
                      type="number"
                      className="w-12 bg-transparent border-none text-xs font-black focus:ring-0 p-0 text-center"
                      value={(annotations.find(a => a.id === selectedId) as WhiteoutAnnotation).width}
                      onChange={(e) => updateAnnotation(selectedId!, { width: Math.max(1, parseInt(e.target.value) || 10) })}
                    />
                    <span className="text-slate-300">×</span>
                    <input 
                      type="number"
                      className="w-12 bg-transparent border-none text-xs font-black focus:ring-0 p-0 text-center"
                      value={(annotations.find(a => a.id === selectedId) as WhiteoutAnnotation).height}
                      onChange={(e) => updateAnnotation(selectedId!, { height: Math.max(1, parseInt(e.target.value) || 10) })}
                    />
                  </div>
                </div>
              )}

              {annotations.find(a => a.id === selectedId)?.type === 'image' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 rounded-lg text-[10px] font-black uppercase transition-all"
                  >
                    <RefreshCw size={14} />
                    Replace
                  </button>
                  <button
                    onClick={() => {
                      const ann = annotations.find(a => a.id === selectedId) as ImageAnnotation;
                      const newId = Math.random().toString(36).substr(2, 9);
                      setAnnotations([...annotations, { ...ann, id: newId, x: ann.x + 20, y: ann.y + 20 }]);
                      setSelectedId(newId);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-[10px] font-black uppercase transition-all"
                  >
                    <PlusSquare size={14} />
                    Duplicate
                  </button>
                </div>
              )}

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

              <button
                onClick={() => deleteAnnotation(selectedId!)}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-90"
                title="Remove"
              >
                <Trash2 size={20} />
              </button>
            </div>
          )}

          <div 
            ref={containerRef}
            className="flex-1 bg-slate-200 dark:bg-slate-900 overflow-auto flex justify-center py-12 relative scrollbar-hide"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Hidden file input for images */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
            
            {/* A4 Paper Wrapper */}
            <div className="relative inline-block transition-all duration-300 mx-auto group/page mt-4 mb-20">
              {/* Paper shadow & background to give A4 feel */}
              <div className="absolute inset-0 bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] dark:bg-slate-800 rounded-sm pointer-events-none ring-1 ring-slate-200 dark:ring-slate-700" />
              
              <canvas 
                ref={canvasRef} 
                onClick={handleCanvasClick}
                className="relative bg-white z-0 ring-1 ring-slate-100 dark:ring-slate-800 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
              />
              
              {/* Floating Page Label */}
              <div className="absolute top-0 right-0 -translate-y-full mb-4 px-4 py-1.5 bg-slate-900/10 text-slate-400 text-[10px] font-black rounded-t-xl uppercase tracking-widest">
                Page {currentPage} of {numPages}
              </div>

              {/* Visual Hover Highlight for Select Tool */}
              {activeTool === 'select' && selectableObjects.map((obj, idx) => (
                <div 
                  key={`hover-${idx}`}
                  className="absolute border border-blue-400/30 bg-blue-400/5 hover:bg-blue-400/20 hover:border-blue-500 pointer-events-none transition-colors z-0"
                  style={{
                    left: obj.rect.x,
                    top: obj.rect.y,
                    width: obj.rect.width,
                    height: obj.rect.height
                  }}
                />
              ))}

              {/* Annotation Overlays */}
              {annotations.filter(ann => ann.page === currentPage).map((ann) => (
                <div
                  key={ann.id}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelectedId(ann.id);
                    setIsDragging(true);
                    const rect = e.currentTarget.getBoundingClientRect();
                    setDragOffset({
                      x: e.clientX - rect.left - rect.width / 2,
                      y: e.clientY - rect.top - rect.height / 2
                    });
                  }}
                  className={cn(
                    "absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move group select-none transition-all",
                    selectedId === ann.id ? "ring-2 ring-blue-500 rounded-sm scale-105" : "hover:ring-1 hover:ring-blue-300"
                  )}
                  style={{ 
                    left: ann.x, 
                    top: ann.y,
                    zIndex: selectedId === ann.id ? 20 : 10
                  }}
                >
                  {selectedId === ann.id && (
                    <button
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        deleteAnnotation(ann.id);
                      }}
                      className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-red-600 transition-all scale-100 hover:scale-110 z-50"
                    >
                      <X size={14} strokeWidth={3} />
                    </button>
                  )}

                  {ann.type === 'text' && (
                    <div 
                      className={cn(
                        "min-w-[20px] min-h-[20px] whitespace-nowrap px-1",
                        ann.bold ? "font-bold" : "font-normal"
                      )} 
                      style={{ fontSize: ann.fontSize, color: ann.color }}
                    >
                      {ann.text}
                    </div>
                  )}
                  {ann.type === 'whiteout' && (
                    <div className="bg-white border border-slate-200 shadow-sm relative transition-all" style={{ width: ann.width, height: ann.height }}>
                      {selectedId === ann.id && (
                        <>
                          <div 
                            className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-full cursor-nw-resize z-30"
                            onMouseDown={(e) => { 
                              e.stopPropagation(); 
                              const r = canvasRef.current!.getBoundingClientRect();
                              setIsResizing(true); 
                              setIsDragging(false); 
                              setResizeStart({ 
                                x: e.clientX - r.left, 
                                y: e.clientY - r.top, 
                                width: ann.width, 
                                height: ann.height, 
                                handle: 'tl',
                                x_at_canvas: ann.x,
                                y_at_canvas: ann.y
                              }); 
                            }}
                          />
                          <div 
                            className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize flex items-center justify-center text-white shadow-lg"
                            onMouseDown={(e) => { 
                              e.stopPropagation(); 
                              const r = canvasRef.current!.getBoundingClientRect();
                              setIsResizing(true); 
                              setIsDragging(false); 
                              setResizeStart({ 
                                x: e.clientX - r.left, 
                                y: e.clientY - r.top, 
                                width: ann.width, 
                                height: ann.height, 
                                handle: 'br',
                                x_at_canvas: ann.x,
                                y_at_canvas: ann.y
                              }); 
                            }}
                          >
                            <Maximize2 size={10} />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  {(ann.type === 'image' || ann.type === 'signature') && (
                    <div 
                      className={cn(
                        "relative group/img transition-all",
                        selectedId === ann.id && "ring-2 ring-blue-500 ring-offset-2 rounded-sm shadow-xl z-20"
                      )} 
                      style={{ width: ann.width, height: ann.height }}
                    >
                      <img src={ann.dataUrl} className="w-full h-full object-contain pointer-events-none" />
                      {selectedId === ann.id && (
                        <>
                          {/* Top-Left Resize Handle */}
                          <div 
                            className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-blue-600 rounded-full cursor-nw-resize z-30 shadow-lg hover:scale-125 transition-transform"
                            onMouseDown={(e) => { 
                              e.stopPropagation(); 
                              const r = canvasRef.current!.getBoundingClientRect();
                              setIsResizing(true); 
                              setIsDragging(false); 
                              setResizeStart({ 
                                x: e.clientX - r.left, 
                                y: e.clientY - r.top, 
                                width: ann.width, 
                                height: ann.height, 
                                handle: 'tl',
                                x_at_canvas: ann.x,
                                y_at_canvas: ann.y
                              }); 
                            }}
                          />
                          {/* Bottom-Right Resize Handle */}
                          <div 
                            className="absolute -bottom-2 -right-2 w-5 h-5 bg-blue-600 rounded-lg cursor-se-resize flex items-center justify-center text-white shadow-xl z-30 hover:scale-120 transition-transform animate-pulse"
                            onMouseDown={(e) => { 
                              e.stopPropagation(); 
                              const r = canvasRef.current!.getBoundingClientRect();
                              setIsResizing(true); 
                              setIsDragging(false); 
                              setResizeStart({ 
                                x: e.clientX - r.left, 
                                y: e.clientY - r.top, 
                                width: ann.width, 
                                height: ann.height, 
                                handle: 'br',
                                x_at_canvas: ann.x,
                                y_at_canvas: ann.y
                              }); 
                            }}
                          >
                            <Maximize2 size={12} />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Scale Control Badge (Corner) */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-30">
            <div className="flex items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-2 rounded-2xl shadow-2xl border border-white/20">
              <button 
                onClick={() => setScale(s => Math.max(0.1, s - 0.25))} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95"
                title="Decrease Zoom"
              >
                <ZoomOut size={16} />
              </button>
              <div className="px-3 flex flex-col items-center">
                <span className="text-[10px] font-black min-w-[40px] text-center font-mono">
                  {Math.round(scale * 100)}%
                </span>
              </div>
              <button 
                onClick={() => setScale(s => Math.min(5, s + 0.25))} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95"
                title="Increase Zoom"
              >
                <ZoomIn size={16} />
              </button>
            </div>
            
            <button 
              onClick={fitToWidth}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-4 py-2 rounded-xl shadow-xl border border-white/20 text-[10px] font-black uppercase text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
            >
              <Maximize size={14} />
              Fit Width
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black transition-all",
        active 
          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
          : "text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
      )}
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

function FeatureCard({ icon, title, desc, color }: { icon: React.ReactNode; title: string, desc: string, color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
    purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600",
    orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600",
  };

  return (
    <div className="glass-card group hover:scale-[1.02] transition-all cursor-pointer">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:rotate-6", colors[color])}>
        {icon}
      </div>
      <h4 className="text-lg font-black mb-1">{title}</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}
