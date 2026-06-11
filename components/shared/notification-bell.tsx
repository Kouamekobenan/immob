'use client';

import { useState, useEffect, useRef, type ElementType } from 'react';
import { useAppStore } from '@/context/app-store-context';
import { Bell, Wrench, CreditCard, FileWarning, CheckCircle, Mail, Sparkles, BellOff } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { NotificationType } from '@/types/prisma';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

const typeConfig: Record<NotificationType, { icon: ElementType; color: string; bg: string }> = {
  TICKET_STATUT_CHANGE:  { icon: Wrench,       color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-100' },
  NOUVEAU_TICKET_ASSIGNE:{ icon: Sparkles,      color: 'text-purple-600',  bg: 'bg-purple-50 border-purple-100' },
  LOYER_DISPONIBLE:      { icon: CreditCard,    color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-100' },
  PAIEMENT_VALIDE:       { icon: CheckCircle,   color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
  RAPPEL_IMPAYE:         { icon: FileWarning,   color: 'text-red-600',     bg: 'bg-red-50 border-red-100' },
};

export function NotificationBell() {
  const { notifications, currentUser, markNotificationAsRead, markAllNotificationsAsRead } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const userNotifs = notifications
    .filter(n => n.userId === currentUser?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = userNotifs.filter(n => !n.estLu).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="absolute -top-0.5 -right-0.5 h-4.5 min-w-4.5 px-1 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center border-2 border-white leading-none"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' as const }}
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <Badge className="h-5 px-1.5 text-[10px] font-bold bg-blue-100 text-blue-700 border-none rounded-md">
                    {unreadCount} nouvelles
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={() => currentUser && markAllNotificationsAsRead(currentUser.id)}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  Tout lire
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-90 overflow-y-auto divide-y divide-slate-50">
              {userNotifs.length === 0 ? (
                <div className="p-10 text-center text-slate-400 flex flex-col items-center gap-2">
                  <BellOff className="h-8 w-8 text-slate-300" />
                  <p className="text-xs font-medium">Aucune notification</p>
                </div>
              ) : (
                userNotifs.map((notif, i) => {
                  const cfg = typeConfig[notif.type] ?? { icon: Mail, color: 'text-slate-500', bg: 'bg-slate-50 border-slate-100' };
                  const Icon = cfg.icon;
                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.18 }}
                      onClick={() => !notif.estLu && markNotificationAsRead(notif.id)}
                      className={`flex gap-3 px-4 py-3.5 transition-colors duration-150 ${
                        notif.estLu
                          ? 'bg-white hover:bg-slate-50/60'
                          : 'bg-blue-50/30 hover:bg-blue-50/50 cursor-pointer'
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg}`}>
                        <Icon className={`h-4 w-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs text-slate-800 leading-snug ${!notif.estLu ? 'font-semibold' : 'font-medium'}`}>
                            {notif.titre}
                          </p>
                          {!notif.estLu && (
                            <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed wrap-break-word">
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block font-medium">
                          {formatDate(notif.createdAt)}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
