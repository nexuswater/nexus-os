import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

/* ─── Types ──────────────────────────────────────────── */

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant, duration?: number) => void;
}

/* ─── Context ────────────────────────────────────────── */

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });
export const useToast = () => useContext(ToastContext);

let _nextId = 0;

/* ─── Provider ───────────────────────────────────────── */

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = 'success', duration = 3000) => {
    const id = ++_nextId;
    setToasts(prev => [...prev, { id, message, variant, duration }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {createPortal(
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-2 pointer-events-none">
          {toasts.map(t => (
            <ToastItem key={t.id} toast={t} onDismiss={removeToast} />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

/* ─── Toast Item ─────────────────────────────────────── */

const VARIANT_CONFIG: Record<ToastVariant, { icon: typeof CheckCircle2; color: string; bg: string; border: string }> = {
  success: { icon: CheckCircle2, color: 'text-[#25D695]', bg: 'bg-[#25D695]/10', border: 'border-[#25D695]/30' },
  error:   { icon: XCircle,      color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/30' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10',  border: 'border-amber-400/30' },
  info:    { icon: Info,          color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/30' },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const cfg = VARIANT_CONFIG[toast.variant];
  const Icon = cfg.icon;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      className={`
        pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl
        ${cfg.bg} ${cfg.border}
        transition-all duration-300 ease-out min-w-[280px] max-w-[400px]
        shadow-lg shadow-black/20
        ${visible && !exiting ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}
      `}
    >
      <Icon size={16} className={`${cfg.color} flex-shrink-0`} />
      <span className="text-sm text-white font-medium flex-1">{toast.message}</span>
      <button
        onClick={() => { setExiting(true); setTimeout(() => onDismiss(toast.id), 300); }}
        className="p-0.5 text-gray-500 hover:text-white transition-colors flex-shrink-0"
      >
        <X size={12} />
      </button>
    </div>
  );
}
