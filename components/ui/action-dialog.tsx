'use client';

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

type DialogIntent = 'danger' | 'warning' | 'info' | 'success';

type DialogOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  intent?: DialogIntent;
  requireInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
  inputDefaultValue?: string;
};

type DialogResult = {
  confirmed: boolean;
  value?: string;
};

type DialogApi = {
  confirm: (options: DialogOptions) => Promise<boolean>;
  prompt: (options: DialogOptions) => Promise<DialogResult>;
  alert: (options: DialogOptions) => Promise<void>;
};

type DialogState = {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  intent: DialogIntent;
  requireInput: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
  inputValue: string;
  inputError: string;
};

const DEFAULT_STATE: DialogState = {
  open: false,
  title: 'Please confirm',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  intent: 'warning',
  requireInput: false,
  inputLabel: undefined,
  inputPlaceholder: undefined,
  inputValue: '',
  inputError: '',
};

const DialogContext = createContext<DialogApi | null>(null);

const INTENT_STYLES: Record<DialogIntent, { icon: typeof Info; accent: string; button: string }> = {
  danger: {
    icon: AlertTriangle,
    accent: 'bg-red-50 text-red-700 border-red-100',
    button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  },
  warning: {
    icon: AlertTriangle,
    accent: 'bg-amber-50 text-amber-700 border-amber-100',
    button: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
  },
  info: {
    icon: Info,
    accent: 'bg-blue-50 text-blue-700 border-blue-100',
    button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  },
  success: {
    icon: CheckCircle2,
    accent: 'bg-green-50 text-green-700 border-green-100',
    button: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
  },
};

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState>(DEFAULT_STATE);
  const resolverRef = useRef<((result: DialogResult) => void) | null>(null);
  const titleId = useId();
  const messageId = useId();

  const closeDialog = useCallback((result: DialogResult) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setState((prev) => ({ ...prev, open: false, inputValue: '', inputError: '' }));
  }, []);

  const openDialog = useCallback((options: DialogOptions) => {
    const {
      title,
      message,
      confirmText,
      cancelText,
      intent,
      requireInput,
      inputLabel,
      inputPlaceholder,
      inputDefaultValue,
    } = options;

    setState({
      open: true,
      title: title || DEFAULT_STATE.title,
      message,
      confirmText: confirmText || DEFAULT_STATE.confirmText,
      cancelText: cancelText || DEFAULT_STATE.cancelText,
      intent: intent || DEFAULT_STATE.intent,
      requireInput: Boolean(requireInput),
      inputLabel,
      inputPlaceholder,
      inputValue: inputDefaultValue || '',
      inputError: '',
    });

    return new Promise<DialogResult>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const confirm = useCallback(
    async (options: DialogOptions) => {
      const result = await openDialog({ ...options, requireInput: false });
      return result.confirmed;
    },
    [openDialog]
  );

  const prompt = useCallback(
    (options: DialogOptions) => {
      return openDialog({ ...options, requireInput: true });
    },
    [openDialog]
  );

  const alert = useCallback(
    async (options: DialogOptions) => {
      await openDialog({
        ...options,
        intent: options.intent || 'info',
        confirmText: options.confirmText || 'OK',
        cancelText: options.cancelText || 'Dismiss',
        requireInput: false,
      });
    },
    [openDialog]
  );

  const value = useMemo(() => ({ confirm, prompt, alert }), [confirm, prompt, alert]);

  useEffect(() => {
    if (!state.open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDialog({ confirmed: false });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.open, closeDialog]);

  const IntentIcon = INTENT_STYLES[state.intent].icon;

  return (
    <DialogContext.Provider value={value}>
      {children}
      {state.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => closeDialog({ confirmed: false })}
          />
          <div
            className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={messageId}
          >
            <div className={`flex items-center justify-between px-5 py-4 border-b ${INTENT_STYLES[state.intent].accent}`}>
              <div className="flex items-center gap-2">
                <IntentIcon className="h-5 w-5" />
                <h3 id={titleId} className="text-sm font-semibold text-slate-900">
                  {state.title}
                </h3>
              </div>
              <button
                onClick={() => closeDialog({ confirmed: false })}
                className="text-slate-400 hover:text-slate-600 transition"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 py-5 space-y-4">
              <p id={messageId} className="text-sm text-slate-600 leading-relaxed">
                {state.message}
              </p>
              {state.requireInput && (
                <div className="space-y-2">
                  {state.inputLabel && (
                    <label className="text-xs font-medium text-slate-600">{state.inputLabel}</label>
                  )}
                  <input
                    type="text"
                    value={state.inputValue}
                    onChange={(event) =>
                      setState((prev) => ({
                        ...prev,
                        inputValue: event.target.value,
                        inputError: '',
                      }))
                    }
                    placeholder={state.inputPlaceholder}
                    autoFocus
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {state.inputError && (
                    <p className="text-xs text-red-600">{state.inputError}</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => closeDialog({ confirmed: false })}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200 rounded-lg transition"
              >
                {state.cancelText}
              </button>
              <button
                onClick={() => {
                  if (state.requireInput && !state.inputValue.trim()) {
                    setState((prev) => ({
                      ...prev,
                      inputError: 'Please provide a value to continue.',
                    }));
                    return;
                  }
                  closeDialog({ confirmed: true, value: state.inputValue });
                }}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${INTENT_STYLES[state.intent].button}`}
              >
                {state.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}
