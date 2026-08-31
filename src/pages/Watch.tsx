import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Heart, Info, Share2 } from 'lucide-react';
import Hls from 'hls.js';
import { useLanguage } from '../store/language';
import { useSaveProgress } from '../hooks/useWatchProgress';

interface Episode {
  index: number;
  chapterId: string;
  videoUrl: string;
  streams: Array<{ quality: string; url: string; sourceUrl: string }>;
  isHls: boolean;
  video_pic: string;
  duration: number;
}

interface StreamData {
  ok: boolean;
  bookId: string;
  desc: string;
  pic: string;
  theme: string[];
  title: string;
  views: number;
  totalChapters: number;
  episodes: Episode[];
}

// ─── Single video slot ────────────────────────────────────────────────────────
interface VideoSlotProps {
  url: string;
  isHls: boolean;
  poster: string;
  onReady: () => void;
  onTimeUpdate: (cur: number, dur: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onWaiting: () => void;
  onCanPlay: () => void;
  onEnded: () => void;
  muted: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const VideoSlot = ({
  url, isHls, poster, onReady, onTimeUpdate,
  onPlay, onPause, onWaiting, onCanPlay, onEnded,
  muted, videoRef,
}: VideoSlotProps) => {
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    hlsRef.current?.destroy();
    hlsRef.current = null;
    video.pause();
    video.removeAttribute('src');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        maxBufferLength: 30,
        maxBufferHole: 0.5,
        debug: false,
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        onReady();
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, d) => {
        if (!d.fatal) return;
        if (d.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
        else if (d.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
      });
      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        onReady();
        video.play().catch(() => {});
      }, { once: true });
    }

    return () => { hlsRef.current?.destroy(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, isHls]);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 w-full h-full object-contain bg-black"
      poster={poster}
      playsInline
      muted={muted}
      onTimeUpdate={() => {
        const v = videoRef.current;
        if (v && v.duration && !isNaN(v.duration))
          onTimeUpdate(v.currentTime, v.duration);
      }}
      onLoadedMetadata={() => {
        const v = videoRef.current;
        if (v && v.duration && !isNaN(v.duration))
          onTimeUpdate(0, v.duration);
      }}
      onPlay={onPlay}
      onPause={onPause}
      onWaiting={onWaiting}
      onCanPlay={onCanPlay}
      onEnded={onEnded}
    />
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const SWIPE_THRESHOLD = 55;
const SLIDE_DURATION = 380; // ms

type SlideDir = 'up' | 'down' | null;

