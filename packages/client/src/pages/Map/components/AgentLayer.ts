/**
 * AgentLayer — 8-12 autonomous agent sprites traveling between sites
 * on great-circle paths. Cyan glow sprites, pulse rings at waypoints.
 *
 * Injected into the THREE.js scene, updated in the shared RAF loop.
 */
import * as THREE from 'three';

// ─── Agent Config ─────────────────────────────────────────

const AGENT_COUNT = 10;
const AGENT_SPEED = 0.08; // radians per second along path
const GLOBE_RADIUS = 100;
const SPRITE_SIZE = 2.8;
const TRAIL_LENGTH = 12;
const TRAIL_SPACING = 0.015; // spacing between trail dots in t
const PULSE_DURATION = 1.2; // seconds at waypoint
const AGENT_COLOR = '#22D3EE'; // cyan

// ─── Waypoint sets (indexes into site array) ──────────────
// Each agent has 3-5 waypoint site indices it cycles through

interface AgentState {
  group: THREE.Group;
  sprite: THREE.Sprite;
  trailDots: THREE.Sprite[];
  pulseRing: THREE.Mesh;
  waypoints: { lat: number; lng: number }[];
  currentSegment: number;
  t: number; // 0-1 along current segment
  atWaypoint: boolean;
  waypointTimer: number;
  active: boolean;
}

// ─── Lat/Lng → 3D conversion ──────────────────────────────

function latLngToVec3(lat: number, lng: number, altitude: number = 0): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const r = GLOBE_RADIUS + altitude;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

// ─── Spherical interpolation between two surface points ────

function sphericalLerp(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  t: number,
  altitude: number = 2,
): THREE.Vector3 {
  const v1 = latLngToVec3(a.lat, a.lng);
  const v2 = latLngToVec3(b.lat, b.lng);

  // Use THREE.js Quaternion slerp for great-circle interpolation
  const q1 = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    v1.clone().normalize(),
  );
  const q2 = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    v2.clone().normalize(),
  );

  const qResult = q1.clone().slerp(q2, t);
  const direction = new THREE.Vector3(0, 1, 0).applyQuaternion(qResult);

  // Add altitude bulge (sine curve — highest at midpoint)
  const bulge = Math.sin(t * Math.PI) * altitude;
  return direction.multiplyScalar(GLOBE_RADIUS + bulge);
}

// ─── Create agent sprite texture ──────────────────────────

function createAgentTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;

  // Outer glow
  const gradient = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  gradient.addColorStop(0.0, AGENT_COLOR + 'ff');
  gradient.addColorStop(0.15, AGENT_COLOR + 'cc');
  gradient.addColorStop(0.4, AGENT_COLOR + '44');
  gradient.addColorStop(0.7, AGENT_COLOR + '11');
  gradient.addColorStop(1.0, AGENT_COLOR + '00');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Bright core
  const coreGrad = ctx.createRadialGradient(cx, cx, 0, cx, cx, 6);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(1, AGENT_COLOR + '00');
  ctx.fillStyle = coreGrad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ─── Create trail dot texture ─────────────────────────────

