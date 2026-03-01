/**
 * useEventBusSubscription — Bridges the global NexusMock EventBus
 * to the Map store's mintEvents[] and toastQueue[].
 *
 * Listens for MINT and BRIDGE events, resolves site coordinates,
 * and pushes to the store for globe explosions + toasts.
 */
import { useEffect, useRef } from 'react';
import { getNexusMock } from '@/mock';
import { useMapStore } from '../store';
import type { MintEventForGlobe, ToastNotification, BridgeEventForGlobe } from '../store';

/** Resolve siteId → coordinates from the NexusMock snapshot */
function resolveSiteCoords(siteId: string): { lat: number; lng: number } | null {
  const snapshot = getNexusMock().getSnapshot();
  const site = snapshot.sites.find((s) => s.id === siteId);
  if (!site) return null;
  return { lat: site.location.lat, lng: site.location.lng };
}

export function useEventBusSubscription() {
  const pushMintEvent = useMapStore((s) => s.pushMintEvent);
  const clearMintEvent = useMapStore((s) => s.clearMintEvent);
  const pushBridgeEvent = useMapStore((s) => s.pushBridgeEvent);
  const clearBridgeEvent = useMapStore((s) => s.clearBridgeEvent);
  const pushToast = useMapStore((s) => s.pushToast);
  const sites = useMapStore((s) => s.sites);
  const subRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Don't subscribe until we have sites loaded (so we can resolve coords)
    if (sites.length === 0) return;

    const nexusMock = getNexusMock();

    const unsubscribe = nexusMock.subscribe((event) => {
      // ── MINT events → globe explosion + toast ──
      if (event.type === 'MINT' && event.relatedSiteId) {
        const coords = resolveSiteCoords(event.relatedSiteId);
        if (!coords) return;

        const ticker = (event.payload.ticker as string) || 'WTR';
        const quantity = (event.payload.quantity as number) || 0;

        // Push explosion event for globe
        const mintEvt: MintEventForGlobe = {
          id: event.id,
          lat: coords.lat,
          lng: coords.lng,
          ticker,
          amount: quantity,
          timestamp: Date.now(),
        };
        pushMintEvent(mintEvt);

        // Auto-clear after burst duration (3s)
        setTimeout(() => clearMintEvent(event.id), 3000);

        // Push toast notification
        const toast: ToastNotification = {
          id: `toast_${event.id}`,
          type: 'MINT',
          title: `${ticker} Minted`,
          message: `${quantity.toLocaleString()} ${ticker} from ${event.payload.region || 'site'}`,
          ticker,
          amount: quantity,
          lat: coords.lat,
          lng: coords.lng,
          timestamp: Date.now(),
        };
        pushToast(toast);
      }

      // ── BRIDGE events → cross-chain arc + toast ──
      if (event.type === 'BRIDGE') {
        // Push bridge event for cross-chain arc animation
        const fromChain = (event.payload.from as string) || 'XRPL';
        const toChain = (event.payload.to as string) || 'BASE';
        const bridgeEvt: BridgeEventForGlobe = {
          id: event.id,
          fromChain: fromChain.toUpperCase(),
          toChain: toChain.toUpperCase(),
          token: (event.payload.token as string) || 'NXS',
          amount: (event.payload.amount as number) || 0,
          timestamp: Date.now(),
        };
        pushBridgeEvent(bridgeEvt);
        setTimeout(() => clearBridgeEvent(event.id), 4000);

        const toast: ToastNotification = {
          id: `toast_${event.id}`,
          type: 'BRIDGE',
          title: 'Cross-Chain Bridge',
          message: event.message,
          ticker: event.payload.token as string | undefined,
          amount: event.payload.amount as number | undefined,
          timestamp: Date.now(),
        };
        pushToast(toast);
      }

      // ── ALERT events → toast only ──
      if (event.type === 'ALERT' || event.type === 'EMERGENCY') {
        const toast: ToastNotification = {
          id: `toast_${event.id}`,
          type: 'ALERT',
          title: event.type === 'EMERGENCY' ? 'Emergency Alert' : 'System Alert',
          message: event.message,
          timestamp: Date.now(),
        };
        pushToast(toast);
      }
    });

    subRef.current = unsubscribe;

    return () => {
      unsubscribe();
      subRef.current = null;
    };
  }, [sites.length, pushMintEvent, clearMintEvent, pushBridgeEvent, clearBridgeEvent, pushToast]);
}
