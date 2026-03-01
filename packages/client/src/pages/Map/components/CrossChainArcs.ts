/**
 * CrossChainArcs — Bridge arc manager for cross-chain flow visualization.
 *
 * Features:
 *  - Thick dual-color gradient arcs between chain hub locations
 *  - Traveling "packet" particle along great-circle path
 *  - Triggered by BRIDGE events
 *  - Uses THREE.js Lines + Sprites injected into globe scene
 */
import * as THREE from 'three';
import { CHAIN_HUBS, HOLO } from '../hologramStyles';

// ─── Types ──────────────────────────────────────────────

interface ChainArc {
  id: string;
  fromHub: keyof typeof CHAIN_HUBS;
  toHub: keyof typeof CHAIN_HUBS;
  color: string;
  points: THREE.Vector3[];
  packet: THREE.Sprite;
  line: THREE.Line;
  elapsed: number;
  duration: number; // seconds
  done: boolean;
}

// ─── Utilities ──────────────────────────────────────────

const GLOBE_RADIUS = 100;

function latLngToVec3(lat: number, lng: number, r: number = GLOBE_RADIUS + 0.5): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

/** Generate points along a great-circle arc with altitude bulge */
function greatCirclePoints(
  from: THREE.Vector3,
  to: THREE.Vector3,
  segments: number = 48,
  altFactor: number = 0.15,
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // Spherical lerp
    const p = new THREE.Vector3().lerpVectors(from, to, t);
    p.normalize();
    // Altitude bulge (sine curve peaking at midpoint)
    const alt = GLOBE_RADIUS + 0.5 + Math.sin(t * Math.PI) * GLOBE_RADIUS * altFactor;
    p.multiplyScalar(alt);
    points.push(p);
  }
  return points;
}

/** Create a glowing packet sprite */
function createPacketSprite(color: string): THREE.Sprite {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, '#FFFFFF');
  gradient.addColorStop(0.3, color);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.9,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(3, 3, 1);
  return sprite;
}

// ─── Manager ────────────────────────────────────────────

export class CrossChainArcManager {
  private scene: THREE.Scene;
  private arcs: ChainArc[] = [];
  private persistentArcs: THREE.Group | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initPersistentArcs();
  }

  /** Create always-visible faint arcs between chain hubs */
  private initPersistentArcs(): void {
    const group = new THREE.Group();
    group.name = '__crosschain_persistent';

    const hubPairs: [keyof typeof CHAIN_HUBS, keyof typeof CHAIN_HUBS][] = [
      ['XRPL', 'BASE'],
      ['XRPL', 'ARBITRUM'],
      ['XRPL', 'COREUM'],
      ['BASE', 'ARBITRUM'],
    ];

    for (const [fromKey, toKey] of hubPairs) {
      const from = CHAIN_HUBS[fromKey];
      const to = CHAIN_HUBS[toKey];
      const fromVec = latLngToVec3(from.lat, from.lng);
      const toVec = latLngToVec3(to.lat, to.lng);
      const points = greatCirclePoints(fromVec, toVec, 32, 0.08);

      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(HOLO.space),
        transparent: true,
        opacity: 0.06,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(geo, mat);
      line.name = `__cc_arc_${fromKey}_${toKey}`;
      group.add(line);
    }

    this.scene.add(group);
    this.persistentArcs = group;
  }

  /** Trigger an animated bridge arc */
  trigger(
    fromHub: keyof typeof CHAIN_HUBS,
    toHub: keyof typeof CHAIN_HUBS,
    _token: string,
    _amount: number,
  ): string {
    const id = `cc_arc_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    const from = CHAIN_HUBS[fromHub];
    const to = CHAIN_HUBS[toHub];
    const fromVec = latLngToVec3(from.lat, from.lng);
    const toVec = latLngToVec3(to.lat, to.lng);
    const points = greatCirclePoints(fromVec, toVec, 48, 0.12);

    // Bright animated arc line
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(to.color),
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      linewidth: 2,
    });
    const line = new THREE.Line(geo, mat);
    line.name = `__cc_active_${id}`;
    this.scene.add(line);

    // Traveling packet
    const packet = createPacketSprite(to.color);
    packet.position.copy(points[0]);
    packet.name = `__cc_packet_${id}`;
    this.scene.add(packet);

    this.arcs.push({
      id,
      fromHub,
      toHub,
      color: to.color,
      points,
      packet,
      line,
      elapsed: 0,
      duration: 3, // seconds for full transit
      done: false,
    });

    return id;
  }

  /** Update per frame */
  update(dt: number): void {
    for (const arc of this.arcs) {
      if (arc.done) continue;
      arc.elapsed += dt;
      const progress = Math.min(arc.elapsed / arc.duration, 1);

      // Move packet along path
      const idx = Math.floor(progress * (arc.points.length - 1));
      const nextIdx = Math.min(idx + 1, arc.points.length - 1);
      const subT = (progress * (arc.points.length - 1)) - idx;
      const pos = new THREE.Vector3().lerpVectors(arc.points[idx], arc.points[nextIdx], subT);
      arc.packet.position.copy(pos);

      // Fade line in then out
      const lineFade = progress < 0.3 ? progress / 0.3 : progress > 0.7 ? (1 - progress) / 0.3 : 1;
      (arc.line.material as THREE.LineBasicMaterial).opacity = 0.5 * lineFade;

      // Packet glow pulse
      const pulse = 0.7 + Math.sin(arc.elapsed * 8) * 0.3;
      (arc.packet.material as THREE.SpriteMaterial).opacity = 0.9 * pulse;
      const scale = 3 + Math.sin(arc.elapsed * 4) * 0.5;
      arc.packet.scale.set(scale, scale, 1);

      if (progress >= 1) arc.done = true;
    }

    // Cleanup
    this.arcs = this.arcs.filter((arc) => {
      if (!arc.done) return true;
      arc.line.geometry.dispose();
      (arc.line.material as THREE.Material).dispose();
      this.scene.remove(arc.line);
      const pMat = arc.packet.material as THREE.SpriteMaterial;
      if (pMat.map) pMat.map.dispose();
      pMat.dispose();
      this.scene.remove(arc.packet);
      return false;
    });
  }

  dispose(): void {
    // Remove persistent arcs
    if (this.persistentArcs) {
      this.persistentArcs.traverse((obj) => {
        if ((obj as THREE.Line).geometry) (obj as THREE.Line).geometry.dispose();
        if ((obj as THREE.Line).material) ((obj as THREE.Line).material as THREE.Material).dispose();
      });
      this.scene.remove(this.persistentArcs);
    }
    // Remove active arcs
    for (const arc of this.arcs) {
      arc.done = true;
    }
    this.update(0);
  }

  get activeCount(): number {
    return this.arcs.length;
  }
}
