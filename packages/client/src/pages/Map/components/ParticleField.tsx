/**
 * ParticleField — 2D canvas star field behind the globe.
 * Uses a separate <canvas> (not THREE.js) to avoid competing with WebGL.
 * Features: drifting stars, twinkle animation, mouse parallax.
 */
import { useEffect, useRef, useCallback } from 'react';
import { PARTICLES } from '../hologramStyles';

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  vx: number;
  vy: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const animRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });

  // Initialize stars
  const initStars = useCallback((w: number, h: number) => {
    const stars: Star[] = [];
    for (let i = 0; i < PARTICLES.count; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: PARTICLES.minSize + Math.random() * (PARTICLES.maxSize - PARTICLES.minSize),
        alpha: PARTICLES.minAlpha + Math.random() * (PARTICLES.maxAlpha - PARTICLES.minAlpha),
        vx: (Math.random() - 0.5) * PARTICLES.driftSpeed * 60,
        vy: (Math.random() - 0.5) * PARTICLES.driftSpeed * 60,
        twinkleSpeed: PARTICLES.twinkleSpeed.min + Math.random() * (PARTICLES.twinkleSpeed.max - PARTICLES.twinkleSpeed.min),
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }
    starsRef.current = stars;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize handler
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          const dpr = Math.min(window.devicePixelRatio, 2);
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          sizeRef.current = { w: width, h: height };
          if (starsRef.current.length === 0) {
            initStars(width, height);
          }
        }
      }
    });
    ro.observe(canvas.parentElement || canvas);

    // Mouse tracking for parallax
    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };
    window.addEventListener('mousemove', handleMouse, { passive: true });

    // Animation loop
    let lastTime = performance.now();
    function tick(now: number) {
      const dt = Math.min((now - lastTime) / 1000, 0.1); // cap at 100ms
      lastTime = now;
      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) {
        animRef.current = requestAnimationFrame(tick);
        return;
      }

      ctx!.clearRect(0, 0, w, h);

      const t = now / 1000;
      const mx = (mouseRef.current.x - 0.5) * PARTICLES.parallaxStrength * w;
      const my = (mouseRef.current.y - 0.5) * PARTICLES.parallaxStrength * h;

      for (const star of starsRef.current) {
        // Drift
        star.x += star.vx * dt;
        star.y += star.vy * dt;

        // Wrap around
        if (star.x < -10) star.x = w + 10;
        if (star.x > w + 10) star.x = -10;
        if (star.y < -10) star.y = h + 10;
        if (star.y > h + 10) star.y = -10;

        // Twinkle
        const twinkle = 0.7 + Math.sin(t * star.twinkleSpeed + star.twinklePhase) * 0.3;

        // Parallax offset (larger stars parallax more)
        const pFactor = star.size / PARTICLES.maxSize;
        const px = star.x + mx * pFactor;
        const py = star.y + my * pFactor;

        // Draw — fillRect is 3-4x faster than arc for sub-pixel dots
        ctx!.globalAlpha = star.alpha * twinkle;
        ctx!.fillStyle = '#FFFFFF';
        ctx!.fillRect(px, py, star.size, star.size);

        // Brighter stars get a soft glow
        if (star.size > 1.0 && star.alpha > 0.3) {
          ctx!.globalAlpha = star.alpha * twinkle * 0.15;
          ctx!.fillRect(px - 1, py - 1, star.size + 2, star.size + 2);
        }
      }

      ctx!.globalAlpha = 1;
      animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
      window.removeEventListener('mousemove', handleMouse);
    };
  }, [initStars]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
