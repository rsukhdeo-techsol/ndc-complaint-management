'use client';

import { useState, useRef } from 'react';
import type { Complaint } from '@/types';
import type { AttachmentsSectionProps } from './types';
import { formatDate, formatFileSize } from '@/lib/utils';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { Paperclip, Upload, Play } from 'lucide-react';

interface AttachmentsSectionWithLightboxProps extends AttachmentsSectionProps {
  onOpenVideoPlayer: (url: string) => void;
}

export function AttachmentsSection({
  complaint,
  onUpload,
  isUploading,
  uploadProgress,
  onOpenVideoPlayer,
}: AttachmentsSectionWithLightboxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    onUpload(e.dataTransfer.files);
  };

  return (
    <div className="px-6 pb-6">
      <h3 className="text-sm font-medium mb-3">
        Attachments
        {complaint.attachments && complaint.attachments.length > 0 && (
          <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs">
            {complaint.attachments.length}
          </span>
        )}
      </h3>
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        onChange={(e) => onUpload(e.target.files)}
      />
      
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`mb-4 border-2 border-dashed rounded-lg p-4 text-center text-sm transition-colors ${
          isUploading 
            ? 'border-border/50 bg-muted/30 cursor-default'
            : isDragging 
              ? 'border-primary bg-primary/5 text-primary cursor-pointer' 
              : 'border-border/50 text-muted-foreground hover:border-primary/50 hover:bg-muted/50 cursor-pointer'
        }`}
      >
        {Object.keys(uploadProgress).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(uploadProgress).map(([key, { name, progress, size }]) => (
              <div key={key} className="text-left">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium truncate max-w-[200px]">{name}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {progress < 100 ? `${Math.round(progress)}%` : 'Processing...'}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {formatFileSize(size)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <Upload className="h-4 w-4" />
            <span>Drop files here or <span className="text-primary underline">browse</span></span>
          </div>
        )}
      </div>

      {complaint.attachments && complaint.attachments.length > 0 && (
        <>
          {/* Media grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {complaint.attachments.map((attachment, idx) => {
              const isImage = attachment.fileType.startsWith('image/');
              const isVideo = attachment.fileType.startsWith('video/');
              
              // Calculate the index for lightbox (only image files)
              const imageIndex = complaint.attachments!
                .slice(0, idx)
                .filter(a => a.fileType.startsWith('image/'))
                .length;
              
              return (
                <div key={idx} className="group">
                  {isImage ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex(imageIndex);
                        setLightboxOpen(true);
                      }}
                      className="w-full aspect-square rounded-lg overflow-hidden bg-muted border hover:border-primary transition-colors cursor-pointer"
                    >
                      <img
                        src={attachment.fileUrl}
                        alt={attachment.fileName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </button>
                  ) : isVideo ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenVideoPlayer(attachment.fileUrl);
                      }}
                      className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted border hover:border-primary transition-colors cursor-pointer"
                    >
                      <video
                        src={attachment.fileUrl}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                      />
                      {/* Play button overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/90 group-hover:bg-white transition-colors">
                          <Play className="h-6 w-6 text-gray-800 ml-1" />
                        </div>
                      </div>
                    </button>
                  ) : (
                    <a
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-full aspect-square rounded-lg overflow-hidden bg-muted border flex items-center justify-center hover:border-primary transition-colors"
                    >
                      <Paperclip className="h-8 w-8 text-muted-foreground" />
                    </a>
                  )}
                  <div className="mt-2">
                    <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(complaint.createdAt.toDate())}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lightbox for images only */}
          <Lightbox
            open={lightboxOpen}
            close={() => setLightboxOpen(false)}
            index={lightboxIndex}
            slides={complaint.attachments
              .filter(a => a.fileType.startsWith('image/'))
              .map(a => ({ src: a.fileUrl, alt: a.fileName }))}
          />
        </>
      )}
    </div>
  );
}
