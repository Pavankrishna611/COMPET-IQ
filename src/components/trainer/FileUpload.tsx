'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle2, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export interface UploadedFileInfo {
  name: string;
  sizeFormatted: string;
  type: string;
}

interface FileUploadProps {
  file: UploadedFileInfo | null;
  onFileSelect: (file: UploadedFileInfo) => void;
  onFileRemove: () => void;
}

export function FileUpload({ file, onFileSelect, onFileRemove }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const sizeMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
      onFileSelect({
        name: selectedFile.name,
        sizeFormatted: `${sizeMB} MB`,
        type: selectedFile.type || selectedFile.name.split('.').pop()?.toUpperCase() || 'DOCUMENT',
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const sizeMB = (droppedFile.size / (1024 * 1024)).toFixed(2);
      onFileSelect({
        name: droppedFile.name,
        sizeFormatted: `${sizeMB} MB`,
        type: droppedFile.type || droppedFile.name.split('.').pop()?.toUpperCase() || 'DOCUMENT',
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  // Provide quick default preset for convenience
  const handleLoadSample = () => {
    onFileSelect({
      name: 'MoSPI_National_Accounts_Python_Analytics_Manual_2026.pdf',
      sizeFormatted: '4.82 MB',
      type: 'PDF Document',
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5 text-primary" />
          Upload Learning Material
        </label>
        {!file && (
          <button
            type="button"
            onClick={handleLoadSample}
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            Use sample curriculum document
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.ppt,.pptx,.doc,.docx,.txt"
        onChange={handleFileChange}
        className="hidden"
      />

      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer select-none ${
            isDragOver
              ? 'border-primary bg-primary-light/40 ring-2 ring-primary/30'
              : 'border-border hover:border-primary/40 bg-surface-elevated/40 hover:bg-surface-elevated'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-primary-light text-primary flex items-center justify-center mx-auto mb-3 shadow-xs">
            <FileUp className="w-6 h-6" />
          </div>

          <h4 className="text-sm font-bold text-text-primary mb-1">
            Drag and drop learning material here, or browse files
          </h4>

          <p className="text-xs text-text-muted mb-3">
            Supported formats: PDF, PPT / PPTX, DOC / DOCX, TXT (Maximum file size: 25MB)
          </p>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="text-xs font-semibold pointer-events-none"
          >
            Select Document From Computer
          </Button>
        </div>
      ) : (
        /* File Preview Card */
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-text-primary truncate">
                {file.name}
              </h4>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-muted mt-0.5">
                <span>{file.type}</span>
                <span>•</span>
                <span>{file.sizeFormatted}</span>
                <span>•</span>
                <Badge variant="success" size="sm" className="gap-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Ready for Analysis
                </Badge>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onFileRemove}
            className="p-1.5 rounded-lg border border-border-light text-text-muted hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
            title="Remove document"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