const Watch = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lang } = useLanguage();
  const saveProgress = useSaveProgress();

  // Starting episode — read from ?ep=N query param (set by Continue Watching)
  const startEp = Math.max(0, parseInt(searchParams.get('ep') ?? '0', 10) || 0);

  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [loading, setLoading] = useState(true);

  // Current / next indices — initialise from startEp
  const [current, setCurrent] = useState(startEp);
  const [staging, setStaging] = useState<number | null>(null); // episode being slid in

  // Animation state
  const [slideDir, setSlideDir] = useState<SlideDir>(null);   // 'up' | 'down'
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragY, setDragY] = useState(0); // live drag px (positive = dragging up)

  // Player state (belongs to the *current* video)
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
  const controlsTimerRef = useRef<NodeJS.Timeout>();
  const progressBarRef = useRef<HTMLDivElement>(null);
  const isDraggingSeek = useRef(false);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const isSwiping = useRef(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setLoading(true);
    setStreamData(null);

    fetch(`/api/stream/all-episode?lang=${lang}&bookId=${id}`, { signal: controller.signal })
      .then(r => r.json())
      .then(d => {
        if (d?.ok) {
          setStreamData(d);
          // Save initial progress so this drama appears in continue watching
          saveProgress({
            book_id: d.bookId,
            title: d.title,
            pic: d.episodes?.[startEp]?.video_pic || d.pic,
            chapter: startEp,
            total: d.episodes?.length ?? 0,
          });
        }
      })
      .catch(e => { if (e.name !== 'AbortError') console.error('Watch fetch:', e); })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [id, lang]);

  // ── Cleanup timer on unmount ───────────────────────────────────────────────
  useEffect(() => {
    return () => { clearTimeout(controlsTimerRef.current); };
  }, []);

  // ── Controls timer ─────────────────────────────────────────────────────────
  const resetControlsTimer = useCallback(() => {
    clearTimeout(controlsTimerRef.current);
    setShowControls(true);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3500);
  }, []);

  // ── Slide animation engine ─────────────────────────────────────────────────
  const slideTo = (targetIdx: number, dir: SlideDir) => {
    if (!streamData || isAnimating) return;
    if (targetIdx < 0 || targetIdx >= streamData.episodes.length) return;

    setStaging(targetIdx);
    setSlideDir(dir);
    setIsAnimating(true);
    setDragY(0);

    // Show controls whenever switching episodes
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

      // Save progress for the episode that just became active
      if (streamData) {
        const ep = streamData.episodes[targetIdx];
        saveProgress({
          book_id: streamData.bookId,
          title: streamData.title,
          pic: ep?.video_pic || streamData.pic,
          chapter: targetIdx,
          total: streamData.episodes.length,
        });
      }

      // Keep controls visible briefly after episode lands
      clearTimeout(controlsTimerRef.current);
      setShowControls(true);
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 3500);
    }, SLIDE_DURATION);
  };

  const goNext = () => slideTo(current + 1, 'up');
  const goPrev = () => slideTo(current - 1, 'down');

  // ── Swipe gestures ─────────────────────────────────────────────────────────
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
    const dy = touchStartY.current - e.touches[0].clientY; // positive = up
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
      if (dy > 0 && streamData && current < streamData.episodes.length - 1) {
        goNext();
      } else if (dy < 0 && current > 0) {
        goPrev();
      } else {
        setDragY(0); // bounce back
      }
    } else {
      setDragY(0);
    }

    setTimeout(() => { isSwiping.current = false; }, 50);
  };

  // ── Player controls ────────────────────────────────────────────────────────
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

  // ── Seek bar ───────────────────────────────────────────────────────────────
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

  // Route stream URLs through the server proxy so the browser always
  // makes HTTPS requests — fixes mixed-content blocks on production
  const proxyUrl = (raw: string) =>
    raw.startsWith('http') ? `/stream?url=${encodeURIComponent(raw)}` : raw;

  // ── Stable callbacks for VideoSlot (prevent stale closures) ──────────────
  const onCurrentReady = useCallback(() => {
    setBuffering(false);
    clearTimeout(controlsTimerRef.current);
    setShowControls(true);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3500);
  }, []);

  const onCurrentTimeUpdate = useCallback((cur: number, dur: number) => {
    if (isDraggingSeek.current) return;
    setCurrentTime(cur);
    setDuration(dur);
    setProgress((cur / dur) * 100);
  }, []);

  const onCurrentPlay  = useCallback(() => setIsPlaying(true), []);
  const onCurrentPause = useCallback(() => setIsPlaying(false), []);
  const onCurrentWait  = useCallback(() => setBuffering(true), []);
  const onCurrentPlay2 = useCallback(() => setBuffering(false), []);
  // dragY > 0 = user dragging up (towards next), < 0 = dragging down (towards prev)
  // clamp to ±screen height so it feels physical
  const clampedDrag = Math.max(-300, Math.min(300, dragY));

  // Current video: moves WITH the drag, then slides fully off when animating
  const currentTranslate = (() => {
    if (isAnimating) {
      return slideDir === 'up' ? '-100%' : '100%';
    }
    return `${-clampedDrag * 0.45}px`;
  })();

  // Staging video: starts below (dir=up) or above (dir=down), slides to 0
  const stagingTranslate = (() => {
    if (!isAnimating) {
      // peek while dragging
      if (dragY > 20) return `calc(100% - ${clampedDrag * 0.45}px)`; // next peeking from bottom
      if (dragY < -20) return `calc(-100% - ${clampedDrag * 0.45}px)`; // prev peeking from top
      return slideDir === 'up' ? '100%' : '-100%';
    }
    return '0%';
  })();

  const transition = isAnimating
    ? `transform ${SLIDE_DURATION}ms cubic-bezier(0.32, 0.72, 0, 1)`
    : 'none';

  // ── Loading / error ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!streamData) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-400">Drama not found</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-red-600 rounded-lg text-white text-sm">
          Back to Home
        </button>
      </div>
    );
  }

  const totalEps = streamData.episodes.length;
  const currentEp = streamData.episodes[current];
  const stagingEp = staging !== null ? streamData.episodes[staging] : null;
  const canGoNext = current < totalEps - 1;
  const canGoPrev = current > 0;

  return (
    <div
      className="fixed inset-0 bg-black select-none overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* ── CURRENT VIDEO ──────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{ transform: `translateY(${currentTranslate})`, transition }}
      >
        {currentEp && (
          <VideoSlot
            key={`current-${current}`}
            url={proxyUrl(currentEp.streams[0]?.url || currentEp.videoUrl)}
            isHls={currentEp.isHls}
            poster={currentEp.video_pic || streamData.pic}
            muted={isMuted}
            videoRef={currentVideoRef}
            onReady={onCurrentReady}
            onTimeUpdate={onCurrentTimeUpdate}
            onPlay={onCurrentPlay}
            onPause={onCurrentPause}
            onWaiting={onCurrentWait}
            onCanPlay={onCurrentPlay2}
            onEnded={canGoNext ? goNext : () => {}}
          />
        )}
      </div>

      {/* ── STAGING VIDEO (next/prev sliding in) ───────────────────────────── */}
      {stagingEp && (
        <div
          className="absolute inset-0"
          style={{ transform: `translateY(${stagingTranslate})`, transition }}
        >
          <VideoSlot
            key={`staging-${staging}`}
            url={proxyUrl(stagingEp.streams[0]?.url || stagingEp.videoUrl)}
            isHls={stagingEp.isHls}
            poster={stagingEp.video_pic || streamData.pic}
            muted={isMuted}
            videoRef={stagingVideoRef}
            onReady={() => {}}
            onTimeUpdate={() => {}}
            onPlay={() => {}}
            onPause={() => {}}
            onWaiting={() => {}}
            onCanPlay={() => {}}
            onEnded={() => {}}
          />
        </div>
      )}

      {/* ── BUFFERING SPINNER ───────────────────────────────────────────────── */}
      {buffering && !isAnimating && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-red-500 animate-spin" />
        </div>
      )}

      {/* ── SWIPE HINT: next ────────────────────────────────────────────────── */}
      {canGoNext && dragY > 20 && !isAnimating && (
        <div className="absolute bottom-24 left-0 right-0 z-30 flex flex-col items-center pointer-events-none">
          <div
            className="flex flex-col items-center gap-1 transition-opacity"
            style={{ opacity: Math.min(1, (dragY - 20) / 60) }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 5l7 7H5l7-7z" fill="white" opacity="0.6" />
              <path d="M12 11l7 7H5l7-7z" fill="white" opacity="0.3" />
            </svg>
            <p className="text-white/80 text-xs font-semibold">EP {current + 2}</p>
          </div>
        </div>
      )}

      {/* ── SWIPE HINT: prev ────────────────────────────────────────────────── */}
      {canGoPrev && dragY < -20 && !isAnimating && (
        <div className="absolute top-24 left-0 right-0 z-30 flex flex-col items-center pointer-events-none">
          <div
            className="flex flex-col items-center gap-1 transition-opacity"
            style={{ opacity: Math.min(1, (-dragY - 20) / 60) }}
          >
            <p className="text-white/80 text-xs font-semibold">EP {current}</p>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 19l7-7H5l7 7z" fill="white" opacity="0.6" />
              <path d="M12 13l7-7H5l7 7z" fill="white" opacity="0.3" />
            </svg>
          </div>
        </div>
      )}

      {/* ── ALL CONTROLS (tap layer) ─────────────────────────────────────────── */}
      <div className="absolute inset-0 z-20" onClick={handleScreenTap}>

        {/* TOP BAR */}
        <div
          className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent
            transition-all duration-300
            ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <div className="flex items-center gap-3 px-4 pt-12 pb-6">
            <button
              data-nswipe
              onClick={(e) => { e.stopPropagation(); navigate('/'); }}
              className="w-9 h-9 flex items-center justify-center shrink-0"
            >
              <ArrowLeft size={22} className="text-white drop-shadow" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate drop-shadow">{streamData.title}</p>
              <p className="text-white/60 text-xs mt-0.5">EP {current + 1} · {totalEps} Episodes</p>
            </div>
            <button
              data-nswipe
              onClick={(e) => { e.stopPropagation(); setShowEpisodes(true); }}
              className="px-4 py-1.5 bg-red-500 rounded-full text-white text-xs font-bold shrink-0 shadow-lg shadow-red-500/30"
            >
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
        <div
          className={`absolute right-4 bottom-36 flex flex-col items-center gap-5
            transition-all duration-300
            ${showControls ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}
        >
          <button
            data-nswipe
            onClick={(e) => { e.stopPropagation(); setIsLiked(l => !l); resetControlsTimer(); }}
            className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-colors
              ${isLiked ? 'bg-red-500' : 'bg-black/50'}`}
          >
            <Heart size={22} fill={isLiked ? 'white' : 'none'} className="text-white" />
          </button>
          <button
            data-nswipe
            onClick={(e) => { e.stopPropagation(); setShowInfo(true); resetControlsTimer(); }}
            className="w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center"
          >
            <Info size={22} className="text-white" />
          </button>
          <button
            data-nswipe
            onClick={(e) => { e.stopPropagation(); resetControlsTimer(); }}
            className="w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center"
          >
            <Share2 size={20} className="text-white" />
          </button>
        </div>

        {/* BOTTOM CONTROLS */}
        <div
          className={`absolute bottom-0 left-0 right-0
            bg-gradient-to-t from-black/85 via-black/40 to-transparent
            transition-all duration-300
            ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}
        >
          <div className="px-4 pt-6 pb-8 space-y-2">
            {/* Seek bar */}
            <div
              data-nswipe
              ref={progressBarRef}
              className="relative w-full h-8 flex items-center cursor-pointer"
              onClick={onSeekClick}
              onTouchMove={onSeekTouchMove}
              onTouchEnd={onSeekTouchEnd}
            >
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] bg-white/20 rounded-full">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md"
                style={{ left: `calc(${progress}% - 8px)` }}
              />
            </div>
            {/* Time */}
            <div className="flex justify-between text-[11px] text-white/60 -mt-1 px-0.5">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            {/* Buttons */}
            <div className="flex items-center justify-between pt-1" data-nswipe>
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-transform"
                >
                  {isPlaying
                    ? <Pause size={20} fill="white" className="text-white" />
                    : <Play size={20} fill="white" className="text-white ml-0.5" />}
                </button>
                <span className="text-white/60 text-xs font-semibold">EP {current + 1} / {totalEps}</span>
              </div>
              <button
                onClick={toggleMute}
                className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-transform"
              >
                {isMuted ? <VolumeX size={18} className="text-white" /> : <Volume2 size={18} className="text-white" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── EPISODE LIST SHEET ────────────────────────────────────────────────── */}
      {showEpisodes && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowEpisodes(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl max-h-[78vh] overflow-hidden animate-slideUp"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div>
                <p className="text-white font-bold text-base">Episodes</p>
                <p className="text-zinc-400 text-xs mt-0.5">{totalEps} episodes · EP {current + 1} playing</p>
              </div>
              <button onClick={() => setShowEpisodes(false)}
                className="w-9 h-9 bg-white/5 rounded-full flex items-center justify-center text-white text-xl">×</button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(78vh-72px)] scrollbar-hide">
              <div className="grid grid-cols-5 gap-2.5">
                {streamData.episodes.map((ep, idx) => (
                  <button key={ep.chapterId}
                    onClick={() => { slideTo(idx, idx > current ? 'up' : 'down'); setShowEpisodes(false); }}
                    className={`aspect-square rounded-xl text-sm font-bold transition-all
                      ${current === idx
                        ? 'bg-red-500 text-white scale-105 shadow-lg shadow-red-500/30'
                        : 'bg-white/5 text-zinc-300 active:scale-95'}`}
                  >
                    {ep.index}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── INFO SHEET ────────────────────────────────────────────────────────── */}
      {showInfo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowInfo(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl max-h-[80vh] overflow-hidden animate-slideUp"
            onClick={e => e.stopPropagation()}>
            <div className="relative h-44 overflow-hidden">
              <img src={streamData.pic} alt={streamData.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
              <button onClick={() => setShowInfo(false)}
                className="absolute top-3 right-3 w-9 h-9 bg-black/40 rounded-full flex items-center justify-center text-white text-xl">×</button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[calc(80vh-176px)] scrollbar-hide space-y-4">
              <div>
                <h2 className="text-white font-bold text-xl">{streamData.title}</h2>
                <p className="text-zinc-400 text-xs mt-1">EP {current + 1} of {streamData.totalChapters}</p>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-white font-bold text-lg">{(streamData.views / 1_000_000).toFixed(1)}M</p>
                  <p className="text-zinc-400 text-xs">Views</p>
                </div>
                <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-white font-bold text-lg">{streamData.totalChapters}</p>
                  <p className="text-zinc-400 text-xs">Episodes</p>
                </div>
              </div>
              {streamData.theme?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {streamData.theme.map((t, i) => (
                    <span key={i} className="text-xs px-3 py-1 rounded-full border border-red-500/30 text-red-400 bg-red-500/10">{t}</span>
                  ))}
                </div>
              )}
              {streamData.desc && <p className="text-zinc-300 text-sm leading-relaxed">{streamData.desc}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Watch;
