import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'error' | 'success' | 'info';
  title?: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-[70] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all transform translate-y-0 opacity-100 ${
              isError
                ? 'bg-rose-950/90 border-rose-700/60 text-rose-100'
                : isSuccess
                ? 'bg-emerald-950/90 border-emerald-700/60 text-emerald-100'
                : 'bg-zinc-900/90 border-zinc-700/60 text-zinc-100'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {isSuccess && <CheckCircle className="w-5 h-5 text-emerald-400" />}
              {!isError && !isSuccess && <Info className="w-5 h-5 text-sky-400" />}
            </div>
            <div className="flex-1 text-sm">
              {toast.title && <p className="font-semibold">{toast.title}</p>}
              <p className={toast.title ? 'text-xs opacity-90 mt-0.5' : ''}>{toast.message}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 p-1 rounded-md opacity-70 hover:opacity-100 hover:bg-white/10 transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
