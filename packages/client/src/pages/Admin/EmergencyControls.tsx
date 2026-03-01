import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Pause, Lock, FileX } from 'lucide-react';
import { Card, Button } from '@/components/common';

interface EmergencyToggle {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const controls: EmergencyToggle[] = [
  {
    id: 'pause_minting',
    label: 'Pause Minting',
    description: 'Halt all new batch creation. Existing batches remain unaffected. Retirement schedules continue.',
    icon: <Pause className="w-5 h-5" />,
  },
  {
    id: 'freeze_marketplace',
    label: 'Freeze Marketplace',
    description: 'Suspend all trading activity. Active listings will be frozen. No new listings or trades allowed.',
    icon: <Lock className="w-5 h-5" />,
  },
  {
    id: 'pause_proposals',
    label: 'Pause Proposals',
    description: 'Prevent new proposal creation and pause active voting. Executed proposals remain unaffected.',
    icon: <FileX className="w-5 h-5" />,
  },
];

export default function EmergencyControls() {
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({
    pause_minting: false,
    freeze_marketplace: false,
    pause_proposals: false,
  });
  const [confirming, setConfirming] = useState<string | null>(null);

  function handleToggleClick(id: string) {
    if (toggleStates[id]) {
      // Turning off: immediate, no confirmation needed
      setToggleStates((prev) => ({ ...prev, [id]: false }));
      setConfirming(null);
    } else {
      // Turning on: require confirmation
      setConfirming(id);
    }
  }

  function handleConfirm(id: string) {
    setToggleStates((prev) => ({ ...prev, [id]: true }));
    setConfirming(null);
  }

  function handleCancel() {
    setConfirming(null);
  }

  const activeCount = Object.values(toggleStates).filter(Boolean).length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link to="/admin" className="text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="page-title mb-0">Emergency Controls</h1>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20 mb-6">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-medium text-red-400">Council Authorization Required</div>
          <div className="text-xs text-gray-400 mt-0.5">
            These actions have immediate effect on the protocol. Toggle on to activate, toggle off to deactivate.
          </div>
        </div>
      </div>

      {/* Toggle Controls */}
      <div className="space-y-4 mb-8">
        {controls.map((ctrl) => {
          const isOn = toggleStates[ctrl.id];
          const isConfirming = confirming === ctrl.id;

          return (
            <Card key={ctrl.id} className={isOn ? 'border-red-500/30' : ''}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl ${isOn ? 'bg-red-500/10 text-red-400' : 'bg-gray-700/50 text-gray-500'}`}>
                    {ctrl.icon}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{ctrl.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5 max-w-md">
                      {ctrl.description}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleClick(ctrl.id)}
                  className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${
                    isOn ? 'bg-red-500' : 'bg-gray-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                      isOn ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Confirmation step */}
              {isConfirming && (
                <div className="mt-4 pt-3 border-t border-gray-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-amber-400">
                      Are you sure you want to activate {ctrl.label.toLowerCase()}?
                    </span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={handleCancel}>
                        Cancel
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleConfirm(ctrl.id)}>
                        Confirm Activation
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Active States Summary */}
      <Card header="Active Emergency States">
        {activeCount === 0 ? (
          <p className="text-sm text-emerald-400/80">No emergency states active. All systems operational.</p>
        ) : (
          <div className="space-y-2">
            {controls.filter((c) => toggleStates[c.id]).map((c) => (
              <div key={c.id} className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400">{c.label}</span>
                <span className="text-xs text-gray-500">-- active</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
