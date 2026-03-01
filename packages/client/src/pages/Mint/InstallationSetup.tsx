import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge } from '@/components/common';
import { ArrowLeft, Settings2, CheckCircle2 } from 'lucide-react';
import type { TechnologyType } from '@nexus/shared';

const TECH_OPTIONS: { value: TechnologyType; label: string }[] = [
  { value: 'awg', label: 'Atmospheric Water Generator' },
  { value: 'greywater', label: 'Greywater Recycling' },
  { value: 'rainwater', label: 'Rainwater Harvesting' },
  { value: 'watersense', label: 'WaterSense Certified' },
  { value: 'solar', label: 'Solar Energy' },
  { value: 'energy_star', label: 'ENERGY STAR Device' },
];

interface FormState {
  friendly_name: string;
  technology_type: TechnologyType;
  region_code: string;
  country_code: string;
  device_ids: string;
}

const inputClass =
  'w-full bg-gray-800/60 border border-gray-700/60 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-nexus-500/50 focus:border-nexus-500/50 transition-colors';
const labelClass = 'block text-xs font-medium text-gray-400 mb-1.5';

export default function InstallationSetup() {
  const [form, setForm] = useState<FormState>({
    friendly_name: '',
    technology_type: 'awg',
    region_code: '',
    country_code: 'US',
    device_ids: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ installation_id: string } | null>(null);

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const canSubmit =
    form.friendly_name.trim() !== '' &&
    form.region_code.trim() !== '' &&
    form.device_ids.trim() !== '';

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const body = {
        friendly_name: form.friendly_name.trim(),
        technology_type: form.technology_type,
        location: {
          region_code: form.region_code.trim(),
          country_code: form.country_code.trim() || 'US',
        },
        device_ids: form.device_ids
          .split(',')
          .map((d) => d.trim())
          .filter(Boolean),
      };
      const res = await fetch('/api/installations', {
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

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
        <Link to="/mint" className="hover:text-gray-300 transition-colors">
          Mint
        </Link>
        <span>/</span>
        <span className="text-gray-400">Step 1: Installation Setup</span>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Settings2 className="w-5 h-5 text-nexus-400" />
        <h1 className="page-title mb-0">New Installation</h1>
      </div>

      {result ? (
        /* Success State */
        <Card className="max-w-lg">
          <div className="flex flex-col items-center text-center py-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">Installation Registered</h2>
            <p className="text-sm text-gray-400 mb-4">
              Your installation has been created and is ready for proof submission.
            </p>
            <div className="bg-gray-800/50 rounded-lg px-4 py-3 mb-6 w-full">
              <div className="text-xs text-gray-500 mb-1">Installation ID</div>
              <div className="font-mono text-sm text-nexus-400">{result.installation_id}</div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/mint/proof/submit">
                <Button>Continue to Proof Submission</Button>
              </Link>
              <Link to="/mint">
                <Button variant="ghost">Back to Mint</Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        /* Form */
        <Card className="max-w-lg">
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Friendly Name</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g. Phoenix AWG Alpha"
                value={form.friendly_name}
                onChange={set('friendly_name')}
              />
            </div>

            <div>
              <label className={labelClass}>Technology Type</label>
              <select
                className={inputClass}
                value={form.technology_type}
                onChange={set('technology_type')}
              >
                {TECH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Region Code</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. US-AZ"
                  value={form.region_code}
                  onChange={set('region_code')}
                />
              </div>
              <div>
                <label className={labelClass}>Country Code</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="US"
                  value={form.country_code}
                  onChange={set('country_code')}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Device IDs</label>
              <input
                type="text"
                className={inputClass}
                placeholder="AWG-PX-001, AWG-PX-002"
                value={form.device_ids}
                onChange={set('device_ids')}
              />
              <p className="text-[11px] text-gray-600 mt-1">Comma-separated list of device identifiers</p>
            </div>

            {/* Preview */}
            {form.friendly_name && (
              <div className="bg-gray-800/40 rounded-lg px-4 py-3 border border-gray-800/60">
                <div className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">Preview</div>
                <div className="text-sm text-white font-medium">{form.friendly_name}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge color="blue">
                    {TECH_OPTIONS.find((o) => o.value === form.technology_type)?.label}
                  </Badge>
                  {form.region_code && <Badge color="gray">{form.region_code}</Badge>}
                </div>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="w-full"
            >
              {submitting ? 'Registering...' : 'Register Installation'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
