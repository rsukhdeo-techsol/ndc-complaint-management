'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { VideoPlayerModalProps } from './types';
import { X } from 'lucide-react';

// Dynamically import Plyr to avoid SSR issues
const Plyr = dynamic(() => import('plyr-react').then(mod => mod.Plyr), { 
  ssr: false,
  loading: () => (
    <div className="aspect-video bg-black/50 flex items-center justify-center">
      <span className="text-white">Loading player...</span>
    </div>
  )
});

export function VideoPlayerModal({ open, videoUrl, onClose }: VideoPlayerModalProps) {
  // Load plyr CSS on client side only
  useEffect(() => {
    if (open) {
      // @ts-expect-error - CSS module import for styling
      import('plyr/dist/plyr.css');
    }
  }, [open]);

  if (!open || !videoUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-8"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white transition-colors z-10 cursor-pointer"
        >
          <X className="h-6 w-6" />
        </button>
        
        {/* Video Player */}
        <div className="relative bg-black rounded-lg overflow-hidden" style={{ maxHeight: '70vh' }}>
          <Plyr
            source={{
              type: 'video',
              sources: [{ src: videoUrl, type: 'video/mp4' }],
            }}
            options={{
              autoplay: true,
              controls: [
                'play-large',
                'play',
                'progress',
                'current-time',
                'duration',
                'mute',
                'volume',
                'settings',
                'pip',
                'fullscreen',
              ],
              settings: ['speed'],
              speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
              ratio: '16:9',
            }}
          />
        </div>
      </div>
    </div>
  );
}
