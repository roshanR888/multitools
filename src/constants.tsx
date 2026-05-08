import { 
  Maximize, 
  Image as ImageIcon, 
  Trash2, 
  Languages, 
  Zap, 
  Crop, 
  Stamp, 
  Pipette, 
  Minimize2,
  QrCode,
  Link,
  FileText
} from 'lucide-react';

export type ToolId = 
  | 'compressor' 
  | 'resizer' 
  | 'bg-remover' 
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
    name: 'Smart Image Compressor',
    description: 'Compress MB to KB with precision slider.',
    icon: Minimize2,
    seoDescription: 'Our smart image compressor helps you reduce image file size without losing quality. Perfect for optimizing web images and saving storage space. Select your target size in KB and our AI-driven logic handles the rest.'
  },
  {
    id: 'resizer',
    name: 'Bulk Image Resizer',
    description: 'Resize for Social Media instantly.',
    icon: Maximize,
    seoDescription: 'Batch resize images for Instagram, YouTube, TikTok, and X. Maintain aspect ratios and save time using our high-performance bulk processing tool.'
  },
  {
    id: 'bg-remover',
    name: 'AI Background Remover',
    description: 'Remove background using AI in seconds.',
    icon: Trash2,
    seoDescription: 'Free AI background removal powered by Puter.js. Simply upload your photo and get a transparent PNG in seconds without any server-side processing.'
  },
  {
    id: 'ocr',
    name: 'Image to Text (OCR)',
    description: 'Extract text from images using AI.',
    icon: Languages,
    seoDescription: 'Convert images to editable text using Tesseract.js. Supports multi-language OCR and instant clipboard copying. Great for digitizing documents and receipts.'
  },
  {
    id: 'webp-converter',
    name: 'Image to WebP Converter',
    description: 'Convert PNG/JPG to SEO-friendly WebP.',
    icon: Zap,
    seoDescription: 'Instantly convert images to WebP format to boost your website SEO performance. WebP provides superior lossless and lossy compression for images on the web.'
  },
  {
    id: 'cropper',
    name: 'Social Media Cropper',
    description: 'Precision cropping with aspect ratio presets.',
    icon: Crop,
    seoDescription: 'Interactive image cropping tool with fixed aspect ratios for popular social platforms. Use Cropper.js for professional-grade results right in your browser.'
  },
  {
    id: 'watermark',
    name: 'Watermark Adder',
    description: 'Protect your photos with custom logos.',
    icon: Stamp,
    seoDescription: 'Add text or image watermarks to your photos. Adjust opacity, sizing, and placement (Tile or Corner) to protect your creative content from unauthorized use.'
  },
  {
    id: 'color-picker',
    name: 'Color Picker from Image',
    description: 'Get HEX/RGB codes from any pixel.',
    icon: Pipette,
    seoDescription: 'Accurately pick colors from any image. Extract HEX and RGB codes with a simple click. Essential tool for designers and developers looking for color inspiration.'
  },
  {
    id: 'qr-generator',
    name: 'QR Code Generator',
    description: 'Create custom QR codes for any URL or text.',
    icon: QrCode,
    seoDescription: 'Generate high-quality QR codes for websites, contact info, or plain text. Customize color and size, and download your QR code as a PNG file for printed or digital use.'
  },
  {
    id: 'image-to-url',
    name: 'Image to URL',
    description: 'Convert images to Base64 or Public Links.',
    icon: Link,
    seoDescription: 'Convert any image to a Data URL (Base64) or a temporary public online link instantly. Perfect for sharing images or embedding them in code. Fast, secure, and easy.'
  },
  {
    id: 'pdf-editor',
    name: 'Online PDF Editor',
    description: 'Edit, sign & annotate PDF files online.',
    icon: FileText,
    seoDescription: 'Edit your PDF files online for free. Fill out forms, add text, images, and shapes. Sign documents, annotate with highlights and strikethroughs. Fast, secure, and browser-based PDF editing.'
  }
];
