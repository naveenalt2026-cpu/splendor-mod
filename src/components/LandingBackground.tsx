import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Sparkles, Video, Eye, Settings2 } from './FastIcons.tsx';
import { ambientMusic } from '../game/ambientMusic.ts';

export type BackgroundVisualMode = 'canvas' | 'video' | 'combined';

interface LandingBackgroundProps {
  defaultMode?: BackgroundVisualMode;
}

// 3D Gemstone Definition
interface GemParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  rotSpeedX: number;
  rotSpeedY: number;
  rotSpeedZ: number;
  size: number;
  type: 'diamond' | 'emerald' | 'ruby' | 'sapphire' | 'onyx' | 'gold';
  pulsePhase: number;
  sparkleTimer: number;
}

// Stardust Particle Definition
interface Stardust {
  x: number;
  y: number;
  size: number;
  speedY: number;
  opacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
}

const STARDUST_COLORS = ['#F59E0B', '#FBBF24', '#FDE68A', '#38BDF8', '#34D399', '#FB7185'];
const GEM_TYPES: GemParticle['type'][] = [
  'diamond',
  'emerald',
  'ruby',
  'sapphire',
  'onyx',
  'gold',
];

export const LandingBackground: React.FC<LandingBackgroundProps> = ({
  defaultMode = 'canvas',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [visualMode, setVisualMode] = useState<BackgroundVisualMode>(defaultMode);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(ambientMusic.getIsMuted());
  const [showSettings, setShowSettings] = useState(false);
  const [customVideoUrl, setCustomVideoUrl] = useState<string>('');
  const [videoError, setVideoError] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const mousePosRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // Listen to ambient music state changes
  useEffect(() => {
    const unsubscribe = ambientMusic.subscribe((playing, muted) => {
      setIsPlayingMusic(playing);
      setIsMusicMuted(muted);
    });
    return unsubscribe;
  }, []);

  // Unlock audio on first user gesture
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        if (!ambientMusic.getIsMuted()) {
          ambientMusic.start();
        }
      }
    };

    window.addEventListener('click', handleFirstInteraction, { once: true, passive: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true, passive: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true, passive: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [hasInteracted]);

  // Track mouse position for smooth 3D parallax
  useEffect(() => {
    let animId: number;
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(animId);
      animId = requestAnimationFrame(() => {
        mousePosRef.current.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
        mousePosRef.current.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // 60FPS Zero-Allocation Canvas Animation Loop: 3D Faceted Gemstones & Golden Stardust
  useEffect(() => {
    if (visualMode === 'video') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize, { passive: true });

    const gemCount = window.innerWidth < 768 ? 8 : 14;
    const gems: GemParticle[] = Array.from({ length: gemCount }, (_, i) => ({
      x: (Math.random() - 0.5) * width * 1.3,
      y: (Math.random() - 0.5) * height * 1.3,
      z: Math.random() * 600 - 100,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.35 - 0.15,
      vz: (Math.random() - 0.5) * 0.2,
      rotX: Math.random() * Math.PI * 2,
      rotY: Math.random() * Math.PI * 2,
      rotZ: Math.random() * Math.PI * 2,
      rotSpeedX: (Math.random() - 0.5) * 0.015,
      rotSpeedY: (Math.random() - 0.5) * 0.02,
      rotSpeedZ: (Math.random() - 0.5) * 0.012,
      size: 26 + Math.random() * 22,
      type: GEM_TYPES[i % GEM_TYPES.length],
      pulsePhase: Math.random() * Math.PI * 2,
      sparkleTimer: Math.random() * 200,
    }));

    const stardustCount = window.innerWidth < 768 ? 35 : 65;
    const stardust: Stardust[] = Array.from({ length: stardustCount }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 1.2 + Math.random() * 2.2,
      speedY: 0.25 + Math.random() * 0.65,
      opacity: 0.15 + Math.random() * 0.65,
      twinkleSpeed: 0.02 + Math.random() * 0.04,
      twinklePhase: Math.random() * Math.PI * 2,
      color: STARDUST_COLORS[i % STARDUST_COLORS.length],
    }));

    // Draw 4-pointed specular sparkle flare without object allocation
    const drawSparkle = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      alpha: number
    ) => {
      c.save();
      c.translate(x, y);
      c.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      c.beginPath();
      c.moveTo(0, -size);
      c.quadraticCurveTo(0, 0, size, 0);
      c.quadraticCurveTo(0, 0, 0, size);
      c.quadraticCurveTo(0, 0, -size, 0);
      c.quadraticCurveTo(0, 0, 0, -size);
      c.fill();

      c.fillStyle = `rgba(251, 191, 36, ${alpha * 0.6})`;
      c.beginPath();
      c.arc(0, 0, size * 0.35, 0, Math.PI * 2);
      c.fill();
      c.restore();
    };

    // Draw Faceted Diamond (zero allocation)
    const drawDiamond = (c: CanvasRenderingContext2D, s: number, angle: number) => {
      c.save();
      c.rotate(angle);
      c.shadowColor = 'rgba(186, 230, 253, 0.4)';
      c.shadowBlur = s * 0.6;

      c.fillStyle = '#E0F2FE';
      c.beginPath();
      c.moveTo(-s * 0.7, -s * 0.3);
      c.lineTo(s * 0.7, -s * 0.3);
      c.lineTo(s * 0.45, -s * 0.7);
      c.lineTo(-s * 0.45, -s * 0.7);
      c.closePath();
      c.fill();

      c.fillStyle = '#38BDF8';
      c.beginPath();
      c.moveTo(-s * 0.7, -s * 0.3);
      c.lineTo(s * 0.7, -s * 0.3);
      c.lineTo(0, s * 0.85);
      c.closePath();
      c.fill();

      c.fillStyle = '#0284C7';
      c.beginPath();
      c.moveTo(-s * 0.7, -s * 0.3);
      c.lineTo(-s * 0.2, -s * 0.3);
      c.lineTo(0, s * 0.85);
      c.closePath();
      c.fill();

      c.fillStyle = '#7DD3FC';
      c.beginPath();
      c.moveTo(s * 0.7, -s * 0.3);
      c.lineTo(s * 0.2, -s * 0.3);
      c.lineTo(0, s * 0.85);
      c.closePath();
      c.fill();

      c.fillStyle = '#FFFFFF';
      c.beginPath();
      c.moveTo(-s * 0.3, -s * 0.65);
      c.lineTo(s * 0.3, -s * 0.65);
      c.lineTo(s * 0.4, -s * 0.35);
      c.lineTo(-s * 0.4, -s * 0.35);
      c.closePath();
      c.fill();

      c.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      c.lineWidth = 1.2;
      c.stroke();
      c.restore();
    };

    // Draw Faceted Emerald (zero allocation)
    const drawEmerald = (c: CanvasRenderingContext2D, s: number, angle: number) => {
      c.save();
      c.rotate(angle);
      c.shadowColor = 'rgba(16, 185, 129, 0.45)';
      c.shadowBlur = s * 0.7;

      const w = s * 0.75;
      const h = s * 0.95;
      const cut = s * 0.25;

      c.fillStyle = '#047857';
      c.beginPath();
      c.moveTo(-w + cut, -h);
      c.lineTo(w - cut, -h);
      c.lineTo(w, -h + cut);
      c.lineTo(w, h - cut);
      c.lineTo(w - cut, h);
      c.lineTo(-w + cut, h);
      c.lineTo(-w, h - cut);
      c.lineTo(-w, -h + cut);
      c.closePath();
      c.fill();

      c.fillStyle = '#059669';
      c.beginPath();
      c.moveTo(-w + cut * 1.5, -h + cut * 0.8);
      c.lineTo(w - cut * 1.5, -h + cut * 0.8);
      c.lineTo(w - cut * 0.8, h - cut * 0.8);
      c.lineTo(-w + cut * 0.8, h - cut * 0.8);
      c.closePath();
      c.fill();

      c.fillStyle = '#34D399';
      c.beginPath();
      c.rect(-w * 0.5, -h * 0.45, w, h * 0.9);
      c.fill();

      c.fillStyle = '#A7F3D0';
      c.beginPath();
      c.moveTo(-w * 0.45, -h * 0.4);
      c.lineTo(0, -h * 0.4);
      c.lineTo(-w * 0.45, 0);
      c.closePath();
      c.fill();

      c.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      c.lineWidth = 1;
      c.stroke();
      c.restore();
    };

    // Draw Faceted Ruby (zero allocation)
    const drawRuby = (c: CanvasRenderingContext2D, s: number, angle: number) => {
      c.save();
      c.rotate(angle);
      c.shadowColor = 'rgba(244, 63, 94, 0.45)';
      c.shadowBlur = s * 0.7;

      c.fillStyle = '#9F1239';
      c.beginPath();
      for (let i = 0; i < 6; i++) {
        const rad = (i * Math.PI) / 3;
        const px = Math.cos(rad) * s * 0.85;
        const py = Math.sin(rad) * s * 0.85;
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      c.fill();

      for (let i = 0; i < 6; i++) {
        const rad1 = (i * Math.PI) / 3;
        const rad2 = ((i + 1) * Math.PI) / 3;
        c.fillStyle = i % 2 === 0 ? '#E11D48' : '#F43F5E';
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(Math.cos(rad1) * s * 0.85, Math.sin(rad1) * s * 0.85);
        c.lineTo(Math.cos(rad2) * s * 0.85, Math.sin(rad2) * s * 0.85);
        c.closePath();
        c.fill();
      }

      c.fillStyle = '#FDA4AF';
      c.beginPath();
      for (let i = 0; i < 6; i++) {
        const rad = (i * Math.PI) / 3;
        const px = Math.cos(rad) * s * 0.42;
        const py = Math.sin(rad) * s * 0.42;
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      c.fill();

      c.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      c.lineWidth = 1;
      c.stroke();
      c.restore();
    };

    // Draw Faceted Sapphire (zero allocation)
    const drawSapphire = (c: CanvasRenderingContext2D, s: number, angle: number) => {
      c.save();
      c.rotate(angle);
      c.shadowColor = 'rgba(59, 130, 246, 0.45)';
      c.shadowBlur = s * 0.7;

      c.fillStyle = '#1E3A8A';
      c.beginPath();
      c.moveTo(0, -s * 0.95);
      c.lineTo(s * 0.8, 0);
      c.lineTo(0, s * 0.95);
      c.lineTo(-s * 0.8, 0);
      c.closePath();
      c.fill();

      c.fillStyle = '#3B82F6';
      c.beginPath();
      c.moveTo(0, -s * 0.95);
      c.lineTo(s * 0.4, 0);
      c.lineTo(0, s * 0.4);
      c.lineTo(-s * 0.4, 0);
      c.closePath();
      c.fill();

      c.fillStyle = '#2563EB';
      c.beginPath();
      c.moveTo(-s * 0.8, 0);
      c.lineTo(-s * 0.4, 0);
      c.lineTo(0, s * 0.95);
      c.closePath();
      c.fill();

      c.fillStyle = '#93C5FD';
      c.beginPath();
      c.moveTo(0, -s * 0.95);
      c.lineTo(s * 0.3, -s * 0.2);
      c.lineTo(0, 0);
      c.closePath();
      c.fill();

      c.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      c.lineWidth = 1;
      c.stroke();
      c.restore();
    };

    // Draw Faceted Onyx (zero allocation)
    const drawOnyx = (c: CanvasRenderingContext2D, s: number, angle: number) => {
      c.save();
      c.rotate(angle);
      c.shadowColor = 'rgba(71, 85, 105, 0.4)';
      c.shadowBlur = s * 0.6;

      c.fillStyle = '#0F172A';
      c.beginPath();
      c.rect(-s * 0.7, -s * 0.7, s * 1.4, s * 1.4);
      c.fill();

      c.fillStyle = '#1E293B';
      c.beginPath();
      c.moveTo(-s * 0.7, -s * 0.7);
      c.lineTo(s * 0.7, -s * 0.7);
      c.lineTo(s * 0.4, -s * 0.4);
      c.lineTo(-s * 0.4, -s * 0.4);
      c.closePath();
      c.fill();

      c.fillStyle = '#334155';
      c.beginPath();
      c.moveTo(s * 0.7, -s * 0.7);
      c.lineTo(s * 0.7, s * 0.7);
      c.lineTo(s * 0.4, s * 0.4);
      c.lineTo(s * 0.4, -s * 0.4);
      c.closePath();
      c.fill();

      c.fillStyle = '#475569';
      c.beginPath();
      c.rect(-s * 0.4, -s * 0.4, s * 0.8, s * 0.8);
      c.fill();

      c.strokeStyle = 'rgba(226, 232, 240, 0.6)';
      c.lineWidth = 1;
      c.stroke();
      c.restore();
    };

    // Draw Renaissance Gold Coin (zero allocation)
    const drawGoldCoin = (c: CanvasRenderingContext2D, s: number, angle: number) => {
      c.save();
      c.rotate(angle);
      c.shadowColor = 'rgba(245, 158, 11, 0.5)';
      c.shadowBlur = s * 0.8;

      c.fillStyle = '#D97706';
      c.beginPath();
      c.arc(0, 0, s * 0.85, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = '#F59E0B';
      c.beginPath();
      c.arc(0, 0, s * 0.78, 0, Math.PI * 2);
      c.fill();

      c.strokeStyle = '#FEF3C7';
      c.lineWidth = 2;
      c.stroke();

      c.strokeStyle = 'rgba(120, 53, 15, 0.5)';
      c.lineWidth = 1.2;
      c.beginPath();
      c.arc(0, 0, s * 0.65, 0, Math.PI * 2);
      c.stroke();

      c.fillStyle = '#FFFBEB';
      c.beginPath();
      const cs = s * 0.4;
      c.moveTo(-cs, -cs * 0.3);
      c.lineTo(-cs * 0.5, cs * 0.3);
      c.lineTo(0, -cs * 0.45);
      c.lineTo(cs * 0.5, cs * 0.3);
      c.lineTo(cs, -cs * 0.3);
      c.lineTo(cs * 0.7, cs * 0.6);
      c.lineTo(-cs * 0.7, cs * 0.6);
      c.closePath();
      c.fill();
      c.restore();
    };

    // Render loop
    const render = () => {
      const target = mousePosRef.current;
      target.x += (target.targetX - target.x) * 0.05;
      target.y += (target.targetY - target.y) * 0.05;

      // Clear canvas (background vignette is styled with CSS to eliminate heap allocation)
      ctx.clearRect(0, 0, width, height);

      // Render Golden Stardust
      stardust.forEach((p) => {
        p.y -= p.speedY;
        p.x += Math.sin(p.twinklePhase) * 0.3;
        p.twinklePhase += p.twinkleSpeed;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        const currentOpacity = p.opacity * (0.6 + Math.sin(p.twinklePhase) * 0.4);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, currentOpacity));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render 3D Floating Gemstones with Parallax and Perspective
      const fov = 450;
      const centerX = width * 0.5;
      const centerY = height * 0.5;

      gems.sort((a, b) => b.z - a.z);

      gems.forEach((gem) => {
        gem.x += gem.vx;
        gem.y += gem.vy;
        gem.z += gem.vz;
        gem.rotX += gem.rotSpeedX;
        gem.rotY += gem.rotSpeedY;
        gem.rotZ += gem.rotSpeedZ;
        gem.pulsePhase += 0.02;
        gem.sparkleTimer += 1;

        const boundX = width * 0.7;
        const boundY = height * 0.7;
        if (gem.x < -boundX) gem.x = boundX;
        if (gem.x > boundX) gem.x = -boundX;
        if (gem.y < -boundY) gem.y = boundY;
        if (gem.y > boundY) gem.y = -boundY;
        if (gem.z < -100) gem.z = 500;
        if (gem.z > 500) gem.z = -100;

        const parallaxFactor = (500 - gem.z) / 500;
        const depthScale = fov / (fov + gem.z);
        const screenX = centerX + gem.x * depthScale + target.x * 50 * parallaxFactor;
        const screenY = centerY + gem.y * depthScale + target.y * 35 * parallaxFactor;
        const currentSize = gem.size * depthScale;

        const alpha = Math.max(0.35, Math.min(1, (600 - gem.z) / 500));

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(screenX, screenY);

        switch (gem.type) {
          case 'diamond':
            drawDiamond(ctx, currentSize, gem.rotZ);
            break;
          case 'emerald':
            drawEmerald(ctx, currentSize, gem.rotZ);
            break;
          case 'ruby':
            drawRuby(ctx, currentSize, gem.rotZ);
            break;
          case 'sapphire':
            drawSapphire(ctx, currentSize, gem.rotZ);
            break;
          case 'onyx':
            drawOnyx(ctx, currentSize, gem.rotZ);
            break;
          case 'gold':
            drawGoldCoin(ctx, currentSize, gem.rotZ);
            break;
        }

        if (gem.sparkleTimer % 180 < 35) {
          const sparkleProgress = (gem.sparkleTimer % 180) / 35;
          const sparkleSize = Math.sin(sparkleProgress * Math.PI) * currentSize * 0.6;
          drawSparkle(ctx, currentSize * 0.4, -currentSize * 0.4, sparkleSize, alpha);
        }

        ctx.restore();
      });

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [visualMode]);

  const toggleMusic = () => {
    ambientMusic.toggle();
  };

  return (
    <div className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0">
      {/* CSS-driven hardware-accelerated deep vignette (zero JS memory allocation) */}
      <div className="absolute inset-0 bg-radial from-[#10172A] via-[#0B0F1A] to-[#05070D] pointer-events-none" />

      {/* 1. Optional Ambient Video Background (mounted on-demand only) */}
      {(visualMode === 'video' || visualMode === 'combined') && !videoError && customVideoUrl && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          onError={() => setVideoError(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            visualMode === 'combined' ? 'opacity-35 mix-blend-screen' : 'opacity-70'
          }`}
          src={customVideoUrl}
        />
      )}

      {/* 2. Hardware-accelerated 3D Gem & Stardust Canvas */}
      {visualMode !== 'video' && (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      )}

      {/* 3. Outer Radial Vignette */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#0B0F1A]/50 to-[#05070D]/90 pointer-events-none" />

      {/* 4. Elegant Top-Right Audio & Visual Controls */}
      <div className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 z-40 flex items-center gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={toggleMusic}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md transition-all shadow-lg cursor-pointer ${
            isPlayingMusic && !isMusicMuted
              ? 'bg-amber-500/20 border-amber-400/60 text-amber-200 hover:bg-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
              : 'bg-[#121826]/80 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
          }`}
          title={isMusicMuted ? 'Unmute Renaissance Theme' : 'Mute Renaissance Theme'}
          aria-label="Toggle background audio"
        >
          {isPlayingMusic && !isMusicMuted ? (
            <>
              <Volume2 size={16} className="text-amber-400 animate-pulse" />
              <div className="flex items-center gap-0.5 h-3">
                <span className="w-0.5 h-2 bg-amber-400 rounded-full animate-bounce" />
                <span className="w-0.5 h-3 bg-amber-300 rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-0.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
              <span className="text-[11px] font-['Cinzel'] font-bold tracking-wider hidden sm:inline text-amber-200">
                Music ON
              </span>
            </>
          ) : (
            <>
              <VolumeX size={16} className="text-slate-400" />
              <span className="text-[11px] font-['Cinzel'] font-medium tracking-wider hidden sm:inline">
                Music OFF
              </span>
            </>
          )}
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSettings((prev) => !prev)}
            className="p-1.5 rounded-full bg-[#121826]/80 border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10 backdrop-blur-md transition-all cursor-pointer shadow-md"
            title="Visual & Audio Settings"
            aria-label="Visual settings"
          >
            <Settings2 size={16} />
          </button>

          {showSettings && (
            <div className="absolute right-0 mt-2 w-56 p-3 rounded-2xl bg-[#0F1626]/95 border border-amber-500/30 shadow-2xl backdrop-blur-xl flex flex-col gap-2 z-50 text-slate-200 text-xs animate-showcase-in">
              <div className="font-['Cinzel'] font-bold text-amber-300 tracking-wider text-[11px] border-b border-white/10 pb-1.5">
                Background Visuals
              </div>

              <button
                type="button"
                onClick={() => {
                  setVisualMode('canvas');
                  setShowSettings(false);
                }}
                className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer text-left ${
                  visualMode === 'canvas'
                    ? 'bg-amber-500/20 border border-amber-400/50 text-amber-200'
                    : 'hover:bg-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-400" />
                  <span className="font-medium">3D Gems & Stardust</span>
                </div>
                {visualMode === 'canvas' && <span className="text-[10px]">●</span>}
              </button>

              <button
                type="button"
                onClick={() => {
                  setVisualMode('combined');
                  setShowSettings(false);
                }}
                className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer text-left ${
                  visualMode === 'combined'
                    ? 'bg-amber-500/20 border border-amber-400/50 text-amber-200'
                    : 'hover:bg-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Eye size={14} className="text-cyan-400" />
                  <span className="font-medium">Cinematic Combined</span>
                </div>
                {visualMode === 'combined' && <span className="text-[10px]">●</span>}
              </button>

              <button
                type="button"
                onClick={() => {
                  setVisualMode('video');
                  setShowSettings(false);
                }}
                className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer text-left ${
                  visualMode === 'video'
                    ? 'bg-amber-500/20 border border-amber-400/50 text-amber-200'
                    : 'hover:bg-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Video size={14} className="text-emerald-400" />
                  <span className="font-medium">Video Only</span>
                </div>
                {visualMode === 'video' && <span className="text-[10px]">●</span>}
              </button>

              <div className="pt-2 border-t border-white/10 flex flex-col gap-1">
                <label className="text-[10px] text-slate-400">Custom MP4 Video URL:</label>
                <input
                  type="url"
                  placeholder="https://.../video.mp4"
                  value={customVideoUrl}
                  onChange={(e) => {
                    setCustomVideoUrl(e.target.value);
                    setVideoError(false);
                  }}
                  className="w-full px-2 py-1 bg-black/40 border border-white/10 rounded-lg text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Autoplay Prompt for Browsers Blocking Audio */}
      {!hasInteracted && !isMusicMuted && (
        <div className="absolute bottom-4 inset-x-0 flex justify-center z-40 pointer-events-auto animate-bounce">
          <button
            type="button"
            onClick={() => {
              setHasInteracted(true);
              ambientMusic.start();
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-['Cinzel'] tracking-wider shadow-lg backdrop-blur-md cursor-pointer hover:bg-amber-500/30 transition-all"
          >
            <Sparkles size={13} className="text-amber-400" />
            <span>Click anywhere to start Renaissance music 🎵</span>
          </button>
        </div>
      )}
    </div>
  );
};
