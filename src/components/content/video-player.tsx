'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward
} from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  subtitleUrl?: string;
  onProgress?: (progress: number, duration: number) => void;
  onDurationKnown?: (duration: number) => void;
  initialProgress?: number;
  autoPlay?: boolean;
}

function isYouTube(src: string) {
  return src.includes('youtube.com') || src.includes('youtu.be');
}

function getYouTubeId(src: string) {
  const match = src.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/
  );
  return match ? match[1] : null;
}

export function VideoPlayer({
  src, poster, title, subtitleUrl, onProgress, onDurationKnown, initialProgress, autoPlay
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<NodeJS.Timeout>();

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const [error, setError] = useState('');

  const isYT = isYouTube(src);
  const ytId = isYT ? getYouTubeId(src) : null;
  const isHLS = src.includes('.m3u8');

  useEffect(() => {
    if (isYT || !src) return;
    const video = videoRef.current;
    if (!video) return;

    setError('');

    if (isHLS) {
      import('hls.js').then(({ default: Hls }) => {
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (initialProgress) video.currentTime = initialProgress;
            if (autoPlay) video.play().catch(() => {});
          });
          hls.on(Hls.Events.ERROR, (_e, data) => {
            if (data.fatal) setError('Failed to load video stream');
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
          if (autoPlay) video.play().catch(() => {});
        } else {
          setError('HLS not supported in this browser');
        }
      });
    } else {
      // Direct MP4/WebM
      video.src = src;
      video.load();
      if (initialProgress) video.currentTime = initialProgress;
      if (autoPlay) {
        video.play().catch(() => {
          // autoplay blocked — user needs to press play
        });
      }
    }

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [src]);

  useEffect(() => {
    if (playing && onProgress) {
      progressInterval.current = setInterval(() => {
        const v = videoRef.current;
        if (v && !isNaN(v.duration)) onProgress(v.currentTime, v.duration);
      }, 10000);
    }
    return () => { if (progressInterval.current) clearInterval(progressInterval.current); };
  }, [playing, onProgress]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const resetTimer = () => {
      setShowControls(true);
      clearTimeout(timer);
      if (playing) timer = setTimeout(() => setShowControls(false), 3000);
    };
    const container = containerRef.current;
    container?.addEventListener('mousemove', resetTimer);
    container?.addEventListener('touchstart', resetTimer);
    setShowControls(true);
    return () => {
      container?.removeEventListener('mousemove', resetTimer);
      container?.removeEventListener('touchstart', resetTimer);
      clearTimeout(timer);
    };
  }, [playing]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) { video.play(); }
    else { video.pause(); }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setFullscreen(false);
    } else {
      containerRef.current.requestFullscreen();
      setFullscreen(true);
    }
  };

  const seek = (seconds: number) => {
    const video = videoRef.current;
    if (video) video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return h > 0
      ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
      : `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // No source
  if (!src) {
    return (
      <div className="flex aspect-video w-full items-center justify-center bg-dark-900">
        <div className="text-center">
          <Play className="mx-auto mb-2 h-16 w-16 text-dark-600" />
          <p className="text-dark-400">No video available for this title</p>
        </div>
      </div>
    );
  }

  // YouTube embed
  if (isYT && ytId) {
    return (
      <div ref={containerRef} className="relative aspect-video w-full bg-black">
        {title && (
          <div className="absolute left-4 top-4 z-10 text-lg font-bold drop-shadow-lg bg-black/40 px-3 py-1 rounded">
            {title}
          </div>
        )}
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?autoplay=${autoPlay ? 1 : 0}&rel=0&modestbranding=1`}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  // Native video (MP4, WebM, HLS)
  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full bg-black cursor-pointer"
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        poster={poster}
        className="h-full w-full"
        playsInline
        onTimeUpdate={() => {
          const v = videoRef.current;
          if (v) {
            setCurrentTime(v.currentTime);
            if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1));
          }
        }}
        onLoadedMetadata={() => {
          const v = videoRef.current;
          if (v) {
            setDuration(v.duration);
            if (onDurationKnown && v.duration > 0) onDurationKnown(v.duration);
          }
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          const v = videoRef.current;
          if (v && onProgress) onProgress(v.duration, v.duration);
        }}
        onError={() => setError('Failed to load video. Check the URL or file format.')}
      >
        {subtitleUrl && (
          <track kind="subtitles" src={subtitleUrl} srcLang="en" label="English" default />
        )}
      </video>

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center p-6">
            <p className="text-red-400 font-medium">{error}</p>
            <p className="mt-2 text-sm text-dark-400">Try refreshing or check the video URL</p>
          </div>
        </div>
      )}

      {/* Centre play button when paused */}
      {!playing && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-white/20 p-5 backdrop-blur-sm transition-transform hover:scale-110">
            <Play className="h-12 w-12 text-white" fill="white" />
          </div>
        </div>
      )}

      {/* Controls */}
      <div
        className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-transparent to-black/20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="absolute left-4 top-4 text-lg font-bold drop-shadow-lg">{title}</div>
        )}

        <div className="px-4 pb-4 space-y-2">
          {/* Progress bar */}
          <div className="relative h-1.5 w-full rounded-full bg-dark-600 cursor-pointer">
            <div
              className="absolute h-full rounded-full bg-dark-400"
              style={{ width: `${duration ? (buffered / duration) * 100 : 0}%` }}
            />
            <div
              className="absolute h-full rounded-full bg-primary-500"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={(e) => {
                const v = videoRef.current;
                if (v) v.currentTime = parseFloat(e.target.value);
              }}
              className="absolute inset-0 w-full cursor-pointer opacity-0 h-full"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={togglePlay} className="hover:text-primary-400 transition-colors">
                {playing
                  ? <Pause className="h-6 w-6" />
                  : <Play className="h-6 w-6" fill="white" />
                }
              </button>
              <button onClick={() => seek(-10)} className="hover:text-primary-400 transition-colors">
                <SkipBack className="h-5 w-5" />
              </button>
              <button onClick={() => seek(10)} className="hover:text-primary-400 transition-colors">
                <SkipForward className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  setMuted(!muted);
                  if (videoRef.current) videoRef.current.muted = !muted;
                }}
                className="hover:text-primary-400 transition-colors"
              >
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <span className="text-xs text-dark-300 tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <button onClick={toggleFullscreen} className="hover:text-primary-400 transition-colors">
              {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
