import { 
  Scaling, 
  ScanSearch, 
  Wind, 
  Crop, 
  Stamp, 
  Pipette, 
  QrCode,
  CloudUpload,
  FilePenLine,
  Scale,
  MoveDiagonal
} from 'lucide-react';

export type ToolId = 
  | 'compressor' 
  | 'resizer' 
  | 'ocr' 
  | 'webp-converter' 
  | 'cropper' 
  | 'watermark' 
  | 'color-picker' 
  | 'qr-generator'
  | 'image-to-url'
  | 'pdf-editor';

export interface Tool {
  id: ToolId;
  name: string;
  description: string;
  icon: any;
  seoDescription: string;
}

export const TOOLS: Tool[] = [
  {
    id: 'compressor',
    name: 'Precision Compressor',
    description: 'Shrink MB to KB with zero quality loss.',
    icon: Scale,
    seoDescription: 'Professional image compression tool designed to reduce file sizes (MB to KB) specifically for web performance. Maintain visual fidelity while achieving the smallest footprint possible.'
  },
  {
    id: 'resizer',
    name: 'Canvas Resizer',
    description: 'Transform dimensions for any platform.',
    icon: Scaling,
    seoDescription: 'Adapt your images for social media, blogs, or print. Batch resize multiple images simultaneously while preserving aspect ratios and crystal-clear quality.'
  },
  {
    id: 'ocr',
    name: 'Smart OCR Scanner',
    description: 'Turn images into editable text instantly.',
    icon: ScanSearch,
    seoDescription: 'Advanced Optical Character Recognition tool that extracts text from documents, receipts, and screenshots with high accuracy. Supports multiple languages and quick export.'
  },
  {
    id: 'webp-converter',
    name: 'Next-Gen WebP',
    description: 'Modern WebP optimization for SEO.',
    icon: Wind,
    seoDescription: 'Convert traditional JPG and PNG files into high-performance WebP images. Essential for modern web development and improving Google PageSpeed scores.'
  },
  {
    id: 'cropper',
    name: 'Focus Cropper',
    description: 'Frame your shots with surgical precision.',
    icon: Crop,
    seoDescription: 'Professional cropping tool with built-in templates for Instagram, LinkedIn, and more. Precise pixel-perfect framing with interactive boundary handles.'
  },
  {
    id: 'watermark',
    name: 'Brand Protector',
    description: 'Secure your work with custom signatures.',
    icon: Stamp,
    seoDescription: 'Apply non-destructive watermarks, signatures, or branding to your batches of images. Customize opacity and placement to safeguard your digital property.'
  },
  {
    id: 'color-picker',
    name: 'Palette Extractor',
    description: 'Capture exact colors from any pixel.',
    icon: Pipette,
    seoDescription: 'Designer-focused color picking utility. Extract HEX, RGB, and HSL codes from your images to build consistent palettes and design systems.'
  },
  {
    id: 'qr-generator',
    name: 'QR Architect',
    description: 'Build stylish, scan-ready QR codes.',
    icon: QrCode,
    seoDescription: 'Create high-resolution QR codes for URLs, contact info, or encrypted text. Customizable sizes and error correction for perfect scanning every time.'
  },
  {
    id: 'image-to-url',
    name: 'Cloud Uploader',
    description: 'Host images and generate public links.',
    icon: CloudUpload,
    seoDescription: 'Instantly host images and generate secure, shareable public URLs or Base64 strings. Perfect for developers, bloggers, and quick file sharing.'
  },
  {
    id: 'pdf-editor',
    name: 'PDF Master Editor',
    description: 'Edit and sign documents on the fly.',
    icon: FilePenLine,
    seoDescription: 'Complete browser-based PDF utility. Annotate, sign, merge, and edit PDF documents without downloading bulky software. Fast, secure, and free.'
  }
];
