import { useState } from 'react';
import { Card } from '@/components/common';
import { NEXUS_CHAINS, type NexusChainConfig } from '@nexus/shared';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { Globe, Plus, ExternalLink, Shield, Wifi } from 'lucide-react';

export default function Networks() {
  const chains = Object.values(NEXUS_CHAINS);
  const [registerForm, setRegisterForm] = useState({ chainName: '', mirrorAddress: '' });
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div>
      <h1 className="page-title">Network Registry</h1>
      <p className="text-sm text-gray-400 mb-6">
        Multi-chain governance network configuration. Hub receives vote deltas from all spokes via Axelar GMP.
      </p>

      {/* Hub Banner */}
      <Card className="mb-6 border-nexus-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-nexus-500/20 flex items-center justify-center">
              <Shield size={20} className="text-nexus-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">Governance Hub</div>
              <div className="text-xs text-gray-400">
                Canonical state, unified tallies, proposal execution
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-nexus-400">Base</div>
            <div className="text-xs text-gray-500">Chain ID: 8453</div>
          </div>
        </div>
      </Card>

      {/* Chain List */}
      <div className="space-y-3 mb-6">
        {chains.map(chain => {
          const addresses = CONTRACT_ADDRESSES[chain.id];
          const isDeployed = addresses && addresses.governance !== '0x0000000000000000000000000000000000000000';

          return (
            <Card key={chain.id} className="hover:border-gray-700 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    chain.role === 'hub' ? 'bg-nexus-500/20' : 'bg-gray-800'
                  }`}>
                    {chain.role === 'hub' ? (
                      <Shield size={16} className="text-nexus-400" />
                    ) : (
                      <Wifi size={16} className="text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{chain.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wider ${
                        chain.role === 'hub'
                          ? 'bg-nexus-500/20 text-nexus-400'
                          : 'bg-gray-800 text-gray-400'
                      }`}>
                        {chain.role}
                      </span>
                      {chain.active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="Active" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Chain ID: {chain.chainId} &middot; Axelar: {chain.axelarName} &middot; Gas: {chain.gasToken}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">
                      {isDeployed ? 'Deployed' : 'Not deployed'}
                    </div>
                    <div className="text-[10px] text-gray-600 font-mono">
                      {addresses?.governance.slice(0, 10)}...
                    </div>
                  </div>
                  <a
                    href={chain.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <ExternalLink size={14} className="text-gray-500" />
                  </a>
                </div>
              </div>

              {/* RPC Info */}
              <div className="mt-3 pt-3 border-t border-gray-800/50">
                <div className="flex items-center gap-4 text-[11px] text-gray-500">
                  <span>RPC: <span className="text-gray-400 font-mono">{chain.rpcUrl}</span></span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Register New Mirror */}
      <Card header="Register Spoke Mirror">
        <p className="text-xs text-gray-400 mb-4">
          After deploying a NexusGovernanceMirror contract on a new chain, register it here.
          This calls <code className="text-nexus-400">registerRemoteMirror()</code> on the Base hub.
        </p>

        {showRegister ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Axelar Chain Name</label>
              <input
                type="text"
                value={registerForm.chainName}
                onChange={e => setRegisterForm(prev => ({ ...prev, chainName: e.target.value }))}
                placeholder="e.g. polygon"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-nexus-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Mirror Contract Address</label>
              <input
                type="text"
                value={registerForm.mirrorAddress}
                onChange={e => setRegisterForm(prev => ({ ...prev, mirrorAddress: e.target.value }))}
                placeholder="0x..."
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:border-nexus-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn-primary text-sm"
                disabled={!registerForm.chainName || !registerForm.mirrorAddress}
                onClick={() => {
                  alert(`Would call hub.registerRemoteMirror("${registerForm.chainName}", "${registerForm.mirrorAddress}")`);
                  setRegisterForm({ chainName: '', mirrorAddress: '' });
                  setShowRegister(false);
                }}
              >
                Register Mirror
              </button>
              <button
                className="text-sm text-gray-400 hover:text-white transition-colors"
                onClick={() => setShowRegister(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="flex items-center gap-1.5 text-sm text-nexus-400 hover:text-nexus-300 transition-colors"
            onClick={() => setShowRegister(true)}
          >
            <Plus size={14} /> Add New Spoke
          </button>
        )}
      </Card>

      {/* Axelar Payload Spec */}
      <Card header="Axelar GMP Payload Format" className="mt-4">
        <div className="text-xs text-gray-400 space-y-2 font-mono">
          <div>
            <span className="text-gray-500">VOTE_DELTA:</span>{' '}
            abi.encode(bytes32 kind, uint64 proposalId, uint256 yesDelta, uint256 noDelta, uint256 abstainDelta, uint256 nonce)
          </div>
          <div>
            <span className="text-gray-500">PROPOSAL_CREATED:</span>{' '}
            abi.encode(bytes32 kind, uint64 proposalId, uint64 start, uint64 end, uint256 quorumRequired)
          </div>
          <div>
            <span className="text-gray-500">RESULT_BROADCAST:</span>{' '}
            abi.encode(bytes32 kind, uint64 proposalId, uint8 finalStatus)
          </div>
        </div>
      </Card>
    </div>
  );
}