function createTrailTexture(): THREE.CanvasTexture {
  const size = 16;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;

  const gradient = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  gradient.addColorStop(0.0, AGENT_COLOR + 'aa');
  gradient.addColorStop(0.5, AGENT_COLOR + '33');
  gradient.addColorStop(1.0, AGENT_COLOR + '00');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ─── Manager Class ─────────────────────────────────────────

export class AgentLayerManager {
  private scene: THREE.Scene;
  private agents: AgentState[] = [];
  private agentTex: THREE.CanvasTexture;
  private trailTex: THREE.CanvasTexture;
  private rootGroup: THREE.Group;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.agentTex = createAgentTexture();
    this.trailTex = createTrailTexture();
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = '__nexus_agent_layer';
    scene.add(this.rootGroup);
  }

  /**
   * Initialize agents with waypoints derived from sites.
   * Call once sites are loaded.
   */
  initAgents(siteCoords: { lat: number; lng: number }[]) {
    // Clean previous
    this.clearAgents();

    if (siteCoords.length < 5) return;

    // Generate deterministic waypoint sets for each agent
    const rng = this.mulberry32(12345);

    for (let i = 0; i < AGENT_COUNT; i++) {
      const waypointCount = 3 + Math.floor(rng() * 3); // 3-5 waypoints
      const waypoints: { lat: number; lng: number }[] = [];
      const usedIndices = new Set<number>();

      for (let w = 0; w < waypointCount; w++) {
        let idx: number;
        let attempts = 0;
        do {
          idx = Math.floor(rng() * siteCoords.length);
          attempts++;
        } while (usedIndices.has(idx) && attempts < 20);
        usedIndices.add(idx);
        waypoints.push(siteCoords[idx]);
      }

      if (waypoints.length < 2) continue;

      const agent = this.createAgent(waypoints, rng() * Math.PI * 2);
      this.agents.push(agent);
    }
  }

  private createAgent(waypoints: { lat: number; lng: number }[], startPhase: number): AgentState {
    const group = new THREE.Group();

    // Main agent sprite
    const spriteMat = new THREE.SpriteMaterial({
      map: this.agentTex,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(SPRITE_SIZE, SPRITE_SIZE, 1);
    group.add(sprite);

    // Trail dots
    const trailDots: THREE.Sprite[] = [];
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const dotMat = new THREE.SpriteMaterial({
        map: this.trailTex,
        transparent: true,
        opacity: 0.6 * (1 - i / TRAIL_LENGTH),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const dot = new THREE.Sprite(dotMat);
      const scale = 1.0 * (1 - i / TRAIL_LENGTH * 0.6);
      dot.scale.set(scale, scale, 1);
      dot.visible = false;
      group.add(dot);
      trailDots.push(dot);
    }

    // Pulse ring at waypoints
    const ringGeo = new THREE.RingGeometry(0.8, 1.5, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(AGENT_COLOR),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const pulseRing = new THREE.Mesh(ringGeo, ringMat);
    group.add(pulseRing);

    this.rootGroup.add(group);

    // Start at a random segment position
    const startSeg = Math.floor(startPhase / (Math.PI * 2) * waypoints.length) % waypoints.length;

    return {
      group,
      sprite,
      trailDots,
      pulseRing,
      waypoints,
      currentSegment: startSeg,
      t: (startPhase % 1),
      atWaypoint: false,
      waypointTimer: 0,
      active: true,
    };
  }

  /**
   * Update all agents each frame. Called from the main animation loop.
   */
  update(dt: number) {
    for (const agent of this.agents) {
      if (!agent.active) continue;

      const from = agent.waypoints[agent.currentSegment];
      const to = agent.waypoints[(agent.currentSegment + 1) % agent.waypoints.length];

      if (agent.atWaypoint) {
        // Pulse ring animation at waypoint
        agent.waypointTimer += dt;
        const progress = agent.waypointTimer / PULSE_DURATION;
        const ringMat = agent.pulseRing.material as THREE.MeshBasicMaterial;
        ringMat.opacity = Math.max(0, 0.5 * (1 - progress));
        const ringScale = 1 + progress * 3;
        agent.pulseRing.scale.set(ringScale, ringScale, 1);

        if (agent.waypointTimer >= PULSE_DURATION) {
          agent.atWaypoint = false;
          agent.waypointTimer = 0;
          ringMat.opacity = 0;
        }
        continue;
      }

      // Advance along path
      agent.t += AGENT_SPEED * dt;

      if (agent.t >= 1) {
        // Arrived at waypoint
        agent.t = 0;
        agent.currentSegment = (agent.currentSegment + 1) % agent.waypoints.length;
        agent.atWaypoint = true;
        agent.waypointTimer = 0;

        // Position pulse ring at waypoint
        const wpPos = latLngToVec3(to.lat, to.lng, 1);
        agent.pulseRing.position.copy(wpPos);
        agent.pulseRing.lookAt(new THREE.Vector3(0, 0, 0));

        // Position sprite at destination
        agent.sprite.position.copy(wpPos);
        continue;
      }

      // Position sprite along path
      const pos = sphericalLerp(from, to, agent.t, 3);
      agent.sprite.position.copy(pos);

      // Position trail dots
      for (let i = 0; i < agent.trailDots.length; i++) {
        const trailT = agent.t - (i + 1) * TRAIL_SPACING;
        if (trailT < 0) {
          agent.trailDots[i].visible = false;
          continue;
        }
        agent.trailDots[i].visible = true;
        const trailPos = sphericalLerp(from, to, trailT, 3);
        agent.trailDots[i].position.copy(trailPos);
      }
    }
  }

  private clearAgents() {
    for (const agent of this.agents) {
      this.rootGroup.remove(agent.group);
      // Dispose materials
      (agent.sprite.material as THREE.SpriteMaterial).dispose();
      for (const dot of agent.trailDots) {
        (dot.material as THREE.SpriteMaterial).dispose();
      }
      (agent.pulseRing.material as THREE.Material).dispose();
      (agent.pulseRing.geometry as THREE.BufferGeometry).dispose();
    }
    this.agents = [];
  }

  setVisible(visible: boolean) {
    this.rootGroup.visible = visible;
  }

  dispose() {
    this.clearAgents();
    this.scene.remove(this.rootGroup);
    this.agentTex.dispose();
    this.trailTex.dispose();
  }

  private mulberry32(seed: number) {
    let s = seed | 0;
    return () => {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
}
