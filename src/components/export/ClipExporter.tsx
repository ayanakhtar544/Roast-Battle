'use client';

import { motion } from 'motion/react';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';

interface ClipExporterProps {
  clipBlob: Blob | null;
  onDownload: () => void;
  onClose: () => void;
}

export function ClipExporter({ clipBlob, onDownload, onClose }: ClipExporterProps) {
  if (!clipBlob) return null;

  const clipUrl = URL.createObjectURL(clipBlob);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full"
      >
        <GlassCard className="relative overflow-hidden border border-arena-yellow/30 p-6 flex flex-col items-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-arena-yellow/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <h2 className="text-arena-yellow font-black text-2xl uppercase mb-2 tracking-wider flex items-center gap-2">
            <span>📹</span> VIRAL CLIP READY
          </h2>
          <p className="text-zinc-400 text-xs text-center mb-6 leading-relaxed">
            Your battle clip is compressed in a 9:16 vertical layout — ready for TikTok, Instagram Reels, and YouTube Shorts.
          </p>

          {/* Clip Video Preview */}
          <div className="w-[240px] h-[426px] bg-black rounded-2xl overflow-hidden border border-zinc-800 shadow-[0_0_30px_rgba(250,204,21,0.15)] mb-6 flex justify-center items-center">
            <video
              src={clipUrl}
              controls
              playsInline
              className="w-full h-full object-cover"
            />
          </div>

          {/* Download & Close Buttons */}
          <div className="w-full flex flex-col gap-3">
            <NeonButton
              variant="fire"
              size="lg"
              className="w-full font-black uppercase text-sm tracking-widest shadow-[0_0_20px_rgba(250,204,21,0.3)]"
              onClick={onDownload}
            >
              DOWNLOAD COMBAT CLIP ⚡
            </NeonButton>
            <button
              onClick={() => {
                URL.revokeObjectURL(clipUrl);
                onClose();
              }}
              className="w-full py-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
            >
              CLOSE
            </button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
