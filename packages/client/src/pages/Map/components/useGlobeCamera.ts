/**
 * useGlobeCamera — smooth fly-to with easing
 */
import { useCallback, useRef } from 'react';

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

interface POV {
  lat: number;
  lng: number;
  altitude: number;
}

export function useGlobeCamera() {
  const globeRef = useRef<any>(null);
  const animFrameRef = useRef<number>(0);

  const flyTo = useCallback((lat: number, lng: number, altitude = 1.8, durationMs = 1200) => {
    const globe = globeRef.current;
    if (!globe) return;

    cancelAnimationFrame(animFrameRef.current);

    const start: POV = globe.pointOfView();
    const end: POV = { lat, lng, altitude };
    const t0 = performance.now();

    function animate(now: number) {
      const elapsed = now - t0;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = easeInOutCubic(progress);

      globe.pointOfView({
        lat: start.lat + (end.lat - start.lat) * eased,
        lng: start.lng + (end.lng - start.lng) * eased,
        altitude: start.altitude + (end.altitude - start.altitude) * eased,
      });

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, []);

  return { globeRef, flyTo };
}
