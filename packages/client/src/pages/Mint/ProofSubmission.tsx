import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge, Spinner } from '@/components/common';
import { FileCheck2, CheckCircle2 } from 'lucide-react';
import type { Installation, ProofSourceType } from '@nexus/shared';

const SOURCE_TYPE_OPTIONS: { value: ProofSourceType; label: string }[] = [
  { value: 'iot_meter', label: 'IoT Meter' },
  { value: 'utility_bill', label: 'Utility Bill' },
  { value: 'lab_test', label: 'Lab Test' },
  { value: 'third_party_certificate', label: 'Third-Party Certificate' },
  { value: 'watersense_report', label: 'WaterSense Report' },
  { value: 'energy_star_report', label: 'ENERGY STAR Report' },
];

const inputClass =
  'w-full bg-gray-800/60 border border-gray-700/60 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-nexus-500/50 focus:border-nexus-500/50 transition-colors';
const labelClass = 'block text-xs font-medium text-gray-400 mb-1.5';

export default function ProofSubmission() {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);

  const [installationId, setInstallationId] = useState('');
  const [sourceTypes, setSourceTypes] = useState<Set<ProofSourceType>>(new Set());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summary, setSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ proof_id: string } | null>(null);

  useEffect(() => {
    fetch('/api/installations')
      .then((r) => r.json())
      .then((res) => {
        const list = res.data ?? [];
        setInstallations(list);
        if (list.length > 0) setInstallationId(list[0].installation_id);
        setLoading(false);
      });
  }, []);

  const toggleSource = (src: ProofSourceType) => {
    setSourceTypes((prev) => {
      const next = new Set(prev);
      if (next.has(src)) next.delete(src);
      else next.add(src);
      return next;
    });
  };

  const canSubmit =
    installationId !== '' &&
    sourceTypes.size > 0 &&
    startDate !== '' &&
    endDate !== '' &&
    summary.trim() !== '';

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const body = {
        installation_id: installationId,
        source_types: Array.from(sourceTypes),
        time_window: { start: new Date(startDate).toISOString(), end: new Date(endDate).toISOString() },
        raw_readings_summary: summary.trim(),
        document_hashes: [],
        signatures: {},
      };
      const res = await fetch('/api/proofs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
        <Link to="/mint" className="hover:text-gray-300 transition-colors">
          Mint
        </Link>
        <span>/</span>
        <span className="text-gray-400">Step 2: Submit Proof</span>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <FileCheck2 className="w-5 h-5 text-nexus-400" />
        <h1 className="page-title mb-0">Submit Proof Package</h1>
      </div>

      {result ? (
        <Card className="max-w-lg">
          <div className="flex flex-col items-center text-center py-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">Proof Submitted</h2>
            <p className="text-sm text-gray-400 mb-4">
              Your proof package has been submitted for oracle review.
            </p>
            <div className="bg-gray-800/50 rounded-lg px-4 py-3 mb-6 w-full">
              <div className="text-xs text-gray-500 mb-1">Proof ID</div>
              <div className="font-mono text-sm text-nexus-400">{result.proof_id}</div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/mint/review">
                <Button>View Review Queue</Button>
              </Link>
              <Link to="/mint">
                <Button variant="ghost">Back to Mint</Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="max-w-lg">
          <div className="space-y-5">
            {/* Installation select */}
            <div>
              <label className={labelClass}>Installation</label>
              <select
                className={inputClass}
                value={installationId}
                onChange={(e) => setInstallationId(e.target.value)}
              >
                {installations.map((inst) => (
                  <option key={inst.installation_id} value={inst.installation_id}>
                    {inst.friendly_name ?? inst.installation_id} ({inst.technology_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Source types */}
            <div>
              <label className={labelClass}>Source Types</label>
              <div className="grid grid-cols-2 gap-2">
                {SOURCE_TYPE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                      sourceTypes.has(opt.value)
                        ? 'border-nexus-500/50 bg-nexus-600/10 text-nexus-400'
                        : 'border-gray-700/60 bg-gray-800/40 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={sourceTypes.has(opt.value)}
                      onChange={() => toggleSource(opt.value)}
                    />
                    <div
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                        sourceTypes.has(opt.value)
                          ? 'bg-nexus-600 border-nexus-500'
                          : 'border-gray-600 bg-transparent'
                      }`}
                    >
                      {sourceTypes.has(opt.value) && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Time window */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Start Date</label>
                <input
                  type="date"
                  className={inputClass}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>End Date</label>
                <input
                  type="date"
                  className={inputClass}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Summary */}
            <div>
              <label className={labelClass}>Raw Readings Summary</label>
              <textarea
                className={`${inputClass} min-h-[80px] resize-y`}
                placeholder="e.g. 4,260 gallons offset over 30 days via AWG"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>

            {/* Selected preview */}
            {sourceTypes.size > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {Array.from(sourceTypes).map((s) => (
                  <Badge key={s} color="blue">
                    {SOURCE_TYPE_OPTIONS.find((o) => o.value === s)?.label}
                  </Badge>
                ))}
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="w-full"
            >
              {submitting ? 'Submitting...' : 'Submit Proof'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
