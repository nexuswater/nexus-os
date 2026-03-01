import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Globe, Wrench } from 'lucide-react';
import { Card, ProgressBar, Spinner } from '@/components/common';
import type { ImpactTotals, Installation } from '@nexus/shared';

interface RegionBreakdown {
  region_code: string;
  water_offset: number;
  energy_offset: number;
  installations: number;
}

interface TechBreakdown {
  technology_type: string;
  label: string;
  water_offset: number;
  energy_offset: number;
  installations: number;
}

const techLabels: Record<string, string> = {
  awg: 'Atmospheric Water Generator',
  greywater: 'Greywater Recycling',
  solar: 'Solar Energy',
  rainwater: 'Rainwater Harvesting',
  watersense: 'WaterSense Device',
  energy_star: 'ENERGY STAR Device',
};

function computeBreakdowns(installations: Installation[]) {
  const regionMap = new Map<string, RegionBreakdown>();
  const techMap = new Map<string, TechBreakdown>();

  // Mock water/energy contribution per installation based on daily metrics * ~365
  const waterMultiplier: Record<string, number> = {
    'inst-001': 1_420_000,
    'inst-002': 870_000,
    'inst-004': 557_000,
  };
  const energyMultiplier: Record<string, number> = {
    'inst-003': 1_560_000,
  };

  for (const inst of installations) {
    const waterOffset = waterMultiplier[inst.installation_id] ?? 0;
    const energyOffset = energyMultiplier[inst.installation_id] ?? 0;
    const region = inst.location.region_code;
    const tech = inst.technology_type;

    // Region
    const existing = regionMap.get(region);
    if (existing) {
      existing.water_offset += waterOffset;
      existing.energy_offset += energyOffset;
      existing.installations += 1;
    } else {
      regionMap.set(region, { region_code: region, water_offset: waterOffset, energy_offset: energyOffset, installations: 1 });
    }

    // Tech
    const existingTech = techMap.get(tech);
    if (existingTech) {
      existingTech.water_offset += waterOffset;
      existingTech.energy_offset += energyOffset;
      existingTech.installations += 1;
    } else {
      techMap.set(tech, {
        technology_type: tech,
        label: techLabels[tech] ?? tech,
        water_offset: waterOffset,
        energy_offset: energyOffset,
        installations: 1,
      });
    }
  }

  return {
    regions: Array.from(regionMap.values()).sort((a, b) => (b.water_offset + b.energy_offset) - (a.water_offset + a.energy_offset)),
    technologies: Array.from(techMap.values()).sort((a, b) => (b.water_offset + b.energy_offset) - (a.water_offset + a.energy_offset)),
  };
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toLocaleString();
}

export default function ImpactDashboard() {
  const [totals, setTotals] = useState<ImpactTotals | null>(null);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [totalsRes, installsRes] = await Promise.all([
          fetch('/api/impact/totals'),
          fetch('/api/installations'),
        ]);
        const totalsJson = await totalsRes.json();
        const installsJson = await installsRes.json();

        if (totalsJson.success) setTotals(totalsJson.data);
        if (installsJson.success) setInstallations(installsJson.data?.data ?? installsJson.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
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

  const { regions, technologies } = computeBreakdowns(installations);
  const totalWater = totals?.total_water_offset_gallons ?? 1;
  const totalEnergy = totals?.total_energy_offset_kwh ?? 1;

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link to="/impact" className="text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="page-title mb-0">Impact Dashboard</h1>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="stat-label">Total Water</div>
          <div className="stat-value text-water-400">{formatCompact(totals?.total_water_offset_gallons ?? 0)} gal</div>
        </div>
        <div className="card">
          <div className="stat-label">Total Energy</div>
          <div className="stat-value text-energy-400">{formatCompact(totals?.total_energy_offset_kwh ?? 0)} kWh</div>
        </div>
        <div className="card">
          <div className="stat-label">Installations</div>
          <div className="stat-value">{totals?.installations_count ?? 0}</div>
        </div>
        <div className="card">
          <div className="stat-label">Regions</div>
          <div className="stat-value">{totals?.regions_count ?? 0}</div>
        </div>
      </div>

      {/* By Region */}
      <Card header="By Region" icon={<Globe className="w-4 h-4" />} className="mb-4">
        <div className="space-y-4">
          {regions.map((r) => (
            <div key={r.region_code}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-medium text-white">{r.region_code}</span>
                  <span className="text-xs text-gray-500 ml-2">{r.installations} installation{r.installations !== 1 ? 's' : ''}</span>
                </div>
              </div>
              {r.water_offset > 0 && (
                <ProgressBar
                  value={r.water_offset / totalWater}
                  variant="water"
                  label={`Water: ${formatCompact(r.water_offset)} gal`}
                  showPercent
                  className="mb-2"
                />
              )}
              {r.energy_offset > 0 && (
                <ProgressBar
                  value={r.energy_offset / totalEnergy}
                  variant="energy"
                  label={`Energy: ${formatCompact(r.energy_offset)} kWh`}
                  showPercent
                />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* By Technology */}
      <Card header="By Technology" icon={<Wrench className="w-4 h-4" />}>
        <div className="space-y-4">
          {technologies.map((t) => {
            const combined = t.water_offset + t.energy_offset;
            const combinedTotal = totalWater + totalEnergy;
            const isEnergy = t.technology_type === 'solar' || t.technology_type === 'energy_star';
            return (
              <div key={t.technology_type}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium text-white">{t.label}</span>
                    <span className="text-xs text-gray-500 ml-2">{t.installations} installation{t.installations !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <ProgressBar
                  value={combined / combinedTotal}
                  variant={isEnergy ? 'energy' : 'water'}
                  label={
                    isEnergy
                      ? `${formatCompact(t.energy_offset)} kWh`
                      : `${formatCompact(t.water_offset)} gal`
                  }
                  showPercent
                />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
