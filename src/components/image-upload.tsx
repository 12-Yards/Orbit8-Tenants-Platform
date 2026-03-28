"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import api from "@/lib/api";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  testId?: string;
}

export function ImageUpload({ value, onChange, testId }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("/api/uploads/file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });
      const { url } = response.data;
      onChange(url);
    } catch (err) {
      setError("Failed to upload image");
      console.error(err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        data-testid={testId ? `${testId}-input` : undefined}
      />
      
      {isUploading ? (
        <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-md bg-muted/30">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
          <p className="text-sm font-medium text-foreground">Uploading image...</p>
          <div className="w-48 mt-2 bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{uploadProgress}%</p>
        </div>
      ) : value ? (
        <div className="space-y-2">
          <img
            src={value}
            alt="Uploaded"
            className="w-full h-40 object-cover rounded-md border"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            data-testid={testId ? `${testId}-upload-btn` : undefined}
          >
            <Upload className="h-4 w-4 mr-1" />
            Replace
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div
            className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-md cursor-pointer hover-elevate"
            onClick={() => fileInputRef.current?.click()}
            data-testid={testId ? `${testId}-dropzone` : undefined}
          >
            <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Click to upload image</p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Or paste image URL"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              data-testid={testId ? `${testId}-url` : undefined}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              data-testid={testId ? `${testId}-upload-btn` : undefined}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
