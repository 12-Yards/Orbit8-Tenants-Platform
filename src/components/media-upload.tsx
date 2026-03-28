"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileAudio, FileVideo, File, Loader2 } from "lucide-react";
import api from "@/lib/api";

interface MediaUploadProps {
  value: string;
  onChange: (url: string) => void;
  testId?: string;
  accept?: string;
}

function getFileType(url: string): "audio" | "video" | "other" {
  const lower = url.toLowerCase();
  if (/\.(mp3|wav|ogg|aac|m4a|flac|wma)/.test(lower)) return "audio";
  if (/\.(mp4|webm|ogv|mov|avi|mkv)/.test(lower)) return "video";
  return "other";
}

export function MediaUpload({ value, onChange, testId, accept }: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setFileName(file.name);

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
      setError("Failed to upload file");
      console.error(err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const fileType = value ? getFileType(value) : null;

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept || "*/*"}
        onChange={handleFileSelect}
        className="hidden"
        data-testid={testId ? `${testId}-input` : undefined}
      />

      {isUploading ? (
        <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-md bg-muted/30">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
          <p className="text-sm font-medium text-foreground">Uploading {fileName || "file"}...</p>
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
          <div className="border rounded-md p-3">
            {fileType === "audio" ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileAudio className="h-5 w-5 shrink-0" />
                  <span className="truncate">{fileName || value.split("/").pop()}</span>
                </div>
                <audio controls className="w-full" data-testid={testId ? `${testId}-player` : undefined}>
                  <source src={value} />
                </audio>
              </div>
            ) : fileType === "video" ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileVideo className="h-5 w-5 shrink-0" />
                  <span className="truncate">{fileName || value.split("/").pop()}</span>
                </div>
                <video controls className="w-full rounded" data-testid={testId ? `${testId}-player` : undefined}>
                  <source src={value} />
                </video>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <File className="h-5 w-5 shrink-0" />
                <span className="truncate">{fileName || value.split("/").pop()}</span>
              </div>
            )}
          </div>
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
            className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-md cursor-pointer hover-elevate"
            onClick={() => fileInputRef.current?.click()}
            data-testid={testId ? `${testId}-dropzone` : undefined}
          >
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Click to upload file</p>
            <p className="text-xs text-muted-foreground mt-1">Audio, video, or any file type</p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Or paste file URL"
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
