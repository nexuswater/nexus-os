import { useState, useEffect, useCallback } from 'react';
import { Card, StatusBadge, Spinner, Button, Modal, EmptyState } from '@/components/common';
import type { IoTDevice, IoTReading } from '@nexus/shared';
import {
  Cpu, Plus, Droplets, Zap, Sun, Wind, Fuel, Recycle,
  Radio, Wifi, Settings, Activity, Shield, AlertTriangle,
  CheckCircle, MapPin, Clock, ChevronDown, Search, Filter,
  RefreshCw, X, Eye, BarChart3,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type DeviceType =
  | 'awg'
  | 'solar_farm'
  | 'hydrogen_generator'
  | 'greywater_recycling'
  | 'water_meter'
  | 'energy_meter'
  | 'other';

type DeviceStatus = 'VERIFIED' | 'UNVERIFIED' | 'FLAGGED';

type DataMethod = 'manual' | 'api' | 'mqtt' | 'lorawan' | 'webhook';

interface DeviceSummary {
  total: number;
  verified: number;
  unverified: number;
  flagged: number;
}

interface Device {
  id: string;
  type: DeviceType;
  nickname: string;
  manufacturer: string;
  model: string;
  serial: string;
  serialMasked: string;
  region: string;
  dataMethod: DataMethod;
  status: DeviceStatus;
  latestReading?: {
    value: number;
    unit: string;
    timestamp: string;
  };
  createdAt: string;
}

interface DeviceDetail extends Device {
  readings: Reading[];
  flags?: string[];
  verificationHistory?: {
    date: string;
    action: string;
    note: string;
  }[];
}

interface Reading {
  id: string;
  timestamp: string;
  value: number;
  unit: string;
  flags?: string[];
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const DEVICE_TYPE_OPTIONS: { value: DeviceType; label: string }[] = [
  { value: 'awg', label: 'AWG' },
  { value: 'solar_farm', label: 'Solar Farm' },
  { value: 'hydrogen_generator', label: 'Hydrogen Generator' },
  { value: 'greywater_recycling', label: 'Greywater Recycling' },
  { value: 'water_meter', label: 'Water Meter' },
  { value: 'energy_meter', label: 'Energy Meter' },
  { value: 'other', label: 'Other' },
];

const DATA_METHOD_OPTIONS: { value: DataMethod; label: string }[] = [
  { value: 'manual', label: 'Manual Entry' },
  { value: 'api', label: 'API' },
  { value: 'mqtt', label: 'MQTT' },
  { value: 'lorawan', label: 'LoRaWAN' },
  { value: 'webhook', label: 'Webhook' },
];

const STATUS_COLORS: Record<DeviceStatus, 'green' | 'gray' | 'red'> = {
  VERIFIED: 'green',
  UNVERIFIED: 'gray',
  FLAGGED: 'red',
};

const DATA_METHOD_LABELS: Record<DataMethod, string> = {
  manual: 'Manual',
  api: 'API',
  mqtt: 'MQTT',
  lorawan: 'LoRaWAN',
  webhook: 'Webhook',
};

const DATA_METHOD_COLORS: Record<DataMethod, string> = {
  manual: 'bg-gray-600/20 text-gray-400',
  api: 'bg-blue-600/20 text-blue-400',
  mqtt: 'bg-cyan-600/20 text-cyan-400',
  lorawan: 'bg-cyan-600/20 text-cyan-400',
  webhook: 'bg-orange-600/20 text-orange-400',
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function deviceTypeIcon(type: DeviceType, size = 18) {
  const cls = 'flex-shrink-0';
  switch (type) {
    case 'awg':
      return <Wind size={size} className={`text-cyan-400 ${cls}`} />;
    case 'solar_farm':
      return <Sun size={size} className={`text-yellow-400 ${cls}`} />;
    case 'hydrogen_generator':
      return <Fuel size={size} className={`text-emerald-400 ${cls}`} />;
    case 'greywater_recycling':
      return <Recycle size={size} className={`text-green-400 ${cls}`} />;
    case 'water_meter':
      return <Droplets size={size} className={`text-water-400 ${cls}`} />;
    case 'energy_meter':
      return <Zap size={size} className={`text-energy-400 ${cls}`} />;
    default:
      return <Cpu size={size} className={`text-gray-400 ${cls}`} />;
  }
}

function deviceTypeLabel(type: DeviceType): string {
  return DEVICE_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* -------------------------------------------------------------------------- */
/*  Inline Bar Chart                                                           */
/* -------------------------------------------------------------------------- */

function ReadingsBarChart({ readings }: { readings: Reading[] }) {
  const last5 = readings.slice(-5);
  if (last5.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-xs text-gray-600">
        No readings available
      </div>
    );
  }

  const maxVal = Math.max(...last5.map((r) => r.value), 1);
  const barWidth = 100 / last5.length;

  return (
    <div className="mb-4">
      <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-3">
        Last {last5.length} Readings
      </div>
      <svg
        viewBox="0 0 300 120"
        className="w-full h-32"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
          <line
            key={frac}
            x1="0"
            y1={100 - frac * 90}
            x2="300"
            y2={100 - frac * 90}
            stroke="#1f2937"
            strokeWidth="0.5"
          />
        ))}

        {/* Bars */}
        {last5.map((reading, i) => {
          const barH = (reading.value / maxVal) * 90;
          const x = i * (300 / last5.length) + (300 / last5.length) * 0.15;
          const w = (300 / last5.length) * 0.7;
          const y = 100 - barH;

          return (
            <g key={reading.id ?? i}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={w}
                height={barH}
                rx="3"
                fill="#25D695"
                opacity="0.8"
              />
              {/* Value label */}
              <text
                x={x + w / 2}
                y={y - 4}
                textAnchor="middle"
                className="text-[8px]"
                fill="#9ca3af"
              >
                {reading.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </text>
              {/* Date label */}
              <text
                x={x + w / 2}
                y={115}
                textAnchor="middle"
                className="text-[7px]"
                fill="#6b7280"
              >
                {formatShortDate(reading.timestamp)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Register Device Modal                                                      */
/* -------------------------------------------------------------------------- */

interface RegisterModalProps {
  open: boolean;
  onClose: () => void;
  onRegistered: () => void;
}

function RegisterDeviceModal({ open, onClose, onRegistered }: RegisterModalProps) {
  const [type, setType] = useState<DeviceType>('awg');
  const [nickname, setNickname] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [serial, setSerial] = useState('');
  const [region, setRegion] = useState('');
  const [dataMethod, setDataMethod] = useState<DataMethod>('manual');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setType('awg');
      setNickname('');
      setManufacturer('');
      setModel('');
      setSerial('');
      setRegion('');
      setDataMethod('manual');
      setSubmitting(false);
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  async function handleSubmit() {
    if (!nickname.trim() || !manufacturer.trim() || !serial.trim() || !region.trim()) {
      setError('All fields are required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/vault/iot/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          nickname: nickname.trim(),
          manufacturer: manufacturer.trim(),
          model: model.trim(),
          serial: serial.trim(),
          region: region.trim(),
          dataMethod,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to register device');
      setSuccess(true);
      onRegistered();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unexpected error');
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    'w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-nexus-500 focus:border-nexus-500 transition-colors';

  const selectCls =
    'w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-nexus-500 focus:border-nexus-500 transition-colors appearance-none';

  return (
    <Modal open={open} onClose={onClose} title="Register Device">
      {success ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-white mb-1">Device Registered</p>
          <p className="text-xs text-gray-500">
            Your device has been submitted for verification.
          </p>
          <Button variant="secondary" size="sm" className="mt-5" onClick={onClose}>
            Close
          </Button>
        </div>
      ) : (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Device Type */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Device Type</label>
            <div className="grid grid-cols-2 gap-2">
              {DEVICE_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors text-left ${
                    type === opt.value
                      ? 'border-nexus-500/60 bg-nexus-500/5'
                      : 'border-gray-800 hover:border-gray-700 bg-gray-800/30'
                  }`}
                >
                  {deviceTypeIcon(opt.value, 16)}
                  <span className="text-xs text-gray-300">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Device Nickname</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Roof Solar Array #1"
              className={inputCls}
            />
          </div>

          {/* Manufacturer + Model */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Manufacturer</label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. Siemens"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. SM-3200X"
                className={inputCls}
              />
            </div>
          </div>

          {/* Serial Number */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Serial Number</label>
            <input
              type="text"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              placeholder="Will be masked on display"
              className={inputCls}
            />
            <p className="text-[10px] text-gray-600 mt-1">
              Serial numbers are masked for security (e.g. SN-****3200)
            </p>
          </div>

          {/* Location Region */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Location Region</label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g. US-West, EU-Central, MENA"
              className={inputCls}
            />
          </div>

          {/* Data Method */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Data Ingestion Method</label>
            <div className="relative">
              <select
                value={dataMethod}
                onChange={(e) => setDataMethod(e.target.value as DataMethod)}
                className={selectCls}
              >
                {DATA_METHOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-950/30 border border-red-800/40">
              <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Submit */}
          <Button
            variant="primary"
            size="md"
            className="w-full"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Registering...
              </>
            ) : (
              <>
                <Plus size={14} className="mr-1.5" />
                Register Device
              </>
            )}
          </Button>
        </div>
      )}
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*  Device Detail Modal                                                        */
/* -------------------------------------------------------------------------- */

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  deviceId: string | null;
}

function DeviceDetailModal({ open, onClose, deviceId }: DetailModalProps) {
  const [detail, setDetail] = useState<DeviceDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  useEffect(() => {
    if (!open || !deviceId) {
      setDetail(null);
      setError(null);
      setRequesting(false);
      setRequestSuccess(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/vault/iot/devices/${deviceId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setDetail(json.data ?? json);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load device'))
      .finally(() => setLoading(false));
  }, [open, deviceId]);

  async function handleRequestVerification() {
    if (!deviceId) return;
    setRequesting(true);
    try {
      const res = await fetch(`/api/vault/iot/devices/${deviceId}/verify`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Request failed');
      setRequestSuccess(true);
    } catch {
      // silent
    } finally {
      setRequesting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Device Details">
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Spinner size="md" />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-950/30 border border-red-800/40">
          <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {detail && !loading && (
        <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center">
              {deviceTypeIcon(detail.type, 22)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white truncate">
                  {detail.nickname}
                </h3>
                <StatusBadge
                  status={detail.status}
                  color={STATUS_COLORS[detail.status]}
                />
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {detail.manufacturer} {detail.model}
              </p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-gray-800/40">
              <div className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">
                Type
              </div>
              <div className="text-sm text-white">{deviceTypeLabel(detail.type)}</div>
            </div>
            <div className="p-3 rounded-lg bg-gray-800/40">
              <div className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">
                Serial
              </div>
              <div className="text-sm text-white font-mono">{detail.serialMasked}</div>
            </div>
            <div className="p-3 rounded-lg bg-gray-800/40">
              <div className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">
                Region
              </div>
              <div className="flex items-center gap-1 text-sm text-white">
                <MapPin size={12} className="text-gray-500" />
                {detail.region}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-gray-800/40">
              <div className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">
                Data Method
              </div>
              <div className="text-sm text-white">
                {DATA_METHOD_LABELS[detail.dataMethod]}
              </div>
            </div>
          </div>

          {/* Readings Chart */}
          {detail.readings && detail.readings.length > 0 && (
            <ReadingsBarChart readings={detail.readings} />
          )}

          {/* Readings Table */}
          {detail.readings && detail.readings.length > 0 && (
            <div>
              <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">
                Readings Log
              </div>
              <div className="rounded-lg border border-gray-800 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-800/60">
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">
                        Timestamp
                      </th>
                      <th className="px-3 py-2 text-right text-gray-500 font-medium">
                        Value
                      </th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">
                        Unit
                      </th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">
                        Flags
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.readings.map((reading, idx) => (
                      <tr
                        key={reading.id ?? idx}
                        className="border-t border-gray-800/60 hover:bg-gray-800/30"
                      >
                        <td className="px-3 py-2 text-gray-400 font-mono">
                          {formatShortDate(reading.timestamp)}
                        </td>
                        <td className="px-3 py-2 text-right text-white font-medium tabular-nums">
                          {reading.value.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-3 py-2 text-gray-500">
                          {reading.unit}
                        </td>
                        <td className="px-3 py-2">
                          {reading.flags && reading.flags.length > 0 ? (
                            <div className="flex gap-1">
                              {reading.flags.map((flag, fi) => (
                                <span
                                  key={fi}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-500/10 text-[10px] text-red-400"
                                >
                                  {flag}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-700">--</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Flags Section */}
          {detail.flags && detail.flags.length > 0 && (
            <div className="p-3 rounded-lg bg-red-950/20 border border-red-800/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-red-400" />
                <span className="text-xs font-medium text-red-400">Active Flags</span>
              </div>
              <ul className="space-y-1">
                {detail.flags.map((flag, i) => (
                  <li key={i} className="text-xs text-red-300/80 flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">-</span>
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-3 border-t border-gray-800/60">
            {detail.status === 'UNVERIFIED' && (
              <Button
                variant="primary"
                size="sm"
                disabled={requesting || requestSuccess}
                onClick={handleRequestVerification}
              >
                {requestSuccess ? (
                  <>
                    <CheckCircle size={14} className="mr-1.5" />
                    Verification Requested
                  </>
                ) : requesting ? (
                  <>
                    <Spinner size="sm" className="mr-1.5" />
                    Requesting...
                  </>
                ) : (
                  <>
                    <Shield size={14} className="mr-1.5" />
                    Request Verification
                  </>
                )}
              </Button>
            )}

            {detail.status === 'FLAGGED' && (
              <Button variant="danger" size="sm">
                <Eye size={14} className="mr-1.5" />
                View Flags
              </Button>
            )}

            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

export default function IoTDevices() {
  /* ---- State ---- */
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<DeviceStatus | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<DeviceType | 'ALL'>('ALL');

  /* ---- Modals ---- */
  const [registerOpen, setRegisterOpen] = useState(false);
  const [detailDeviceId, setDetailDeviceId] = useState<string | null>(null);

  /* ---- Fetch ---- */
  const fetchDevices = useCallback(() => {
    setLoading(true);
    fetch('/api/vault/iot/devices')
      .then((r) => r.json())
      .then((json) => {
        setDevices(json.data ?? []);
      })
      .catch(() => {
        /* fail silently */
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  /* ---- Summary ---- */
  const summary: DeviceSummary = {
    total: devices.length,
    verified: devices.filter((d) => d.status === 'VERIFIED').length,
    unverified: devices.filter((d) => d.status === 'UNVERIFIED').length,
    flagged: devices.filter((d) => d.status === 'FLAGGED').length,
  };

  /* ---- Filtering ---- */
  const filtered = devices.filter((d) => {
    if (filterStatus !== 'ALL' && d.status !== filterStatus) return false;
    if (filterType !== 'ALL' && d.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches =
        d.nickname.toLowerCase().includes(q) ||
        d.manufacturer.toLowerCase().includes(q) ||
        d.model.toLowerCase().includes(q) ||
        d.region.toLowerCase().includes(q) ||
        d.serialMasked.toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });

  /* ---- Request Verification inline ---- */
  async function handleRequestVerification(deviceId: string) {
    try {
      const res = await fetch(`/api/vault/iot/devices/${deviceId}/verify`, {
        method: 'POST',
      });
      if (res.ok) fetchDevices();
    } catch {
      // silent
    }
  }

  /* ---- Loading ---- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  /* ---- Render ---- */
  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="page-title flex items-center gap-3 mb-0">
          <Cpu className="w-6 h-6 text-nexus-400" />
          IoT Devices
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={fetchDevices}>
            <RefreshCw size={14} className="mr-1.5" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setRegisterOpen(true)}>
            <Plus size={14} className="mr-1.5" />
            Register Device
          </Button>
        </div>
      </div>
      <p className="text-sm text-gray-400 mb-6">
        Manage IoT devices connected to the Nexus Data Vault
      </p>

      {/* ================================================================== */}
      {/*  Summary Cards                                                      */}
      {/* ================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card
          header="Total Devices"
          icon={<Cpu className="w-4 h-4 text-nexus-400" />}
        >
          <div className="stat-value text-white">{summary.total}</div>
          <div className="stat-label">Registered devices</div>
        </Card>

        <Card
          header="Verified"
          icon={<CheckCircle className="w-4 h-4 text-emerald-400" />}
        >
          <div className="stat-value text-emerald-400">{summary.verified}</div>
          <div className="stat-label">Passing integrity checks</div>
        </Card>

        <Card
          header="Unverified"
          icon={<Shield className="w-4 h-4 text-gray-400" />}
        >
          <div className="stat-value text-gray-400">{summary.unverified}</div>
          <div className="stat-label">Pending verification</div>
        </Card>

        <Card
          header="Flagged"
          icon={<AlertTriangle className="w-4 h-4 text-red-400" />}
        >
          <div className="stat-value text-red-400">{summary.flagged}</div>
          <div className="stat-label">Requires review</div>
        </Card>
      </div>

      {/* ================================================================== */}
      {/*  Filters                                                             */}
      {/* ================================================================== */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search devices..."
            className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-nexus-500 focus:border-nexus-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as DeviceStatus | 'ALL')}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-nexus-500 focus:border-nexus-500 appearance-none pr-8"
          >
            <option value="ALL">All Status</option>
            <option value="VERIFIED">Verified</option>
            <option value="UNVERIFIED">Unverified</option>
            <option value="FLAGGED">Flagged</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          />
        </div>

        {/* Type Filter */}
        <div className="relative">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as DeviceType | 'ALL')}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-nexus-500 focus:border-nexus-500 appearance-none pr-8"
          >
            <option value="ALL">All Types</option>
            {DEVICE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          />
        </div>

        {/* Results count */}
        <span className="text-xs text-gray-500">
          {filtered.length} of {devices.length} devices
        </span>
      </div>

      {/* ================================================================== */}
      {/*  Device List                                                         */}
      {/* ================================================================== */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Cpu size={32} />}
          title="No devices found"
          description={
            devices.length === 0
              ? 'Register your first IoT device to start building your data vault.'
              : 'Try adjusting your search or filter criteria.'
          }
          actionLabel={devices.length === 0 ? 'Register Device' : undefined}
          onAction={devices.length === 0 ? () => setRegisterOpen(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((device) => (
            <Card key={device.id} className="flex flex-col">
              {/* Device Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                  {deviceTypeIcon(device.type, 18)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white truncate">
                      {device.nickname}
                    </span>
                    <StatusBadge
                      status={device.status}
                      color={STATUS_COLORS[device.status]}
                    />
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {device.manufacturer} {device.model}
                  </p>
                </div>
              </div>

              {/* Info Row */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-0.5">
                    Serial
                  </div>
                  <div className="text-xs text-gray-400 font-mono">
                    {device.serialMasked}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-0.5">
                    Region
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin size={10} className="text-gray-600" />
                    {device.region}
                  </div>
                </div>
              </div>

              {/* Data Method Badge */}
              <div className="mb-3">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    DATA_METHOD_COLORS[device.dataMethod]
                  }`}
                >
                  <Radio size={10} />
                  {DATA_METHOD_LABELS[device.dataMethod]}
                </span>
              </div>

              {/* Latest Reading */}
              {device.latestReading && (
                <div className="p-2.5 rounded-lg bg-gray-800/40 mb-3">
                  <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">
                    Latest Reading
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-semibold text-nexus-400 tabular-nums">
                      {device.latestReading.value.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-xs text-gray-500">
                      {device.latestReading.unit}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock size={10} className="text-gray-600" />
                    <span className="text-[10px] text-gray-600">
                      {formatTimestamp(device.latestReading.timestamp)}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-auto pt-3 border-t border-gray-800/60">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setDetailDeviceId(device.id)}
                >
                  <Eye size={14} className="mr-1.5" />
                  Details
                </Button>

                {device.status === 'UNVERIFIED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleRequestVerification(device.id)}
                  >
                    <Shield size={14} className="mr-1.5" />
                    Request Verification
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ================================================================== */}
      {/*  Modals                                                              */}
      {/* ================================================================== */}
      <RegisterDeviceModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onRegistered={fetchDevices}
      />

      <DeviceDetailModal
        open={detailDeviceId !== null}
        onClose={() => setDetailDeviceId(null)}
        deviceId={detailDeviceId}
      />
    </div>
  );
}
