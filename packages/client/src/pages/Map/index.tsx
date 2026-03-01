import { useEffect, useState } from 'react';
import { MapPin, Cpu, Globe, Navigation } from 'lucide-react';
import { Card, StatusBadge, Badge, Spinner } from '@/components/common';
import type { Installation } from '@nexus/shared';

interface RegionGroup {
  region_code: string;
  country_code: string;
  installations: Installation[];
  technologies: Set<string>;
  coarse_lat: number | null;
  coarse_lng: number | null;
}

const techLabels: Record<string, string> = {
  awg: 'AWG',
  greywater: 'Greywater',
  solar: 'Solar',
  rainwater: 'Rainwater',
  watersense: 'WaterSense',
  energy_star: 'ENERGY STAR',
};

export default function MapPage() {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/installations');
        const json = await res.json();
        if (json.success) {
          setInstallations(json.data?.data ?? json.data);
        }
      } catch (err) {
        console.error('Failed to load installations:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  // Group by region
  const regionMap = new Map<string, RegionGroup>();
  for (const inst of installations) {
    const key = inst.location.region_code;
    const existing = regionMap.get(key);
    if (existing) {
      existing.installations.push(inst);
      existing.technologies.add(inst.technology_type);
      if (!existing.coarse_lat && inst.location.coarse_lat) {
        existing.coarse_lat = inst.location.coarse_lat;
        existing.coarse_lng = inst.location.coarse_lng ?? null;
      }
    } else {
      regionMap.set(key, {
        region_code: key,
        country_code: inst.location.country_code,
        installations: [inst],
        technologies: new Set([inst.technology_type]),
        coarse_lat: inst.location.coarse_lat ?? null,
        coarse_lng: inst.location.coarse_lng ?? null,
      });
    }
  }

  const regions = Array.from(regionMap.values()).sort((a, b) =>
    b.installations.length - a.installations.length,
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Globe className="w-5 h-5 text-nexus-400" />
        <h1 className="page-title mb-0">Installation Map</h1>
      </div>
      <p className="text-sm text-gray-500 mb-8">
        {installations.length} installation{installations.length !== 1 ? 's' : ''} across {regions.length} region{regions.length !== 1 ? 's' : ''}
      </p>

      {/* Region Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {regions.map((region) => {
          const approvedCount = region.installations.filter((i) => i.audit_status === 'approved').length;
          const pendingCount = region.installations.filter((i) => i.audit_status === 'pending' || i.audit_status === 'in_review').length;

          return (
            <Card key={region.region_code} className="relative overflow-hidden">
              {/* Subtle background accent */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-nexus-500/5 rounded-full -translate-y-8 translate-x-8" />

              <div className="relative">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-nexus-400" />
                      <span className="text-lg font-semibold text-white">{region.region_code}</span>
                      <span className="text-xs text-gray-500">{region.country_code}</span>
                    </div>
                    {region.coarse_lat !== null && region.coarse_lng !== null && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 font-mono">
                        <Navigation className="w-3 h-3" />
                        {region.coarse_lat.toFixed(2)}, {region.coarse_lng!.toFixed(2)}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-semibold text-white tabular-nums">
                      {region.installations.length}
                    </div>
                    <div className="text-xs text-gray-500">
                      installation{region.installations.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Technology types */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {Array.from(region.technologies).map((tech) => {
                    const isEnergy = tech === 'solar' || tech === 'energy_star';
                    return (
                      <Badge key={tech} color={isEnergy ? 'energy' : 'water'}>
                        {techLabels[tech] ?? tech}
                      </Badge>
                    );
                  })}
                </div>

                {/* Status summary */}
                <div className="flex items-center gap-4 text-xs">
                  {approvedCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-gray-400">{approvedCount} approved</span>
                    </div>
                  )}
                  {pendingCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="text-gray-400">{pendingCount} in review</span>
                    </div>
                  )}
                </div>

                {/* Installation list */}
                <div className="mt-4 pt-3 border-t border-gray-800/60 space-y-2">
                  {region.installations.map((inst) => (
                    <div
                      key={inst.installation_id}
                      className="flex items-center justify-between py-1.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Cpu className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                        <span className="text-sm text-gray-300 truncate">
                          {inst.friendly_name ?? inst.installation_id}
                        </span>
                      </div>
                      <StatusBadge status={inst.audit_status} />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      <Card header="Legend">
        <div className="grid grid-cols-2 gap-3 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-water-500" />
            Water installations (AWG, Greywater, Rainwater)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-energy-500" />
            Energy installations (Solar, ENERGY STAR)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Approved status
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending / In Review
          </div>
        </div>
      </Card>
    </div>
  );
}
