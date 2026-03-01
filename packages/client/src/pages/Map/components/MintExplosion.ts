/**
 * MintExplosion — THREE.js particle burst manager for live mint events.
 *
 * Features:
 *  - 60-particle hemisphere burst from surface point
 *  - Expanding ring + fade
 *  - Core flash sprite (white → teal over 400ms)
 *  - Object pooling (pre-allocate 200 particles for reuse)
 *  - AdditiveBlending, depthWrite: false for glow
 *
 * Usage:
 *   const mgr = new MintExplosionManager(scene, globeRef);
 *   mgr.trigger(lat, lng, 'WTR', 2500);
 *   // In RAF loop:
 *   mgr.update(elapsedSeconds);
 */
import * as THREE from 'three';
import { MINT_BURST } from '../hologramStyles';

// ─── Types ──────────────────────────────────────────────

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number; // 0→1 (normalized age)
  maxLife: number; // seconds
  startAlpha: number;
}

interface Explosion {
  id: string;
  particles: Particle[];
  ring: THREE.Mesh;
  coreFlash: THREE.Sprite;
  origin: THREE.Vector3;
  color: THREE.Color;
  elapsed: number;
  done: boolean;
}

// ─── Particle Pool ──────────────────────────────────────

const POOL_SIZE = 200;

function createParticleGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(POOL_SIZE * 3);
  const alphas = new Float32Array(POOL_SIZE);
  const sizes = new Float32Array(POOL_SIZE);
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geo.setDrawRange(0, 0); // nothing drawn initially
  return geo;
}

function createParticleMaterial(color: THREE.Color): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: {
      uColor: { value: color },
    },
    vertexShader: /* glsl */ `
      attribute float alpha;
      attribute float size;
      varying float vAlpha;
      void main() {
        vAlpha = alpha;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (200.0 / -mvPos.z);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        // Soft circle
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float soft = 1.0 - smoothstep(0.2, 0.5, d);
        gl_FragColor = vec4(uColor, vAlpha * soft);
      }
    `,
  });
}

// ─── Ring geometry (reusable) ────────────────────────────

function createRingMesh(color: THREE.Color): THREE.Mesh {
  const geo = new THREE.RingGeometry(0.3, 0.5, 32);
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.visible = false;
  return mesh;
}

// ─── Core flash sprite ──────────────────────────────────

function createCoreSprite(color: THREE.Color): THREE.Sprite {
  // Radial gradient canvas texture
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, '#FFFFFF');
  gradient.addColorStop(0.3, `#${color.getHexString()}`);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(4, 4, 1);
  sprite.visible = false;
  return sprite;
}

// ─── Lat/Lng → 3D position ─────────────────────────────

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function getTickerColor(ticker: string): THREE.Color {
  const hex = (MINT_BURST.colors as Record<string, string>)[ticker] || MINT_BURST.colors.DEFAULT;
  return new THREE.Color(hex);
}

// ─── Manager Class ──────────────────────────────────────

