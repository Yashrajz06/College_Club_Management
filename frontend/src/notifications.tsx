import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import { io, Socket } from 'socket.io-client';

interface Toast {
  id: string;
  message: string;
  title: string;
  type: 'info' | 'success' | 'warning';
}

let socket: Socket | null = null;

export function useNotifications() {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, title = 'Notification', type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, title, type }]);
    setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);

  useEffect(() => {
    if (!user || !token) {
      if (socket) { socket.disconnect(); socket = null; }
      return;
    }

    socket = io('http://localhost:3000', { auth: { token } });

    socket.on('connect', () => {
      socket?.emit('join-room', { userId: user.id });
    });

    socket.on('notification', (payload: { title: string; message: string; type?: Toast['type'] }) => {
      addToast(payload.message, payload.title, payload.type || 'info');
    });

    socket.on('global-notification', (payload: { title: string; message: string }) => {
      addToast(payload.message, payload.title, 'info');
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [user, token, addToast]);

  return { toasts, dismiss, addToast };
}

export function ToastContainer() {
  const { toasts, dismiss } = useNotifications();

  const icons: Record<Toast['type'], string> = {
    info: '💬',
    success: '✅',
    warning: '⚠️',
  };

  const colors: Record<Toast['type'], string> = {
    info: 'border-blue-200 bg-blue-50',
    success: 'border-emerald-200 bg-emerald-50',
    warning: 'border-amber-200 bg-amber-50',
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3 max-w-sm w-full">
      {toasts.map(toast => (
        <div key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-2xl border shadow-lg backdrop-blur-md animate-slide-in ${colors[toast.type]}`}>
          <span className="text-xl shrink-0">{icons[toast.type]}</span>
          <div className="flex-grow min-w-0">
            <p className="font-semibold text-slate-900 text-sm">{toast.title}</p>
            <p className="text-slate-600 text-sm mt-0.5 line-clamp-2">{toast.message}</p>
          </div>
          <button onClick={() => dismiss(toast.id)}
            className="text-slate-400 hover:text-slate-600 font-black text-lg shrink-0 leading-none">×</button>
        </div>
      ))}
    </div>
  );
}
