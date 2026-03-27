import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './lib/api';
import type { RootState } from './store';

interface Toast {
  id: string;
  message: string;
  title: string;
  type: 'info' | 'success' | 'warning';
  createdAt: number;
  read: boolean;
  audience: 'personal' | 'global';
}

let socket: Socket | null = null;

export function useNotifications() {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [feed, setFeed] = useState<Toast[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const markAllRead = useCallback(() => {
    setFeed((prev) => prev.map((item) => ({ ...item, read: true })));
  }, []);

  const addToast = useCallback(
    (
      message: string,
      title = 'Notification',
      type: Toast['type'] = 'info',
      audience: Toast['audience'] = 'personal',
    ) => {
      const id = Math.random().toString(36).slice(2);
      const item: Toast = {
        id,
        message,
        title,
        type,
        audience,
        createdAt: Date.now(),
        read: panelOpen,
      };
      setToasts((prev) => [...prev, item]);
      setFeed((prev) => [item, ...prev].slice(0, 20));
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss, panelOpen],
  );

  useEffect(() => {
    if (!user || !token) {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      setToasts([]);
      setFeed([]);
      return;
    }

    socket = io(API_BASE_URL, { auth: { token } });

    socket.on('connect', () => {
      socket?.emit('join-room', { userId: user.id });
    });

    socket.on(
      'notification',
      (payload: { title: string; message: string; type?: Toast['type'] }) => {
        addToast(payload.message, payload.title, payload.type || 'info', 'personal');
      },
    );

    socket.on(
      'global-notification',
      (payload: { title: string; message: string }) => {
        addToast(payload.message, payload.title, 'info', 'global');
      },
    );

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [user, token, addToast]);

  useEffect(() => {
    if (panelOpen) {
      markAllRead();
    }
  }, [panelOpen, markAllRead]);

  return {
    toasts,
    feed,
    unreadCount: feed.filter((item) => !item.read).length,
    dismiss,
    panelOpen,
    setPanelOpen,
    markAllRead,
  };
}

export function ToastContainer() {
  const {
    toasts,
    feed,
    unreadCount,
    dismiss,
    panelOpen,
    setPanelOpen,
    markAllRead,
  } = useNotifications();

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

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 max-w-sm w-full">
      {panelOpen ? (
        <div className="w-full rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-slate-900">Notifications</p>
              <p className="text-xs text-slate-500">
                Live updates for invites, approvals, tasks, and treasury changes.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={markAllRead}
                className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Mark Read
              </button>
              <button
                onClick={() => setPanelOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto p-4 space-y-3">
            {feed.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No notifications yet.
              </div>
            ) : (
              feed.map((toast) => (
                <div
                  key={toast.id}
                  className={`rounded-2xl border p-4 ${colors[toast.type]} ${
                    toast.read ? 'opacity-75' : 'shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg shrink-0">{icons[toast.type]}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900 text-sm">
                          {toast.title}
                        </p>
                        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-black">
                          {toast.audience}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{toast.message}</p>
                      <p className="text-[11px] text-slate-400 mt-2">
                        {new Date(toast.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`w-full flex items-start gap-3 p-4 rounded-2xl border shadow-lg backdrop-blur-md animate-slide-in ${colors[toast.type]}`}
        >
          <span className="text-xl shrink-0">{icons[toast.type]}</span>
          <div className="flex-grow min-w-0">
            <p className="font-semibold text-slate-900 text-sm">{toast.title}</p>
            <p className="text-slate-600 text-sm mt-0.5 line-clamp-2">
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="text-slate-400 hover:text-slate-600 font-black text-lg shrink-0 leading-none"
          >
            ×
          </button>
        </div>
      ))}

      <button
        onClick={() => setPanelOpen((current) => !current)}
        className="group flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-xl hover:bg-slate-800 transition-all"
      >
        <span className="text-lg">🔔</span>
        <span className="text-sm font-bold">Notifications</span>
        {unreadCount > 0 ? (
          <span className="min-w-6 h-6 px-2 rounded-full bg-rose-500 text-white text-xs font-black flex items-center justify-center">
            {unreadCount}
          </span>
        ) : (
          <span className="text-[11px] uppercase tracking-widest text-slate-300 font-black">
            Clear
          </span>
        )}
      </button>
    </div>
  );
}
