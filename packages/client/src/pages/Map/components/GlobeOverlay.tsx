/**
 * GlobeOverlay — Scanlines, vignette, HUD corners, coordinate readout, pulsing reticle
 * Pure CSS/HTML overlay, pointer-events: none
 */
import { useMapStore } from '../store';

export default function GlobeOverlay() {
  const selectedSiteId = useMapStore((s) => s.selectedSiteId);
  const sites = useMapStore((s) => s.sites);
  const projection = useMapStore((s) => s.projection);

  // Get selected site coordinates for the readout
  const selectedSite = selectedSiteId
    ? sites.find((s) => s.id === selectedSiteId)
    : null;

  const projLabel =
    projection === 'lunar' ? 'LUNAR' : projection === 'orbital' ? 'ORBITAL' : 'EARTH';

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden rounded-2xl">
      {/* Scanlines */}
      <div
        className="absolute inset-0"
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(37,214,149,0.03) 0px, rgba(37,214,149,0.03) 1px, transparent 1px, transparent 4px)',
          mixBlendMode: 'screen',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      {/* ── Corner brackets (extended) ── */}
      {/* Top left */}
      <div className="absolute top-3 left-3">
        <div className="w-8 h-px" style={{ background: 'linear-gradient(90deg, rgba(37,214,149,0.5) 0%, transparent 100%)' }} />
        <div className="w-px h-8" style={{ background: 'linear-gradient(180deg, rgba(37,214,149,0.5) 0%, transparent 100%)' }} />
      </div>
      {/* Top right */}
      <div className="absolute top-3 right-3 flex flex-col items-end">
        <div className="w-8 h-px" style={{ background: 'linear-gradient(270deg, rgba(37,214,149,0.5) 0%, transparent 100%)' }} />
        <div className="w-px h-8 self-end" style={{ background: 'linear-gradient(180deg, rgba(37,214,149,0.5) 0%, transparent 100%)' }} />
      </div>
      {/* Bottom left */}
      <div className="absolute bottom-3 left-3 flex flex-col justify-end">
        <div className="w-px h-8" style={{ background: 'linear-gradient(0deg, rgba(37,214,149,0.5) 0%, transparent 100%)' }} />
        <div className="w-8 h-px" style={{ background: 'linear-gradient(90deg, rgba(37,214,149,0.5) 0%, transparent 100%)' }} />
      </div>
      {/* Bottom right */}
      <div className="absolute bottom-3 right-3 flex flex-col items-end justify-end">
        <div className="w-px h-8 self-end" style={{ background: 'linear-gradient(0deg, rgba(37,214,149,0.5) 0%, transparent 100%)' }} />
        <div className="w-8 h-px" style={{ background: 'linear-gradient(270deg, rgba(37,214,149,0.5) 0%, transparent 100%)' }} />
      </div>

      {/* ── Top HUD label ── */}
      <div className="absolute top-4 left-4 right-28 flex items-center justify-center gap-2">
        <div className="w-12 h-px shrink-0" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(37,214,149,0.3) 100%)' }} />
        <span className="text-[9px] font-mono tracking-[0.25em] text-nexus-400/50 uppercase whitespace-nowrap truncate">
          nexus global water & energy network
        </span>
        <div className="w-12 h-px shrink-0" style={{ background: 'linear-gradient(270deg, transparent 0%, rgba(37,214,149,0.3) 100%)' }} />
      </div>

      {/* ── Projection mode badge — top right ── */}
      <div className="absolute top-4 right-5 flex items-center gap-2">
        {projection === 'orbital' && (
          <span className="text-[7px] font-mono text-blue-400/40 tracking-wider uppercase mr-1">
            SATELLITE VIEW · AUTO-ROTATE
          </span>
        )}
        {projection === 'lunar' && (
          <span className="text-[7px] font-mono text-blue-300/40 tracking-wider uppercase mr-1">
            LUNAR SURFACE · TRANQUILITY
          </span>
        )}
        <span
          className="text-[8px] font-mono tracking-[0.15em] uppercase px-2 py-0.5 rounded-sm"
          style={{
            color: projection === 'lunar' ? 'rgba(136,204,255,0.6)' :
                   projection === 'orbital' ? 'rgba(68,136,255,0.6)' :
                   'rgba(37,214,149,0.6)',
            border: `1px solid ${projection === 'lunar' ? 'rgba(136,204,255,0.15)' :
                   projection === 'orbital' ? 'rgba(68,136,255,0.15)' :
                   'rgba(37,214,149,0.15)'}`,
            background: projection === 'lunar' ? 'rgba(136,204,255,0.04)' :
                   projection === 'orbital' ? 'rgba(68,136,255,0.04)' :
                   'rgba(37,214,149,0.04)',
          }}
        >
          {projLabel}
        </span>
      </div>

      {/* ── Coordinate readout — bottom left ── */}
      <div className="absolute bottom-12 left-4 space-y-0.5">
        {selectedSite ? (
          <>
            <div className="text-[8px] font-mono text-nexus-400/40 tracking-wide uppercase">
              target locked
            </div>
            <div className="text-[10px] font-mono text-nexus-400/70 tabular-nums">
              {selectedSite.lat.toFixed(4)}°{selectedSite.lat >= 0 ? 'N' : 'S'}{' '}
              {Math.abs(selectedSite.lng).toFixed(4)}°{selectedSite.lng >= 0 ? 'E' : 'W'}
            </div>
            <div className="text-[9px] font-mono text-white/40 truncate max-w-[160px]">
              {selectedSite.name}
            </div>
          </>
        ) : (
          <div className="text-[8px] font-mono text-nexus-400/25 tracking-wide uppercase">
            select node for coordinates
          </div>
        )}
      </div>

      {/* ── Center reticle (pulsing) ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 opacity-20">
        {/* Crosshair lines */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-nexus-400/60" />
        <div className="absolute top-0 left-1/2 w-px h-full bg-nexus-400/60" />
        {/* Corner dots */}
        <div className="absolute top-0 left-0 w-1 h-1 rounded-full bg-nexus-400/40" />
        <div className="absolute top-0 right-0 w-1 h-1 rounded-full bg-nexus-400/40" />
        <div className="absolute bottom-0 left-0 w-1 h-1 rounded-full bg-nexus-400/40" />
        <div className="absolute bottom-0 right-0 w-1 h-1 rounded-full bg-nexus-400/40" />
      </div>

      {/* ── Bottom HUD — LIVE indicator ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
        <div className="w-10 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(37,214,149,0.2) 100%)' }} />
        <span className="text-[8px] font-mono text-nexus-400/40 tracking-widest uppercase">live</span>
        <div className="w-1.5 h-1.5 rounded-full bg-nexus-400/60 animate-pulse" />
        <div className="w-10 h-px" style={{ background: 'linear-gradient(270deg, transparent 0%, rgba(37,214,149,0.2) 100%)' }} />
      </div>

      {/* ── Subtle radial grid lines ── */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.03]"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <circle cx="50" cy="50" r="20" fill="none" stroke="#25D695" strokeWidth="0.15" />
        <circle cx="50" cy="50" r="35" fill="none" stroke="#25D695" strokeWidth="0.1" />
        <circle cx="50" cy="50" r="48" fill="none" stroke="#25D695" strokeWidth="0.08" />
      </svg>
    </div>
  );
}
