import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);
let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, tone = "success", timeout = 2600) => {
    const id = ++toastId;
    setToasts((items) => [...items, { id, message, tone }]);
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), timeout);
  }, []);
  const value = useMemo(() => ({ showToast }), [showToast]);
  return <ToastContext.Provider value={value}>{children}<div className="ds-toast-region" aria-live="polite">{toasts.map((toast) => <div key={toast.id} className={`ds-toast ds-toast--${toast.tone}`}><span>{toast.tone === "danger" ? "!" : "✓"}</span>{toast.message}</div>)}</div></ToastContext.Provider>;
}

export function useToast() {
  return useContext(ToastContext) || { showToast: () => {} };
}
