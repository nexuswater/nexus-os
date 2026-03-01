/**
 * SubjectsList — Grid of scored properties/facilities with score rings
 * and quick actions (view details, recalculate, certify).
 */

import { Link } from 'react-router-dom';
import { TerminalCard } from '@/components/terminal';
import { useNexusSubjects, useNexusLeaderboard } from '@/mock/useNexusStore';
import { TierBadge, ScoreRing, DomainIcon } from './index';
import { MapPin, ArrowRight, Building2, Home } from 'lucide-react';
import type { ScoreDomain } from '@nexus/shared';

export default function SubjectsList() {
  const subjects = useNexusSubjects();
  const leaderboard = useNexusLeaderboard();

  // Merge subject data with leaderboard scores
  const items = subjects.map(s => {
    const entry = leaderboard.find(e => e.subjectId === s.id);
    return { ...s, entry };
  }).sort((a, b) => (b.entry?.overallScore ?? 0) - (a.entry?.overallScore ?? 0));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 stagger-children">
      {items.map(item => (
        <Link
          key={item.id}
          to={`/scoring/${item.id}`}
          className="block interactive-card p-3 sm:p-4"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {item.kind === 'RESIDENTIAL'
                  ? <Home size={13} className="text-[#64748B] shrink-0" />
                  : <Building2 size={13} className="text-[#64748B] shrink-0" />
                }
                <h3 className="text-sm font-medium text-white truncate">{item.name}</h3>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[#475569]">
                <MapPin size={10} />
                <span>{item.address.city}, {item.address.state}</span>
                <span className="mx-1">|</span>
                <span>{item.kind.toLowerCase()}</span>
              </div>
            </div>
            {item.entry && (
              <ScoreRing
                score={item.entry.overallScore}
                size={56}
                tier={item.entry.tier}
              />
            )}
          </div>

          {/* Domain scores bar */}
          {item.entry && (
            <div className="grid grid-cols-4 gap-2 mb-3">
              {(['WATER', 'ENERGY', 'GOVERNANCE', 'RESILIENCE'] as ScoreDomain[]).map(domain => {
                const score = domain === 'WATER' ? item.entry!.waterScore
                  : domain === 'ENERGY' ? item.entry!.energyScore
                  : domain === 'GOVERNANCE' ? item.entry!.governanceScore
                  : item.entry!.resilienceScore;
                return (
                  <div key={domain} className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <DomainIcon domain={domain} size={10} />
                      <span className="text-[9px] text-[#475569] uppercase">{domain.slice(0, 3)}</span>
                    </div>
                    <div className="text-xs font-semibold text-white tabular-nums">{Math.round(score)}</div>
                    <div className="mt-0.5 h-1 rounded-full bg-[#1C2432] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${score}%`,
                          background: domain === 'WATER' ? '#38bdf8'
                            : domain === 'ENERGY' ? '#fbbf24'
                            : domain === 'GOVERNANCE' ? '#25D695'
                            : '#fb7185',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between">
            {item.entry ? (
              <TierBadge tier={item.entry.tier} />
            ) : (
              <span className="text-[10px] text-[#475569]">Not scored yet</span>
            )}
            <div className="flex items-center gap-1 text-[11px] text-[#25D695]">
              View Details <ArrowRight size={11} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
