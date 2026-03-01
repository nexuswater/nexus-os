/**
 * ProductMarketplace — Browse products that can improve your Nexus Score.
 * Filterable by domain, category, and price range.
 */

import { useState } from 'react';
import { TerminalCard } from '@/components/terminal';
import { Select } from '@/components/common';
import { useNexusScoringProducts } from '@/mock/useNexusStore';
import { DomainIcon } from './index';
import {
  ShoppingBag, Star, Wrench, ArrowUpRight,
  Droplets, Zap, Shield, Heart,
} from 'lucide-react';
import type { ScoreDomain, ProductCategory } from '@nexus/shared';

const DOMAIN_OPTIONS = [
  { value: '', label: 'All Domains' },
  { value: 'WATER', label: 'Water' },
  { value: 'ENERGY', label: 'Energy' },
  { value: 'GOVERNANCE', label: 'Governance' },
  { value: 'RESILIENCE', label: 'Resilience' },
];

const CAT_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'SOLAR', label: 'Solar' },
  { value: 'BATTERY', label: 'Battery' },
  { value: 'WATER_FILTER', label: 'Water Filter' },
  { value: 'AWG', label: 'AWG' },
  { value: 'SMART_METER', label: 'Smart Meter' },
  { value: 'INSULATION', label: 'Insulation' },
  { value: 'HVAC', label: 'HVAC' },
];

const DIFFICULTY_BADGE: Record<string, string> = {
  easy: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  moderate: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  professional: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
};

export default function ProductMarketplace() {
  const products = useNexusScoringProducts();
  const [domainFilter, setDomainFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');

  const filtered = products.filter(p => {
    if (domainFilter && !p.domains.includes(domainFilter as ScoreDomain)) return false;
    if (catFilter && p.category !== catFilter) return false;
    return true;
  });

  return (
    <div>
      {/* Filters */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-5">
        <div className="sm:w-40">
          <Select
            value={domainFilter}
            onChange={setDomainFilter}
            options={DOMAIN_OPTIONS}
            placeholder="All Domains"
          />
        </div>
        <div className="sm:w-44">
          <Select
            value={catFilter}
            onChange={setCatFilter}
            options={CAT_OPTIONS}
            placeholder="All Categories"
          />
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 stagger-children">
        {filtered.map(product => (
          <div key={product.id} className="interactive-card p-3 sm:p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white mb-1">{product.name}</h3>
                <div className="flex items-center gap-2 text-[10px] text-[#475569]">
                  <span className="uppercase">{product.category.replace('_', ' ')}</span>
                  <span>|</span>
                  <span>{product.manufacturer}</span>
                </div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <div className="text-lg font-bold text-white tabular-nums">${product.priceUSD.toLocaleString()}</div>
                <div className="text-[9px] text-[#475569]">{product.currency}</div>
              </div>
            </div>

            {/* Description */}
            <p className="text-[11px] text-[#94A3B8] mb-3 line-clamp-2">{product.description}</p>

            {/* Score Impact & Domain */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#25D695]/10 border border-[#25D695]/20">
                <ArrowUpRight size={10} className="text-[#25D695]" />
                <span className="text-[10px] font-semibold text-[#25D695]">+{product.estimatedScoreImpact} pts</span>
              </div>
              {product.domains.map(d => (
                <div key={d} className="flex items-center gap-1">
                  <DomainIcon domain={d} size={12} />
                  <span className="text-[10px] text-[#475569]">{d}</span>
                </div>
              ))}
            </div>

            {/* Savings & Certifications */}
            <div className="flex items-center gap-3 mb-3 text-[10px] text-[#64748B]">
              {product.energySavingsKwh && (
                <span className="flex items-center gap-1">
                  <Zap size={10} className="text-amber-400" />
                  {product.energySavingsKwh.toLocaleString()} kWh/yr
                </span>
              )}
              {product.waterSavingsGal && (
                <span className="flex items-center gap-1">
                  <Droplets size={10} className="text-blue-400" />
                  {product.waterSavingsGal.toLocaleString()} gal/yr
                </span>
              )}
            </div>

            {/* Bottom Row */}
            <div className="flex items-center justify-between pt-2 border-t border-[#1C2432]/50">
              <div className="flex items-center gap-2">
                {/* Rating */}
                <div className="flex items-center gap-0.5">
                  <Star size={10} className="text-amber-400 fill-amber-400" />
                  <span className="text-[10px] text-white font-medium">{product.rating}</span>
                  <span className="text-[10px] text-[#475569]">({product.reviewCount})</span>
                </div>
                {/* Difficulty */}
                <span className={`px-1.5 py-0.5 text-[9px] font-medium uppercase rounded border ${DIFFICULTY_BADGE[product.installationDifficulty]}`}>
                  <Wrench size={8} className="inline mr-0.5" />
                  {product.installationDifficulty}
                </span>
              </div>
              {/* Certifications */}
              <div className="flex items-center gap-1">
                {product.certifications.slice(0, 2).map(c => (
                  <span key={c} className="text-[8px] text-[#475569] bg-[#0D1117] px-1.5 py-0.5 rounded">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <ShoppingBag size={32} className="mx-auto text-[#475569] mb-3" />
          <p className="text-sm text-[#475569]">No products match the current filters.</p>
        </div>
      )}
    </div>
  );
}
