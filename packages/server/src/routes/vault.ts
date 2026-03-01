import { Router } from 'express';
import {
  MOCK_BILLS,
  MOCK_BILL_AUDIT_LOG,
  MOCK_UTILITY_PROVIDERS,
  MOCK_UTILITY_CONNECTIONS,
  MOCK_IOT_DEVICES,
  MOCK_IOT_READINGS,
  MOCK_INTEGRITY_SCORE,
  MOCK_VERIFICATION_ITEMS,
} from '../mock/data.js';

export const vaultRouter = Router();

// ─── Bills ────────────────────────────────────────────────

vaultRouter.get('/bills', (req, res) => {
  let bills = [...MOCK_BILLS];
  const { type, status, provider } = req.query;
  if (type) bills = bills.filter(b => b.type === type);
  if (status) bills = bills.filter(b => b.status === status);
  if (provider) bills = bills.filter(b => b.providerName.toLowerCase().includes((provider as string).toLowerCase()));
  res.json({ success: true, data: bills });
});

vaultRouter.get('/bills/:id', (req, res) => {
  const bill = MOCK_BILLS.find(b => b.id === req.params.id);
  if (!bill) return res.status(404).json({ success: false, error: 'Bill not found' });
  const auditLog = MOCK_BILL_AUDIT_LOG.filter(a => a.billId === bill.id);
  res.json({ success: true, data: { ...bill, auditLog } });
});

vaultRouter.post('/bills/upload', (req, res) => {
  res.json({
    success: true,
    data: {
      id: `bill-${Date.now()}`,
      status: 'pending',
      sha256: 'mock_hash_' + Date.now(),
      message: 'Bill uploaded successfully. Parsing and fraud analysis in progress.',
    },
  });
});

vaultRouter.post('/bills/:id/verify', (req, res) => {
  res.json({ success: true, data: { billId: req.params.id, status: 'verified' } });
});

vaultRouter.post('/bills/:id/reject', (req, res) => {
  res.json({ success: true, data: { billId: req.params.id, status: 'rejected' } });
});

// ─── Utility Connections ──────────────────────────────────

vaultRouter.get('/connections', (_req, res) => {
  res.json({ success: true, data: MOCK_UTILITY_CONNECTIONS });
});

vaultRouter.get('/connections/providers', (req, res) => {
  let providers = [...MOCK_UTILITY_PROVIDERS];
  const { category } = req.query;
  if (category) providers = providers.filter(p => p.category === category);
  res.json({ success: true, data: providers });
});

vaultRouter.post('/connections/start', (req, res) => {
  res.json({
    success: true,
    data: {
      connectionId: `conn-${Date.now()}`,
      status: 'PENDING',
      message: 'Connection initiated. Please complete provider authorization.',
    },
  });
});

vaultRouter.post('/connections/callback', (req, res) => {
  res.json({ success: true, data: { status: 'CONNECTED', message: 'Provider connected successfully.' } });
});

vaultRouter.post('/connections/revoke', (req, res) => {
  res.json({ success: true, data: { status: 'REVOKED', message: 'Connection revoked. No further data will be collected.' } });
});

vaultRouter.post('/connections/sync', (req, res) => {
  res.json({
    success: true,
    data: {
      connectionId: req.body.connectionId,
      syncedAt: new Date().toISOString(),
      billsImported: 2,
      usageRecords: 4,
      status: 'success',
    },
  });
});

// ─── IoT Devices ──────────────────────────────────────────

vaultRouter.get('/iot/devices', (_req, res) => {
  res.json({ success: true, data: MOCK_IOT_DEVICES });
});

vaultRouter.get('/iot/devices/:id', (req, res) => {
  const device = MOCK_IOT_DEVICES.find(d => d.id === req.params.id);
  if (!device) return res.status(404).json({ success: false, error: 'Device not found' });
  const readings = MOCK_IOT_READINGS.filter(r => r.deviceId === device.id);
  res.json({ success: true, data: { ...device, readings } });
});

vaultRouter.post('/iot/devices', (req, res) => {
  res.json({
    success: true,
    data: {
      id: `iot-${Date.now()}`,
      status: 'UNVERIFIED',
      message: 'Device registered. Request verification when ready.',
    },
  });
});

vaultRouter.post('/iot/devices/:id/readings', (req, res) => {
  res.json({
    success: true,
    data: { deviceId: req.params.id, accepted: true, timestamp: new Date().toISOString() },
  });
});

vaultRouter.get('/iot/devices/:id/readings', (req, res) => {
  const readings = MOCK_IOT_READINGS.filter(r => r.deviceId === req.params.id);
  res.json({ success: true, data: readings });
});

// ─── Verification Dashboard ──────────────────────────────

vaultRouter.get('/verification/score', (_req, res) => {
  res.json({ success: true, data: MOCK_INTEGRITY_SCORE });
});

vaultRouter.get('/verification/items', (_req, res) => {
  res.json({ success: true, data: MOCK_VERIFICATION_ITEMS });
});
