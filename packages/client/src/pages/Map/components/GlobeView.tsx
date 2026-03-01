/**
 * GlobeView — 3D hologram globe with beam pins, pulsing rings, and fly-to camera.
 * Uses react-globe.gl with custom THREE.js objects for the hologram look.
 *
 * Globe coordinate system: radius ≈ 100 units.
 * Pin objects are sized in those units so beams read 1.5–8 units tall.
 *
 * Features:
 *  - Type-based animated data arcs (water/energy/token/emergency flows)
 *  - Heatmap intensity layer via pointsData
 *  - Real-time pulse ring streams at arc origins
 *  - Projection modes: earth / orbital / lunar
 */
import React, { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { useMapStore, type FlowType, type HeatmapMode, type ProjectionMode } from '../store';
import type { MintEventForGlobe, BridgeEventForGlobe } from '../store';
import { CHAIN_HUBS } from '../hologramStyles';
import { useGlobeCamera } from './useGlobeCamera';
import GlobeOverlay from './GlobeOverlay';
import { MintExplosionManager } from './MintExplosion';
import { CrossChainArcManager } from './CrossChainArcs';
import { AgentLayerManager } from './AgentLayer';
import {
  HOLO, BEAM, RING, CORE, FLOW_COLORS, HEAT_GRADIENT, ATMOSPHERE,
  statusColor, statusIntensity,
  computeActivity, computeBeamHeight,
  clamp01, lerp,
} from '../hologramStyles';
import type { NexusSite } from '../mockData';

// ─── Data Flow Arc Interface ────────────────────────────

interface DataFlow {
  id: string;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  type: 'WATER' | 'ENERGY' | 'TOKEN' | 'EMERGENCY';
  intensity: number; // 0-1
}

// ─── Pulse Ring Datum ───────────────────────────────────

interface PulseRing {
  lat: number;
  lng: number;
  color: string;
  maxR: number;
  propagationSpeed: number;
  repeatPeriod: number;
}

// ─── Heatmap Point Datum ────────────────────────────────

interface HeatPoint {
  lat: number;
  lng: number;
  intensity: number;
  color: string;
  radius: number;
}

// ─── Beam Gradient Texture ──────────────────────────────

function createBeamTexture(color: string, intensity: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Gradient: transparent at top → bright at bottom (base of beam)
  const gradient = ctx.createLinearGradient(0, 0, 0, 128);
  const a = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  gradient.addColorStop(0.0, `${color}00`);               // tip: invisible
  gradient.addColorStop(0.15, color + a(intensity * 40));  // fade in
  gradient.addColorStop(0.5, color + a(intensity * 130));  // mid glow
  gradient.addColorStop(0.85, color + a(intensity * 200)); // bright
  gradient.addColorStop(1.0, color + a(intensity * 255));  // base: full
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 4, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ─── Glow Sprite Texture ────────────────────────────────

function createGlowTexture(color: string): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;

  const gradient = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  gradient.addColorStop(0.0, color + 'cc');
  gradient.addColorStop(0.3, color + '66');
  gradient.addColorStop(0.7, color + '18');
  gradient.addColorStop(1.0, color + '00');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ─── Pin Object Factory ─────────────────────────────────

/** LOD: 'full' = 5 objects (beam/ring/outerRing/core/glow), 'simple' = 2 objects (core/glow) */
type PinLOD = 'full' | 'simple';

function createPinObject(site: NexusSite, lod: PinLOD = 'full'): THREE.Group {
  const group = new THREE.Group();
  const color = statusColor(site.status);
  const intensity = statusIntensity(site.status);
  const activity = computeActivity(site.litersToday, site.alerts?.length ?? 0);
  const beamHeight = computeBeamHeight(activity);

  if (lod === 'full') {
    // ── Beam (tapered translucent cylinder with gradient) ──
    const beamGeo = new THREE.CylinderGeometry(
      BEAM.radiusTop,
      BEAM.radiusBottom,
      beamHeight,
      BEAM.segments,
      1,
      true,
    );
    const beamTex = createBeamTexture(color, intensity);
    const beamMat = new THREE.MeshBasicMaterial({
      map: beamTex,
      transparent: true,
      opacity: BEAM.opacity * intensity,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = beamHeight / 2;
    beam.name = 'beam';
    group.add(beam);

    // ── Inner Ring (pulsing base ring) ──
    const ringGeo = new THREE.RingGeometry(RING.innerRadius, RING.outerRadius, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: RING.baseOpacity * intensity,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    ring.name = 'ring';
    group.add(ring);

    // ── Outer Pulse Ring (expanding + fading) ──
    const outerRingGeo = new THREE.RingGeometry(RING.outerRadius * 0.9, RING.outerRadius * 1.1, 32);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: RING.baseOpacity * intensity * 0.5,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.position.y = 0.04;
    outerRing.name = 'outerRing';
    group.add(outerRing);
  }

  // ── Core (bright sphere at base) — always present ──
  const coreGeo = new THREE.SphereGeometry(
    lod === 'simple' ? CORE.radius * 1.4 : CORE.radius,
    lod === 'simple' ? 8 : 12,
    lod === 'simple' ? 8 : 12,
  );
  const coreMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: CORE.opacity * intensity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.y = 0.06;
  core.name = 'core';
  group.add(core);

  // ── Glow Sprite (soft halo around base) — always present ──
  const glowTex = createGlowTexture(color);
  const glowMat = new THREE.SpriteMaterial({
    map: glowTex,
    transparent: true,
    opacity: (lod === 'simple' ? 0.35 : 0.55) * intensity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(lod === 'simple' ? 2.5 : 3.5, lod === 'simple' ? 2.5 : 3.5, 1);
  glow.position.y = 0.15;
  glow.name = 'glow';
  group.add(glow);

  // Store metadata for animation loop
  (group as any).__nexus = {
    siteId: site.id,
    color,
    intensity,
    phase: Math.random() * Math.PI * 2,
    beamHeight,
    lod,
  };

  return group;
}

/** LOD threshold: hand-crafted sites get full pins, generated get simple */
const LOD_FULL_LIMIT = 60; // First N sites get full LOD

// ─── Helpers ────────────────────────────────────────────

/** Map flow type to its FLOW_COLORS key */
function flowColor(type: DataFlow['type']): string {
  switch (type) {
    case 'WATER': return FLOW_COLORS.WATER;
    case 'ENERGY': return FLOW_COLORS.ENERGY;
    case 'TOKEN': return FLOW_COLORS.TOKEN;
    case 'EMERGENCY': return FLOW_COLORS.EMERGENCY;
  }
}

/** Haversine-ish quick distance for nearest-site lookup (degrees, not km) */
function degDist(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/** Interpolate through the HEAT_GRADIENT based on 0-1 intensity */
function heatColor(intensity: number): string {
  if (intensity < 0.33) return HEAT_GRADIENT.low;
  if (intensity < 0.66) return HEAT_GRADIENT.medium;
  if (intensity < 0.9) return HEAT_GRADIENT.high;
  return HEAT_GRADIENT.critical;
}

// ─── Component ──────────────────────────────────────────

export default function GlobeView() {
  const sites = useMapStore((s) => s.sites);
  const visibleTypes = useMapStore((s) => s.visibleTypes);
  const searchQuery = useMapStore((s) => s.searchQuery);
  const selectSite = useMapStore((s) => s.selectSite);
  const hoverSite = useMapStore((s) => s.hoverSite);
  const showArcs = useMapStore((s) => s.showArcs);
  const flowToggles = useMapStore((s) => s.flowToggles);
  const showHeatmap = useMapStore((s) => s.showHeatmap);
  const heatmapMode = useMapStore((s) => s.heatmapMode);
  const projection = useMapStore((s) => s.projection);

  const mintEvents = useMapStore((s) => s.mintEvents);
  const bridgeEvents = useMapStore((s) => s.bridgeEvents);
  const showAgentLayer = useMapStore((s) => s.showAgentLayer);

  const { globeRef, flyTo } = useGlobeCamera();
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const objectsRef = useRef<THREE.Group[]>([]);
  const explosionMgrRef = useRef<MintExplosionManager | null>(null);
  const crossChainMgrRef = useRef<CrossChainArcManager | null>(null);
  const agentLayerRef = useRef<AgentLayerManager | null>(null);
  const processedMintIdsRef = useRef<Set<string>>(new Set());
  const lastTickRef = useRef<number>(performance.now());
  const [dims, setDims] = useState({ width: 600, height: 500 });

  // ─── Filter visible sites ──────────────────────────────

  const filteredSites = useMemo(() => {
    let result = sites.filter((s) => visibleTypes.has(s.type));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.region.toLowerCase().includes(q),
      );
    }
    // Lunar projection: only show SPACE sites
    if (projection === 'lunar') {
      result = result.filter((s) => s.type === 'SPACE');
    }
    return result;
  }, [sites, visibleTypes, searchQuery, projection]);

  // ─── Type-based Data Flow Arcs ─────────────────────────

  const arcData: DataFlow[] = useMemo(() => {
    if (!showArcs) return [];

    const flows: DataFlow[] = [];
    let flowId = 0;

    // WATER arcs — AWG/GREYWATER/RAIN that are ACTIVE with litersToday > 0
    if (flowToggles.water) {
      const waterSites = filteredSites.filter(
        (s) =>
          ['AWG', 'GREYWATER', 'RAIN'].includes(s.type) &&
          s.status === 'ACTIVE' &&
          s.litersToday > 0,
      );
      for (let i = 0; i < waterSites.length; i++) {
        const from = waterSites[i];
        const to = waterSites[(i + 3) % waterSites.length];
        if (from.id !== to.id) {
          const intensity = clamp01(from.litersToday / 10000);
          flows.push({
            id: `water_${flowId++}`,
            fromLat: from.lat,
            fromLng: from.lng,
            toLat: to.lat,
            toLng: to.lng,
            type: 'WATER',
            intensity,
          });
        }
      }
    }

    // ENERGY arcs — UTILITY sites with energyKwhToday > 0
    if (flowToggles.energy) {
      const energySites = filteredSites.filter(
        (s) => s.type === 'UTILITY' && s.status === 'ACTIVE' && (s.energyKwhToday ?? 0) > 0,
      );
      for (let i = 0; i < energySites.length; i++) {
        const from = energySites[i];
        const to = energySites[(i + 1) % energySites.length];
        if (from.id !== to.id) {
          const intensity = clamp01((from.energyKwhToday ?? 0) / 3000);
          flows.push({
            id: `energy_${flowId++}`,
            fromLat: from.lat,
            fromLng: from.lng,
            toLat: to.lat,
            toLng: to.lng,
            type: 'ENERGY',
            intensity,
          });
        }
      }
    }

    // TOKEN arcs — sites with minted batch IDs
    if (flowToggles.tokens) {
      const tokenSites = filteredSites.filter(
        (s) =>
          (s.wtrMintedBatchIds && s.wtrMintedBatchIds.length > 0) ||
          (s.engMintedBatchIds && s.engMintedBatchIds.length > 0),
      );
      for (let i = 0; i < tokenSites.length; i++) {
        const from = tokenSites[i];
        const to = tokenSites[(i + 1) % tokenSites.length];
        if (from.id !== to.id) {
          const batchCount =
            (from.wtrMintedBatchIds?.length ?? 0) + (from.engMintedBatchIds?.length ?? 0);
          const intensity = clamp01(batchCount / 4);
          flows.push({
            id: `token_${flowId++}`,
            fromLat: from.lat,
            fromLng: from.lng,
            toLat: to.lat,
            toLng: to.lng,
            type: 'TOKEN',
            intensity,
          });
        }
      }
    }

    // EMERGENCY arcs — EMERGENCY sites to nearest non-emergency ACTIVE site
    if (flowToggles.emergency) {
      const emergencySites = filteredSites.filter((s) => s.type === 'EMERGENCY');
      const nonEmergencyActive = filteredSites.filter(
        (s) => s.type !== 'EMERGENCY' && s.status === 'ACTIVE',
      );

      for (const eSite of emergencySites) {
        let nearest: NexusSite | null = null;
        let bestDist = Infinity;
        for (const target of nonEmergencyActive) {
          const d = degDist(eSite.lat, eSite.lng, target.lat, target.lng);
          if (d < bestDist) {
            bestDist = d;
            nearest = target;
          }
        }
        if (nearest) {
          const intensity = eSite.status === 'ACTIVE' ? 0.9 : 0.4;
          flows.push({
            id: `emergency_${flowId++}`,
            fromLat: eSite.lat,
            fromLng: eSite.lng,
            toLat: nearest.lat,
            toLng: nearest.lng,
            type: 'EMERGENCY',
            intensity,
          });
        }
      }
    }

    return flows;
  }, [filteredSites, showArcs, flowToggles]);

  // ─── Heatmap Points ────────────────────────────────────

  const heatmapPoints: HeatPoint[] = useMemo(() => {
    if (!showHeatmap) return [];

    return filteredSites.map((site) => {
      let intensity: number;
      switch (heatmapMode) {
        case 'liters':
          intensity = clamp01(site.litersToday / 10000);
          break;
        case 'alerts':
          intensity = clamp01((site.alerts?.length ?? 0) / 5);
          break;
        case 'esg':
          intensity = clamp01((site.esgScore ?? 0) / 100);
          break;
        default:
          intensity = 0;
      }

      return {
        lat: site.lat,
        lng: site.lng,
        intensity,
        color: heatColor(intensity),
        radius: 0.5 + intensity * 2,
      };
    });
  }, [filteredSites, showHeatmap, heatmapMode]);

  // ─── Pulse Ring Data (real-time stream effect at arc origins) ──

  const pulseRingData: PulseRing[] = useMemo(() => {
    if (!showArcs) return [];

    // De-duplicate by origin location (avoid stacking pulses at same site)
    const seen = new Set<string>();
    const rings: PulseRing[] = [];

    for (const arc of arcData) {
      const key = `${arc.fromLat.toFixed(2)}_${arc.fromLng.toFixed(2)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      rings.push({
        lat: arc.fromLat,
        lng: arc.fromLng,
        color: flowColor(arc.type),
        maxR: 2,
        propagationSpeed: 2,
        repeatPeriod: lerp(3000, 1000, arc.intensity),
      });
    }

    return rings;
  }, [arcData, showArcs]);

  // ─── Projection-dependent config ───────────────────────

  const globeImageUrl = useMemo(() => {
    if (projection === 'lunar') {
      // Real lunar surface texture from three.js examples
      return 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r171/examples/textures/planets/moon_1024.jpg';
    }
    if (projection === 'orbital') {
      // Blue marble for orbital — bright daytime satellite view
      return '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
    }
    return '//unpkg.com/three-globe/example/img/earth-night.jpg';
  }, [projection]);

  const bumpImageUrl = useMemo(() => {
    if (projection === 'lunar') {
      return '//unpkg.com/three-globe/example/img/earth-topology.png';
    }
    return undefined;
  }, [projection]);

  const atmosphereColor = useMemo(() => {
    if (projection === 'lunar') return '#8899BB'; // cold pale blue — very subtle
    if (projection === 'orbital') return '#4488FF'; // vivid orbital blue
    return HOLO.atmosphere;
  }, [projection]);

  const atmosphereAltitude = useMemo(() => {
    if (projection === 'orbital') return 0.25;
    if (projection === 'lunar') return 0.04; // extremely thin — moon has no atmosphere
    return 0.18;
  }, [projection]);

  const objectAltitude = useMemo(() => {
    if (projection === 'orbital') return 0.04;
    if (projection === 'lunar') return 0.02;
    return 0.01;
  }, [projection]);

  // Auto-rotate for orbital mode
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;
    const controls = (globe as any).controls?.();
    if (controls) {
      controls.autoRotate = projection === 'orbital';
      controls.autoRotateSpeed = 0.4;
    }
  }, [projection, globeRef]);

  // ─── Pin object factory (stable callback) ──────────────

  const objectThreeObject = useCallback((d: object, idx?: number) => {
    const site = d as NexusSite;
    // LOD: hand-crafted sites get full pins, generated sites get simple pins
    const isHandCrafted = !site.id.startsWith('site_gen_');
    const lod: PinLOD = isHandCrafted ? 'full' : 'simple';
    const obj = createPinObject(site, lod);
    objectsRef.current.push(obj);
    return obj;
  }, []);

  // ─── Initialize explosion + arc + agent managers when scene is ready ──
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const timer = setTimeout(() => {
      const scene = (globe as any).scene?.() as THREE.Scene | undefined;
      if (scene && !explosionMgrRef.current) {
        explosionMgrRef.current = new MintExplosionManager(scene);
      }
      if (scene && !crossChainMgrRef.current) {
        crossChainMgrRef.current = new CrossChainArcManager(scene);
      }
      if (scene && !agentLayerRef.current) {
        agentLayerRef.current = new AgentLayerManager(scene);
        // Initialize agents with current site coordinates
        if (filteredSites.length > 5) {
          agentLayerRef.current.initAgents(
            filteredSites.map((s) => ({ lat: s.lat, lng: s.lng })),
          );
        }
      }
    }, 600);

    return () => {
      clearTimeout(timer);
      if (explosionMgrRef.current) {
        explosionMgrRef.current.dispose();
        explosionMgrRef.current = null;
      }
      if (crossChainMgrRef.current) {
        crossChainMgrRef.current.dispose();
        crossChainMgrRef.current = null;
      }
      if (agentLayerRef.current) {
        agentLayerRef.current.dispose();
        agentLayerRef.current = null;
      }
    };
  }, [globeRef]);

  // ─── Process incoming mint events → trigger explosions ──
  useEffect(() => {
    const mgr = explosionMgrRef.current;
    if (!mgr) return;

    for (const evt of mintEvents) {
      if (!processedMintIdsRef.current.has(evt.id)) {
        processedMintIdsRef.current.add(evt.id);
        mgr.trigger(evt.lat, evt.lng, evt.ticker, evt.amount);
      }
    }

    // Cleanup old processed IDs (keep last 50)
    if (processedMintIdsRef.current.size > 100) {
      const arr = Array.from(processedMintIdsRef.current);
      processedMintIdsRef.current = new Set(arr.slice(-50));
    }
  }, [mintEvents]);

  // ─── Process incoming bridge events → trigger cross-chain arcs ──
  useEffect(() => {
    const mgr = crossChainMgrRef.current;
    if (!mgr) return;

    for (const evt of bridgeEvents) {
      if (!processedMintIdsRef.current.has(`bridge_${evt.id}`)) {
        processedMintIdsRef.current.add(`bridge_${evt.id}`);
        // Map chain names to hub keys
        const fromKey = evt.fromChain as keyof typeof CHAIN_HUBS;
        const toKey = evt.toChain as keyof typeof CHAIN_HUBS;
        if (CHAIN_HUBS[fromKey] && CHAIN_HUBS[toKey]) {
          mgr.trigger(fromKey, toKey, evt.token, evt.amount);
        }
      }
    }
  }, [bridgeEvents]);

  // ─── Animation loop — ring pulse, beam flicker, core pulse, glow breathe, explosions ──
  useEffect(() => {
    let running = true;
    lastTickRef.current = performance.now();

    function tick() {
      if (!running) return;
      const now = performance.now();
      const dt = Math.min((now - lastTickRef.current) / 1000, 0.1);
      lastTickRef.current = now;
      const t = now / 1000;

      for (const group of objectsRef.current) {
        const meta = (group as any).__nexus;
        if (!meta) continue;

        // Ring — expand + fade
        const ring = group.getObjectByName('ring') as THREE.Mesh | undefined;
        if (ring) {
          const cycle = ((t * 1000 + meta.phase * 500) % RING.pulseDuration) / RING.pulseDuration;
          const scale = 1 + cycle * (RING.pulseScale - 1);
          ring.scale.set(scale, scale, 1);
          (ring.material as THREE.MeshBasicMaterial).opacity =
            RING.baseOpacity * meta.intensity * (1 - cycle * 0.85);
        }

        // Outer ring — opposite phase, slower
        const outerRing = group.getObjectByName('outerRing') as THREE.Mesh | undefined;
        if (outerRing) {
          const cycle2 = ((t * 800 + meta.phase * 700) % (RING.pulseDuration * 1.3)) / (RING.pulseDuration * 1.3);
          const scale2 = 1.2 + cycle2 * (RING.pulseScale * 1.2 - 1.2);
          outerRing.scale.set(scale2, scale2, 1);
          (outerRing.material as THREE.MeshBasicMaterial).opacity =
            RING.baseOpacity * 0.35 * meta.intensity * (1 - cycle2);
        }

        // Beam — subtle flicker
        const beam = group.getObjectByName('beam') as THREE.Mesh | undefined;
        if (beam) {
          const flicker =
            1 +
            Math.sin(t * BEAM.flickerSpeed + meta.phase) * BEAM.flickerAmplitude +
            Math.sin(t * 7.3 + meta.phase * 2.1) * 0.03; // high-freq micro-flicker
          (beam.material as THREE.MeshBasicMaterial).opacity =
            BEAM.opacity * meta.intensity * Math.max(0.3, flicker);
        }

        // Core — slow pulse
        const core = group.getObjectByName('core') as THREE.Mesh | undefined;
        if (core) {
          const pulse = 0.7 + Math.sin(t * 2.2 + meta.phase) * 0.3;
          (core.material as THREE.MeshBasicMaterial).opacity = CORE.opacity * meta.intensity * pulse;
          const coreScale = 1 + Math.sin(t * 1.8 + meta.phase) * 0.15;
          core.scale.setScalar(coreScale);
        }

        // Glow sprite — gentle breathe
        const glow = group.getObjectByName('glow') as THREE.Sprite | undefined;
        if (glow) {
          const breathe = 0.85 + Math.sin(t * 1.5 + meta.phase * 0.7) * 0.15;
          (glow.material as THREE.SpriteMaterial).opacity = 0.55 * meta.intensity * breathe;
          const glowScale = 3.5 + Math.sin(t * 1.2 + meta.phase) * 0.5;
          glow.scale.set(glowScale, glowScale, 1);
        }
      }

      // ── Update mint explosion particles ──
      if (explosionMgrRef.current) {
        explosionMgrRef.current.update(dt);
      }

      // ── Update cross-chain arcs ──
      if (crossChainMgrRef.current) {
        crossChainMgrRef.current.update(dt);
      }

      // ── Update agent layer ──
      if (agentLayerRef.current) {
        agentLayerRef.current.update(dt);
      }

      animRef.current = requestAnimationFrame(tick);
    }
    tick();
    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  // ─── Volumetric atmosphere glow (Fresnel rim-lighting) ──
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    // Wait for the scene to be ready
    const timer = setTimeout(() => {
      const scene = (globe as any).scene?.() as THREE.Scene | undefined;
      if (!scene) return;

      const atmColor = new THREE.Color(ATMOSPHERE.color);

      // Inner glow — Fresnel rim-lighting shader
      const innerGeo = new THREE.SphereGeometry(ATMOSPHERE.innerGlowRadius, 64, 64);
      const innerMat = new THREE.ShaderMaterial({
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uColor: { value: atmColor },
          uPower: { value: ATMOSPHERE.fresnelPower },
          uOpacity: { value: ATMOSPHERE.innerOpacity },
        },
        vertexShader: /* glsl */ `
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            vViewDir = normalize(-mvPos.xyz);
            gl_Position = projectionMatrix * mvPos;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uPower;
          uniform float uOpacity;
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), uPower);
            gl_FragColor = vec4(uColor, fresnel * uOpacity);
          }
        `,
      });
      const innerGlow = new THREE.Mesh(innerGeo, innerMat);
      innerGlow.name = '__nexus_atmosphere_inner';
      scene.add(innerGlow);

      // Outer haze — soft bloom
      const outerGeo = new THREE.SphereGeometry(ATMOSPHERE.outerHazeRadius, 32, 32);
      const outerMat = new THREE.ShaderMaterial({
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uColor: { value: atmColor },
          uOpacity: { value: ATMOSPHERE.outerOpacity },
        },
        vertexShader: /* glsl */ `
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            vViewDir = normalize(-mvPos.xyz);
            gl_Position = projectionMatrix * mvPos;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uOpacity;
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 2.0);
            gl_FragColor = vec4(uColor, fresnel * uOpacity * 0.5);
          }
        `,
      });
      const outerHaze = new THREE.Mesh(outerGeo, outerMat);
      outerHaze.name = '__nexus_atmosphere_outer';
      scene.add(outerHaze);

      // Store references for cleanup
      (containerRef.current as any).__atmInner = innerGlow;
      (containerRef.current as any).__atmOuter = outerHaze;
    }, 500);

    return () => {
      clearTimeout(timer);
      const scene = (globe as any).scene?.() as THREE.Scene | undefined;
      if (!scene) return;
      const inner = scene.getObjectByName('__nexus_atmosphere_inner');
      const outer = scene.getObjectByName('__nexus_atmosphere_outer');
      if (inner) {
        (inner as THREE.Mesh).geometry.dispose();
        ((inner as THREE.Mesh).material as THREE.Material).dispose();
        scene.remove(inner);
      }
      if (outer) {
        (outer as THREE.Mesh).geometry.dispose();
        ((outer as THREE.Mesh).material as THREE.Material).dispose();
        scene.remove(outer);
      }
    };
  }, [globeRef]);

  // ─── Toggle agent layer visibility ──
  useEffect(() => {
    if (agentLayerRef.current) {
      agentLayerRef.current.setVisible(showAgentLayer);
    }
  }, [showAgentLayer]);

  // ─── Re-init agents when sites change significantly ──
  useEffect(() => {
    if (agentLayerRef.current && filteredSites.length > 5) {
      agentLayerRef.current.initAgents(
        filteredSites.map((s) => ({ lat: s.lat, lng: s.lng })),
      );
    }
  }, [filteredSites.length > 100 ? 'scaled' : filteredSites.length]);

  // Clear cached objects when data changes
  useEffect(() => {
    objectsRef.current = [];
  }, [filteredSites]);

  // Click handler — select + fly-to
  const handleClick = useCallback(
    (d: object) => {
      const site = d as NexusSite;
      selectSite(site.id);
      flyTo(site.lat, site.lng, 1.8, 1200);
    },
    [selectSite, flyTo],
  );

  // Responsive size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setDims({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ─── Arc accessor callbacks (stable) ───────────────────

  const arcStartLat = useCallback((d: object) => (d as DataFlow).fromLat, []);
  const arcStartLng = useCallback((d: object) => (d as DataFlow).fromLng, []);
  const arcEndLat = useCallback((d: object) => (d as DataFlow).toLat, []);
  const arcEndLng = useCallback((d: object) => (d as DataFlow).toLng, []);

  const arcColor = useCallback((d: object) => {
    const flow = d as DataFlow;
    const c = flowColor(flow.type);
    // Encode alpha as a two-stop array: [startColor, endColor]
    const alphaHex = Math.round(flow.intensity * 200 + 55)
      .toString(16)
      .padStart(2, '0');
    return [c + alphaHex, c + '44'];
  }, []);

  const arcStroke = useCallback((d: object) => {
    const flow = d as DataFlow;
    return 0.3 + flow.intensity * 0.5;
  }, []);

  const arcDashAnimateTime = useCallback((d: object) => {
    const flow = d as DataFlow;
    return lerp(3000, 800, flow.intensity);
  }, []);

  // ─── Point accessor callbacks (heatmap) ────────────────

  const pointLat = useCallback((d: object) => (d as HeatPoint).lat, []);
  const pointLng = useCallback((d: object) => (d as HeatPoint).lng, []);
  const pointColor = useCallback((d: object) => {
    const p = d as HeatPoint;
    // Semi-transparent for additive feel
    const alphaHex = Math.round(p.intensity * 180 + 40)
      .toString(16)
      .padStart(2, '0');
    return p.color + alphaHex;
  }, []);
  const pointAlt = useCallback(() => 0.02, []);
  const pointRadius = useCallback((d: object) => (d as HeatPoint).radius, []);

  // ─── Ring accessor callbacks (pulse streams) ───────────

  const ringLat = useCallback((d: object) => (d as PulseRing).lat, []);
  const ringLng = useCallback((d: object) => (d as PulseRing).lng, []);
  const ringColor = useCallback((d: object) => {
    const r = d as PulseRing;
    return (t: number) => `${r.color}${Math.round((1 - t) * 200).toString(16).padStart(2, '0')}`;
  }, []);
  const ringMaxRadius = useCallback((d: object) => (d as PulseRing).maxR, []);
  const ringPropagationSpeed = useCallback((d: object) => (d as PulseRing).propagationSpeed, []);
  const ringRepeatPeriod = useCallback((d: object) => (d as PulseRing).repeatPeriod, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden bg-[#060810]"
    >
      <GlobeOverlay />
      <Globe
        ref={globeRef}
        width={dims.width}
        height={dims.height}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl={globeImageUrl}
        bumpImageUrl={bumpImageUrl as any}
        atmosphereColor={atmosphereColor}
        atmosphereAltitude={atmosphereAltitude}
        showGraticules={projection === 'orbital'}
        // ── Custom hologram pin objects ──
        objectsData={filteredSites}
        objectLat={(d: any) => d.lat}
        objectLng={(d: any) => d.lng}
        objectAltitude={objectAltitude}
        objectThreeObject={objectThreeObject}
        objectLabel={(d: any) => `
          <div style="font-family: ui-monospace, monospace; background: rgba(6,8,16,0.92); border: 1px solid rgba(37,214,149,0.25); border-radius: 8px; padding: 6px 10px; backdrop-filter: blur(8px); min-width: 140px;">
            <div style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 2px;">${d.name}</div>
            <div style="font-size: 9px; color: ${statusColor(d.status)}; text-transform: uppercase; letter-spacing: 0.08em;">${d.status} · ${d.type}</div>
            ${d.litersToday > 0 ? `<div style="font-size: 9px; color: #6b7280; margin-top: 3px;">${d.litersToday.toLocaleString()} L today</div>` : ''}
          </div>
        `}
        onObjectClick={handleClick}
        onObjectHover={(d: any) => hoverSite(d?.id ?? null)}
        // ── Type-based data flow arcs ──
        arcsData={arcData}
        arcStartLat={arcStartLat}
        arcStartLng={arcStartLng}
        arcEndLat={arcEndLat}
        arcEndLng={arcEndLng}
        arcColor={arcColor}
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={arcDashAnimateTime}
        arcStroke={arcStroke}
        arcAltitudeAutoScale={0.4}
        // ── Heatmap intensity points ──
        pointsData={heatmapPoints}
        pointLat={pointLat}
        pointLng={pointLng}
        pointColor={pointColor}
        pointAltitude={pointAlt}
        pointRadius={pointRadius}
        // ── Pulse stream rings ──
        ringsData={pulseRingData}
        ringLat={ringLat}
        ringLng={ringLng}
        ringColor={ringColor as any}
        ringMaxRadius={ringMaxRadius}
        ringPropagationSpeed={ringPropagationSpeed}
        ringRepeatPeriod={ringRepeatPeriod}
        // ── Camera ──
        animateIn={true}
      />
    </div>
  );
}
