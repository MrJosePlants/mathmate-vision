import { useCallback, useState } from "react";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  onImageSelect: (imageData: string) => void;
  isLoading: boolean;
}

export const ImageUpload = ({ onImageSelect, isLoading }: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      onImageSelect(result);
    };
    reader.readAsDataURL(file);
  }, [onImageSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const clearPreview = useCallback(() => {
    setPreview(null);
  }, []);

  return (
    <div className="w-full">
      {preview ? (
        <div className="relative glass rounded-xl p-4 animate-fade-in">
          <button
            onClick={clearPreview}
            className="absolute top-2 right-2 p-2 rounded-full bg-background/80 hover:bg-background transition-colors z-10"
            disabled={isLoading}
          >
            <X className="w-4 h-4" />
          </button>
          <img
            src={preview}
            alt="Math problem preview"
            className="w-full h-auto max-h-80 object-contain rounded-lg"
          />
        </div>
      ) : (
        <label
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            flex flex-col items-center justify-center w-full h-64 
            glass rounded-xl cursor-pointer transition-all duration-300
            hover:border-primary/50 hover:shadow-glow
            ${isDragging ? 'border-primary shadow-glow scale-[1.02]' : ''}
          `}
        >
          <div className="flex flex-col items-center gap-4 p-8">
            <div className="p-4 rounded-full bg-primary/10">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-display text-lg text-foreground">
                Drop your math problem here
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to upload an image
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ImageIcon className="w-4 h-4" />
              <span>PNG, JPG, WEBP supported</span>
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
            disabled={isLoading}
          />
        </label>
      )}
    </div>
  );
};
