'use client';

import { useState, useEffect, useRef, type ElementType } from 'react';
import { useAppStore } from '@/context/app-store-context';
import {
  Bell, BellOff, Mail, Sparkles, Wrench, CheckCircle,
  AlertTriangle, XCircle, FileText, FileX, Receipt, CreditCard,
  Trash2,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { NotificationType } from '@/types/prisma';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

const typeConfig: Record<NotificationType, { icon: ElementType; color: string; bg: string; label: string }> = {
  MESSAGE_DIRECT:  { icon: Mail,           color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-100',    label: 'Message' },
  SYSTEME:         { icon: Sparkles,        color: 'text-purple-600',  bg: 'bg-purple-50 border-purple-100', label: 'Système' },
  TICKET_OUVERT:   { icon: Wrench,          color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-100',  label: 'Ticket ouvert' },
  TICKET_RESOLU:   { icon: CheckCircle,     color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', label: 'Ticket résolu' },
  PAIEMENT_REJETE: { icon: XCircle,         color: 'text-red-600',     bg: 'bg-red-50 border-red-100',      label: 'Paiement rejeté' },
  PAIEMENT_ECHOUE: { icon: AlertTriangle,   color: 'text-orange-600',  bg: 'bg-orange-50 border-orange-100', label: 'Paiement échoué' },
  CONTRAT_CREE:    { icon: FileText,        color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-100',    label: 'Contrat créé' },
  CONTRAT_RESILIE: { icon: FileX,           color: 'text-red-600',     bg: 'bg-red-50 border-red-100',      label: 'Contrat résilié' },
  DEPENSE_CREEE:   { icon: Receipt,         color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-100',  label: 'Dépense créée' },
  DEPENSE_PAYEE:   { icon: CreditCard,      color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', label: 'Dépense payée' },
};

type FilterTab = 'ALL' | 'UNREAD';

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    reloadNotifications,
    currentUser,
  } = useAppStore();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reload notification list when panel opens
  useEffect(() => {
    if (isOpen) reloadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const userNotifs = notifications
    .filter(n => n.userId === currentUser?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const displayed = filter === 'UNREAD' ? userNotifs.filter(n => !n.estLu) : userNotifs;

  const handleRead = async (id: string, estLu: boolean) => {
    if (!estLu) await markNotificationAsRead(id);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteNotification(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleMarkAll = () => {
    if (currentUser) markAllNotificationsAsRead(currentUser.id);
  };

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
              className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] px-1 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center border-2 border-white leading-none"
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
            className="absolute right-0 mt-2 w-80 sm:w-[26rem] rounded-xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <Badge className="h-5 px-1.5 text-[10px] font-bold bg-blue-100 text-blue-700 border-none rounded-md">
                    {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  Tout lire
                </button>
              )}
            </div>

            {/* Filter tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50/60">
              {(['ALL', 'UNREAD'] as FilterTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`flex-1 py-2 text-[11px] font-semibold transition-colors ${
                    filter === tab
                      ? 'text-blue-700 border-b-2 border-blue-600 bg-white'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab === 'ALL' ? 'Toutes' : 'Non lues'}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="max-h-[26rem] overflow-y-auto divide-y divide-slate-50">
              {displayed.length === 0 ? (
                <div className="p-10 text-center text-slate-400 flex flex-col items-center gap-2">
                  <BellOff className="h-8 w-8 text-slate-300" />
                  <p className="text-xs font-medium">
                    {filter === 'UNREAD' ? 'Aucune notification non lue' : 'Aucune notification'}
                  </p>
                </div>
              ) : (
                displayed.map((notif, i) => {
                  const cfg = typeConfig[notif.type] ?? {
                    icon: Mail,
                    color: 'text-slate-500',
                    bg: 'bg-slate-50 border-slate-100',
                    label: notif.type,
                  };
                  const Icon = cfg.icon;
                  const isDeleting = deletingId === notif.id;

                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: isDeleting ? 0.4 : 1, x: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.16 }}
                      onClick={() => handleRead(notif.id, notif.estLu)}
                      className={`group relative flex gap-3 px-4 py-3 transition-colors duration-150 ${
                        notif.estLu
                          ? 'bg-white hover:bg-slate-50/60'
                          : 'bg-blue-50/25 hover:bg-blue-50/40 cursor-pointer'
                      }`}
                    >
                      {/* Type icon */}
                      <div className={`h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg}`}>
                        <Icon className={`h-4 w-4 ${cfg.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-start justify-between gap-1">
                          <p className={`text-xs text-slate-800 leading-snug ${!notif.estLu ? 'font-semibold' : 'font-medium'}`}>
                            {notif.titre}
                          </p>
                          {!notif.estLu && (
                            <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed break-words">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formatDate(notif.createdAt)}
                          </span>
                          <span className="text-[10px] text-slate-300">·</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          {notif.expediteurId === null && (
                            <>
                              <span className="text-[10px] text-slate-300">·</span>
                              <span className="text-[10px] text-slate-400 italic">Système</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={(e) => handleDelete(e, notif.id)}
                        disabled={isDeleting}
                        className="absolute right-3 top-3 p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
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
