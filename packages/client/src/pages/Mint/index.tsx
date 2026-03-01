import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, Spinner } from '@/components/common';
import { useWallet } from '@/hooks';
import { MINTING_LABELS } from '@nexus/shared';
import {
  Settings2,
  FileCheck2,
  ShieldCheck,
  Coins,
  ChevronRight,
} from 'lucide-react';
import type { Installation, ProofPackage } from '@nexus/shared';

const STEP_ICONS = [Settings2, FileCheck2, ShieldCheck, Coins];

export default function Mint() {
  const { session } = useWallet();
  const canMint = session?.wallet.eligibility.mint_enabled ?? false;

  const [installations, setInstallations] = useState<Installation[]>([]);
  const [proofs, setProofs] = useState<ProofPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/installations').then((r) => r.json()),
      fetch('/api/proofs').then((r) => r.json()),
    ]).then(([instRes, proofRes]) => {
      setInstallations(instRes.data ?? []);
      setProofs(proofRes.data ?? []);
      setLoading(false);
    });
  }, []);

  const pendingProofs = proofs.filter((p) => p.status === 'pending');
  const approvedProofs = proofs.filter((p) => p.status === 'approved');

  const steps = [
    {
      step: 1,
      title: MINTING_LABELS.step_names[0],
      description: 'Register a new water/energy installation with device and location data.',
      link: '/mint/installation/new',
      count: installations.length,
      countLabel: 'installations',
    },
    {
      step: 2,
      title: MINTING_LABELS.step_names[1],
      description: 'Upload IoT readings, utility bills, and verification documents.',
      link: '/mint/proof/submit',
      count: pendingProofs.length,
      countLabel: 'pending',
    },
    {
      step: 3,
      title: MINTING_LABELS.step_names[2],
      description: 'Oracle/auditor review of submitted proof packages.',
      link: '/mint/review',
      count: proofs.length,
      countLabel: 'total proofs',
    },
    {
      step: 4,
      title: MINTING_LABELS.step_names[3],
      description: 'Create a new $WTR or $ENG MPT batch from approved proofs.',
      link: '/mint/batch/create',
      count: approvedProofs.length,
      countLabel: 'ready to mint',
    },
  ];

  return (
    <div>
      <h1 className="page-title">{MINTING_LABELS.header}</h1>
      <p className="text-sm text-gray-400 mb-6">{MINTING_LABELS.disclaimer}</p>

      {!canMint && (
        <Card className="mb-6 border-yellow-600/30">
          <p className="text-sm text-yellow-400">
            Minting is restricted to verified installers and partners.
          </p>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="md" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map(({ step, title, description, link, count, countLabel }) => {
            const Icon = STEP_ICONS[step - 1];
            const disabled = !canMint;
            const Wrapper = disabled ? 'div' : Link;
            return (
              <Wrapper
                key={step}
                to={disabled ? undefined! : link}
                className={`card flex flex-col gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-700 transition-colors'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-nexus-600/20 text-nexus-400 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-white">
                        Step {step}: {title}
                      </div>
                    </div>
                  </div>
                  {!disabled && (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
                <div className="flex items-center gap-2 mt-auto">
                  <Badge color={count > 0 ? 'blue' : 'gray'}>
                    {count} {countLabel}
                  </Badge>
                </div>
              </Wrapper>
            );
          })}
        </div>
      )}
    </div>
  );
}