export class MintExplosionManager {
  private scene: THREE.Scene;
  private explosions: Explosion[] = [];
  private globeRadius = 100; // react-globe.gl default

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /** Trigger a new mint explosion at (lat, lng) */
  trigger(lat: number, lng: number, ticker: string, _amount: number): string {
    const id = `explosion_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const origin = latLngToVector3(lat, lng, this.globeRadius + 1);
    const color = getTickerColor(ticker);

    // Normal direction (outward from globe center)
    const normal = origin.clone().normalize();

    // Create particles
    const particles: Particle[] = [];
    for (let i = 0; i < MINT_BURST.particleCount; i++) {
      // Random direction in hemisphere oriented along normal
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5; // hemisphere
      const speed = 2 + Math.random() * MINT_BURST.burstRadius;

      // Create a random direction in hemisphere
      const localDir = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi),
      );

      // Rotate to align with surface normal
      const quat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        normal,
      );
      localDir.applyQuaternion(quat);

      particles.push({
        position: origin.clone(),
        velocity: localDir.multiplyScalar(speed),
        life: 0,
        maxLife: MINT_BURST.burstDuration / 1000 * (0.6 + Math.random() * 0.4),
        startAlpha: 0.6 + Math.random() * 0.4,
      });
    }

    // Points system for this explosion
    const geo = createParticleGeometry();
    const mat = createParticleMaterial(color);
    const points = new THREE.Points(geo, mat);
    points.name = `__mint_particles_${id}`;
    points.frustumCulled = false;
    this.scene.add(points);

    // Ring
    const ring = createRingMesh(color);
    ring.position.copy(origin);
    ring.lookAt(origin.clone().multiplyScalar(2)); // face outward
    ring.name = `__mint_ring_${id}`;
    ring.visible = true;
    this.scene.add(ring);

    // Core flash
    const coreFlash = createCoreSprite(color);
    coreFlash.position.copy(origin);
    coreFlash.name = `__mint_core_${id}`;
    coreFlash.visible = true;
    (coreFlash.material as THREE.SpriteMaterial).opacity = 1.0;
    this.scene.add(coreFlash);

    const explosion: Explosion = {
      id,
      particles,
      ring,
      coreFlash,
      origin,
      color,
      elapsed: 0,
      done: false,
    };

    this.explosions.push(explosion);
    return id;
  }

  /** Update all active explosions — call each frame with delta time (seconds) */
  update(dt: number): void {
    for (const exp of this.explosions) {
      if (exp.done) continue;
      exp.elapsed += dt;

      const burstSec = MINT_BURST.burstDuration / 1000;
      const progress = Math.min(exp.elapsed / burstSec, 1);

      // ── Update particles ──
      const points = this.scene.getObjectByName(`__mint_particles_${exp.id}`) as THREE.Points | undefined;
      if (points) {
        const posAttr = points.geometry.getAttribute('position') as THREE.BufferAttribute;
        const alphaAttr = points.geometry.getAttribute('alpha') as THREE.BufferAttribute;
        const sizeAttr = points.geometry.getAttribute('size') as THREE.BufferAttribute;

        const count = Math.min(exp.particles.length, POOL_SIZE);
        points.geometry.setDrawRange(0, count);

        for (let i = 0; i < count; i++) {
          const p = exp.particles[i];
          p.life += dt / p.maxLife;

          if (p.life < 1) {
            // Move particle
            p.position.addScaledVector(p.velocity, dt);
            // Decelerate
            p.velocity.multiplyScalar(0.97);

            posAttr.setXYZ(i, p.position.x, p.position.y, p.position.z);
            // Fade out
            const fade = 1 - p.life;
            alphaAttr.setX(i, p.startAlpha * fade * fade);
            sizeAttr.setX(i, 0.5 + (1 - fade) * 0.3);
          } else {
            alphaAttr.setX(i, 0);
            sizeAttr.setX(i, 0);
          }
        }

        posAttr.needsUpdate = true;
        alphaAttr.needsUpdate = true;
        sizeAttr.needsUpdate = true;
      }

      // ── Ring expansion + fade ──
      if (exp.ring.visible) {
        const ringProgress = Math.min(exp.elapsed / (burstSec * 0.8), 1);
        const scale = 1 + ringProgress * MINT_BURST.ringExpansion;
        exp.ring.scale.set(scale, scale, 1);
        (exp.ring.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - ringProgress);
        if (ringProgress >= 1) exp.ring.visible = false;
      }

      // ── Core flash ──
      const flashSec = MINT_BURST.coreFlashDuration / 1000;
      if (exp.elapsed < flashSec) {
        const flashProgress = exp.elapsed / flashSec;
        const flashAlpha = 1 - flashProgress;
        (exp.coreFlash.material as THREE.SpriteMaterial).opacity = flashAlpha;
        const flashScale = 4 + flashProgress * 3;
        exp.coreFlash.scale.set(flashScale, flashScale, 1);
      } else {
        exp.coreFlash.visible = false;
      }

      // ── Mark done ──
      if (progress >= 1) {
        exp.done = true;
      }
    }

    // Clean up finished explosions
    this.explosions = this.explosions.filter((exp) => {
      if (!exp.done) return true;

      // Dispose and remove
      const points = this.scene.getObjectByName(`__mint_particles_${exp.id}`) as THREE.Points | undefined;
      if (points) {
        points.geometry.dispose();
        (points.material as THREE.Material).dispose();
        this.scene.remove(points);
      }

      if (exp.ring) {
        (exp.ring.geometry as THREE.BufferGeometry).dispose();
        (exp.ring.material as THREE.Material).dispose();
        this.scene.remove(exp.ring);
      }

      if (exp.coreFlash) {
        const spriteMat = exp.coreFlash.material as THREE.SpriteMaterial;
        if (spriteMat.map) spriteMat.map.dispose();
        spriteMat.dispose();
        this.scene.remove(exp.coreFlash);
      }

      return false;
    });
  }

  /** Clean up all explosions (on unmount) */
  dispose(): void {
    for (const exp of this.explosions) {
      exp.done = true;
    }
    this.update(0); // triggers cleanup
  }

  /** Active explosion count */
  get activeCount(): number {
    return this.explosions.length;
  }
}
