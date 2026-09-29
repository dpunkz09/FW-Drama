import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Heart, Info, Share2, Loader } from 'lucide-react';
import Hls from 'hls.js';
import { useSaveProgress } from '../hooks/useWatchProgress';
import api from '../api/client';
import type { SeriesDetailResponse } from '../types';

const SWIPE_THRESHOLD = 55;
const SLIDE_DURATION = 380; // ms
type SlideDir = 'up' | 'down' | null;

const Watch = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const saveProgress = useSaveProgress();

  // Starting episode from query param
  const startEp = Math.max(0, parseInt(searchParams.get('ep') ?? '0', 10) || 0);

  const [seriesData, setSeriesData] = useState<SeriesDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalEpisodes, setTotalEpisodes] = useState(100); // Default, will update from API

  // Current / staging episode indices
  const [current, setCurrent] = useState(startEp);
  const [staging, setStaging] = useState<number | null>(null);

  // Animation state
  const [slideDir, setSlideDir] = useState<SlideDir>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragY, setDragY] = useState(0);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // UI state
  const [showControls, setShowControls] = useState(true);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const currentVideoRef = useRef<HTMLVideoElement>(null);
  const stagingVideoRef = useRef<HTMLVideoElement>(null);
  const currentHlsRef = useRef<Hls | null>(null);
  const stagingHlsRef = useRef<Hls | null>(null);
  const controlsTimerRef = useRef<NodeJS.Timeout>();
  const progressBarRef = useRef<HTMLDivElement>(null);
  const isDraggingSeek = useRef(false);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const isSwiping = useRef(false);

  // Fetch series data
  useEffect(() => {
    if (!id) return;
    
    setLoading(true);
    api.get<SeriesDetailResponse>(`/api/v1/series/${id}`)
      .then(response => {
        setSeriesData(response.data);
        // For now, assume 100 episodes max (we don't have episode count in API)
        // You can adjust this based on actual data or create a separate endpoint check
        setTotalEpisodes(100);
        
        // Save initial progress
        saveProgress({
          book_id: id,
          title: response.data.series.name,
          pic: response.data.thumbnail,
          chapter: startEp,
          total: 100,
        });
      })
      .catch(e => console.error('Watch: Failed to fetch series data:', e))
      .finally(() => setLoading(false));
  }, [id, startEp, saveProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(controlsTimerRef.current);
      currentHlsRef.current?.destroy();
      stagingHlsRef.current?.destroy();
    };
  }, []);

  // Controls timer
  const resetControlsTimer = useCallback(() => {
    clearTimeout(controlsTimerRef.current);
    setShowControls(true);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3500);
  }, []);

  // Video URL builder: https://dirjqbe1kaah2.cloudfront.net/{id}/{episode}/video.m3u8
  const getVideoUrl = (episodeIndex: number) => {
    return `https://dirjqbe1kaah2.cloudfront.net/${id}/${episodeIndex + 1}/video.m3u8`;
  };

  // Setup HLS player for a video element
  const setupHls = (videoEl: HTMLVideoElement, url: string, hlsRef: React.MutableRefObject<Hls | null>, onReady: () => void) => {
    // Cleanup existing HLS instance
    hlsRef.current?.destroy();
    hlsRef.current = null;
    videoEl.pause();
    videoEl.removeAttribute('src');

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        maxBufferLength: 30,
        maxBufferHole: 0.5,
        debug: false,
      });
      
      hls.loadSource(url);
      hls.attachMedia(videoEl);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        onReady();
        videoEl.play().catch(() => {});
      });
      
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
        else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
        else {
          console.error('Fatal HLS error:', data);
        }
      });
      
      hlsRef.current = hls;
    } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      videoEl.src = url;
      videoEl.addEventListener('loadedmetadata', () => {
        onReady();
        videoEl.play().catch(() => {});
      }, { once: true });
    }
  };

  // Setup current video when episode changes
  useEffect(() => {
    if (!currentVideoRef.current || !seriesData) return;
    
    const url = getVideoUrl(current);
    setupHls(currentVideoRef.current, url, currentHlsRef, () => {
      setBuffering(false);
      resetControlsTimer();
    });
  }, [current, seriesData, resetControlsTimer]);

  // Setup staging video when transitioning
  useEffect(() => {
    if (staging === null || !stagingVideoRef.current || !seriesData) return;
    
    const url = getVideoUrl(staging);
    setupHls(stagingVideoRef.current, url, stagingHlsRef, () => {});
  }, [staging, seriesData]);

  // Slide to episode
  const slideTo = (targetIdx: number, dir: SlideDir) => {
    if (isAnimating) return;
    if (targetIdx < 0 || targetIdx >= totalEpisodes) return;

    setStaging(targetIdx);
    setSlideDir(dir);
    setIsAnimating(true);
    setDragY(0);
    clearTimeout(controlsTimerRef.current);
    setShowControls(true);

    setTimeout(() => {
      setCurrent(targetIdx);
      setStaging(null);
      setSlideDir(null);
      setIsAnimating(false);
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);

      // Save progress
      if (seriesData) {
        saveProgress({
          book_id: id!,
          title: seriesData.series.name,
          pic: seriesData.thumbnail,
          chapter: targetIdx,
          total: totalEpisodes,
        });
      }

      clearTimeout(controlsTimerRef.current);
      setShowControls(true);
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 3500);
    }, SLIDE_DURATION);
  };

  const goNext = () => slideTo(current + 1, 'up');
  const goPrev = () => slideTo(current - 1, 'down');

  // Touch gestures
  const onTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('[data-nswipe]')) return;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    isSwiping.current = false;
    setDragY(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('[data-nswipe]')) return;
    if (isAnimating) return;
    const dy = touchStartY.current - e.touches[0].clientY;
    if (Math.abs(dy) > 8) {
      isSwiping.current = true;
      setDragY(dy);
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('[data-nswipe]')) return;
    if (isAnimating) { setDragY(0); return; }

    const dy = touchStartY.current - e.changedTouches[0].clientY;
    const dt = Date.now() - touchStartTime.current;
    const isFlick = Math.abs(dy) > 30 && dt < 280;

    if (Math.abs(dy) >= SWIPE_THRESHOLD || isFlick) {
      if (dy > 0 && current < totalEpisodes - 1) goNext();
      else if (dy < 0 && current > 0) goPrev();
      else setDragY(0);
    } else {
      setDragY(0);
    }

    setTimeout(() => { isSwiping.current = false; }, 50);
  };

  // Player controls
  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = currentVideoRef.current;
    if (!v) return;
    isPlaying ? v.pause() : v.play();
    resetControlsTimer();
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(m => !m);
    resetControlsTimer();
  };

  const handleScreenTap = () => {
    if (isSwiping.current || isAnimating) return;
    if (showControls) { clearTimeout(controlsTimerRef.current); setShowControls(false); }
    else resetControlsTimer();
  };

  // Seek bar
  const calcPos = (clientX: number) => {
    if (!progressBarRef.current) return 0;
    const r = progressBarRef.current.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  };

  const applySeek = (pos: number) => {
    const v = currentVideoRef.current;
    if (!v || !v.duration) return;
    const t = pos * v.duration;
    v.currentTime = t;
    setCurrentTime(t);
    setProgress(pos * 100);
  };

  const onSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    applySeek(calcPos(e.clientX));
    resetControlsTimer();
  };

  const onSeekTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    isDraggingSeek.current = true;
    setProgress(calcPos(e.touches[0].clientX) * 100);
  };

  const onSeekTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    applySeek(calcPos(e.changedTouches[0].clientX));
    isDraggingSeek.current = false;
    resetControlsTimer();
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  };

  // Video event handlers
  const onTimeUpdate = () => {
    const v = currentVideoRef.current;
    if (!v || isDraggingSeek.current) return;
    if (v.duration && !isNaN(v.duration)) {
      setCurrentTime(v.currentTime);
      setDuration(v.duration);
      setProgress((v.currentTime / v.duration) * 100);
    }
  };

  // Drag calculations
  const clampedDrag = Math.max(-300, Math.min(300, dragY));
  const currentTranslate = isAnimating 
    ? (slideDir === 'up' ? '-100%' : '100%')
    : `${-clampedDrag * 0.45}px`;
  
  const stagingTranslate = (() => {
    if (!isAnimating) {
      if (dragY > 20) return `calc(100% - ${clampedDrag * 0.45}px)`;
      if (dragY < -20) return `calc(-100% - ${clampedDrag * 0.45}px)`;
      return slideDir === 'up' ? '100%' : '-100%';
    }
    return '0%';
  })();

  const transition = isAnimating ? `transform ${SLIDE_DURATION}ms cubic-bezier(0.32, 0.72, 0, 1)` : 'none';

  const canGoNext = current < totalEpisodes - 1;
  const canGoPrev = current > 0;

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 text-red-500 animate-spin" />
          <p className="text-white text-sm">Loading drama...</p>
        </div>
      </div>
    );
  }

  if (!seriesData) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-400">Drama not found</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-red-600 rounded-lg text-white text-sm">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black select-none overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* CURRENT VIDEO */}
      <div className="absolute inset-0" style={{ transform: `translateY(${currentTranslate})`, transition }}>
        <video
          ref={currentVideoRef}
          className="absolute inset-0 w-full h-full object-contain bg-black"
          poster={seriesData.thumbnail}
          playsInline
          muted={isMuted}
          onTimeUpdate={onTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onWaiting={() => setBuffering(true)}
          onCanPlay={() => setBuffering(false)}
          onEnded={canGoNext ? goNext : undefined}
        />
      </div>

      {/* STAGING VIDEO */}
      {staging !== null && (
        <div className="absolute inset-0" style={{ transform: `translateY(${stagingTranslate})`, transition }}>
          <video
            ref={stagingVideoRef}
            className="absolute inset-0 w-full h-full object-contain bg-black"
            poster={seriesData.thumbnail}
            playsInline
            muted={isMuted}
          />
        </div>
      )}

      {/* BUFFERING SPINNER */}
      {buffering && !isAnimating && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-red-500 animate-spin" />
        </div>
      )}

      {/* SWIPE HINTS */}
      {canGoNext && dragY > 20 && !isAnimating && (
        <div className="absolute bottom-24 left-0 right-0 z-30 flex flex-col items-center pointer-events-none">
          <div className="flex flex-col items-center gap-1 transition-opacity" style={{ opacity: Math.min(1, (dragY - 20) / 60) }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 5l7 7H5l7-7z" fill="white" opacity="0.6" />
              <path d="M12 11l7 7H5l7-7z" fill="white" opacity="0.3" />
            </svg>
            <p className="text-white/80 text-xs font-semibold">EP {current + 2}</p>
          </div>
        </div>
      )}

      {canGoPrev && dragY < -20 && !isAnimating && (
        <div className="absolute top-24 left-0 right-0 z-30 flex flex-col items-center pointer-events-none">
          <div className="flex flex-col items-center gap-1 transition-opacity" style={{ opacity: Math.min(1, (-dragY - 20) / 60) }}>
            <p className="text-white/80 text-xs font-semibold">EP {current}</p>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 19l7-7H5l7 7z" fill="white" opacity="0.6" />
              <path d="M12 13l7-7H5l7 7z" fill="white" opacity="0.3" />
            </svg>
          </div>
        </div>
      )}

      {/* CONTROLS OVERLAY */}
      <div className="absolute inset-0 z-20" onClick={handleScreenTap}>
        {/* TOP BAR */}
        <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="flex items-center gap-3 px-4 pt-12 pb-6">
            <button data-nswipe onClick={(e) => { e.stopPropagation(); navigate('/'); }} className="w-9 h-9 flex items-center justify-center shrink-0">
              <ArrowLeft size={22} className="text-white drop-shadow" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate drop-shadow">{seriesData.series.name}</p>
              <p className="text-white/60 text-xs mt-0.5">EP {current + 1}</p>
            </div>
            <button data-nswipe onClick={(e) => { e.stopPropagation(); setShowEpisodes(true); }} className="px-4 py-1.5 bg-red-500 rounded-full text-white text-xs font-bold shrink-0 shadow-lg shadow-red-500/30">
              List
            </button>
          </div>
        </div>

        {/* CENTER PAUSE ICON */}
        {!isPlaying && !buffering && showControls && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Play size={36} fill="white" className="text-white ml-1" />
            </div>
          </div>
        )}

        {/* RIGHT SIDE ACTIONS */}
        <div className={`absolute right-4 bottom-36 flex flex-col items-center gap-5 transition-all duration-300 ${showControls ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
          <button data-nswipe onClick={(e) => { e.stopPropagation(); setIsLiked(l => !l); resetControlsTimer(); }} className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${isLiked ? 'bg-red-500' : 'bg-black/50'}`}>
            <Heart size={22} fill={isLiked ? 'white' : 'none'} className="text-white" />
          </button>
          <button data-nswipe onClick={(e) => { e.stopPropagation(); setShowInfo(true); resetControlsTimer(); }} className="w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center">
            <Info size={22} className="text-white" />
          </button>
          <button data-nswipe onClick={(e) => { e.stopPropagation(); resetControlsTimer(); }} className="w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center">
            <Share2 size={20} className="text-white" />
          </button>
        </div>

        {/* BOTTOM CONTROLS */}
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
          <div className="px-4 pt-6 pb-8 space-y-2">
            {/* Seek bar */}
            <div data-nswipe ref={progressBarRef} className="relative w-full h-8 flex items-center cursor-pointer" onClick={onSeekClick} onTouchMove={onSeekTouchMove} onTouchEnd={onSeekTouchEnd}>
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] bg-white/20 rounded-full">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md" style={{ left: `calc(${progress}% - 8px)` }} />
            </div>
            {/* Time */}
            <div className="flex justify-between text-[11px] text-white/60 -mt-1 px-0.5">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            {/* Buttons */}
            <div className="flex items-center justify-between pt-1" data-nswipe>
              <div className="flex items-center gap-3">
                <button onClick={togglePlay} className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-transform">
                  {isPlaying ? <Pause size={20} fill="white" className="text-white" /> : <Play size={20} fill="white" className="text-white ml-0.5" />}
                </button>
                <span className="text-white/60 text-xs font-semibold">EP {current + 1}</span>
              </div>
              <button onClick={toggleMute} className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-transform">
                {isMuted ? <VolumeX size={18} className="text-white" /> : <Volume2 size={18} className="text-white" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* EPISODE LIST SHEET */}
      {showEpisodes && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fadeIn" onClick={() => setShowEpisodes(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl max-h-[78vh] overflow-hidden animate-slideUp" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div>
                <p className="text-white font-bold text-base">Episodes</p>
                <p className="text-zinc-400 text-xs mt-0.5">EP {current + 1} playing</p>
              </div>
              <button onClick={() => setShowEpisodes(false)} className="w-9 h-9 bg-white/5 rounded-full flex items-center justify-center text-white text-xl">×</button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(78vh-72px)] scrollbar-hide">
              <div className="grid grid-cols-5 gap-2.5">
                {Array.from({ length: totalEpisodes }, (_, idx) => (
                  <button key={idx} onClick={() => { slideTo(idx, idx > current ? 'up' : 'down'); setShowEpisodes(false); }} className={`aspect-square rounded-xl text-sm font-bold transition-all ${current === idx ? 'bg-red-500 text-white scale-105 shadow-lg shadow-red-500/30' : 'bg-white/5 text-zinc-300 active:scale-95'}`}>
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INFO SHEET */}
      {showInfo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fadeIn" onClick={() => setShowInfo(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl max-h-[80vh] overflow-hidden animate-slideUp" onClick={e => e.stopPropagation()}>
            <div className="relative h-44 overflow-hidden">
              <img src={seriesData.thumbnail} alt={seriesData.series.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
              <button onClick={() => setShowInfo(false)} className="absolute top-3 right-3 w-9 h-9 bg-black/40 rounded-full flex items-center justify-center text-white text-xl">×</button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[calc(80vh-176px)] scrollbar-hide space-y-4">
              <div>
                <h2 className="text-white font-bold text-xl">{seriesData.series.name}</h2>
                <p className="text-zinc-400 text-xs mt-1">EP {current + 1}</p>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-white font-bold text-lg">{(seriesData.series.views / 1_000_000).toFixed(1)}M</p>
                  <p className="text-zinc-400 text-xs">Views</p>
                </div>
                <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-white font-bold text-lg">{(seriesData.series.stars / 1_000).toFixed(1)}K</p>
                  <p className="text-zinc-400 text-xs">Stars</p>
                </div>
              </div>
              {seriesData.series.categories && seriesData.series.categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {seriesData.series.categories.map((cat, i) => (
                    <span key={i} className="text-xs px-3 py-1 rounded-full border border-red-500/30 text-red-400 bg-red-500/10">{cat}</span>
                  ))}
                </div>
              )}
              {seriesData.series.description && <p className="text-zinc-300 text-sm leading-relaxed">{seriesData.series.description}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Watch;
