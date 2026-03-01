import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge, StatusBadge } from '@/components/common';
import type { ProposalType } from '@nexus/shared';
import { ArrowLeft, Check, FileText } from 'lucide-react';

const PROPOSAL_TYPES: ProposalType[] = [
  'policy',
  'treasury',
  'mint_parameters',
  'marketplace_listing',
  'council_admin',
  'emergency',
  'grants',
  'redemption_rate',
];

const TYPE_LABELS: Record<ProposalType, string> = {
  policy: 'Policy Change',
  treasury: 'Treasury Action',
  mint_parameters: 'Mint Parameters',
  marketplace_listing: 'Marketplace Listing',
  council_admin: 'Council Admin',
  emergency: 'Emergency',
  grants: 'Grants',
  redemption_rate: 'Redemption Rate',
};

export default function CreateProposal() {
  const [type, setType] = useState<ProposalType>('policy');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div>
        <Link to="/dao/proposals" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-4">
          <ArrowLeft size={14} />
          Back to Proposals
        </Link>

        <Card className="max-w-lg mx-auto">
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">Proposal Submitted</h2>
            <p className="text-sm text-gray-400 mb-4">
              Your proposal has been created and is now in draft status.
            </p>
            <div className="bg-gray-800/50 rounded-lg p-3 text-left mb-4">
              <div className="text-xs text-gray-500 mb-1">Title</div>
              <div className="text-sm text-white">{title}</div>
              <div className="text-xs text-gray-500 mt-2 mb-1">Type</div>
              <div className="text-sm text-white">{TYPE_LABELS[type]}</div>
            </div>
            <Link to="/dao/proposals">
              <Button variant="primary">View All Proposals</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Link to="/dao/proposals" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-4">
        <ArrowLeft size={14} />
        Back to Proposals
      </Link>

      <h1 className="page-title">Create Proposal</h1>
      <p className="text-sm text-gray-400 mb-6">
        Draft a new governance proposal for DAO consideration.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card header="Proposal Details">
            {/* Type */}
            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-1.5">Proposal Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as ProposalType)}
                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-nexus-500 focus:border-nexus-500"
              >
                {PROPOSAL_TYPES.map(t => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="A clear, concise proposal title"
                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-nexus-500 focus:border-nexus-500 placeholder:text-gray-600"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the proposal, its rationale, and expected impact..."
                rows={6}
                className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-nexus-500 focus:border-nexus-500 placeholder:text-gray-600 resize-none"
              />
            </div>
          </Card>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!title.trim() || !description.trim()}
          >
            Submit Proposal
          </Button>
        </form>

        {/* Preview */}
        <div>
          <Card header="Preview">
            {!title.trim() && !description.trim() ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText size={28} className="text-gray-700 mb-2" />
                <p className="text-sm text-gray-500">Start typing to see a preview.</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <StatusBadge status="draft" />
                  <Badge color="blue">{TYPE_LABELS[type]}</Badge>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  {title || 'Untitled Proposal'}
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {description || 'No description provided.'}
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
