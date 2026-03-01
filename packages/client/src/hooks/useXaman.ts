import { useState, useCallback } from 'react';

/** Xaman xApp SDK integration hook */
export interface XamanPayload {
  uuid: string;
  tx_type: string;
  tx_json: Record<string, unknown>;
}

interface UseXamanReturn {
  /** Create and present a signing payload to the user */
  sign: (txJson: Record<string, unknown>) => Promise<XamanSignResult>;
  /** Whether a signing request is currently pending */
  signing: boolean;
  /** Last error from signing attempt */
  error: string | null;
}

interface XamanSignResult {
  success: boolean;
  tx_hash?: string;
  error?: string;
}

export function useXaman(): UseXamanReturn {
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sign = useCallback(async (txJson: Record<string, unknown>): Promise<XamanSignResult> => {
    setSigning(true);
    setError(null);
    try {
      // TODO: Integrate Xaman SDK
      // 1. POST to backend to create payload
      // 2. Present payload UUID to Xaman SDK
      // 3. Wait for user to sign or reject
      // 4. Backend receives webhook with signed tx
      // 5. Return tx_hash
      console.log('[Xaman] Sign request:', txJson);

      // Stub: simulate a signed result
      return {
        success: true,
        tx_hash: 'STUB_TX_HASH_' + Date.now().toString(36),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signing failed';
      setError(message);
      return { success: false, error: message };
    } finally {
      setSigning(false);
    }
  }, []);

  return { sign, signing, error };
}
