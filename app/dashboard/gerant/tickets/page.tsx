'use client';

import { useState } from 'react';
import { useAppStore } from '@/context/app-store-context';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Wrench, Sparkles, User, Info, CheckCircle, MapPin } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Ticket, TicketStatus, UrgencyLevel } from '@/types/prisma';
import { motion } from 'framer-motion';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.24, ease: 'easeOut' as const } } },
};

const urgencyConfig: Record<UrgencyLevel, { label: string; cls: string; strip: string }> = {
  CRITIQUE: { label: 'Critique', cls: 'bg-red-50 text-red-700 border-red-200 animate-pulse', strip: 'bg-red-400' },
  MOYEN:    { label: 'Moyen',    cls: 'bg-amber-50 text-amber-700 border-amber-200',          strip: 'bg-amber-400' },
  FAIBLE:   { label: 'Faible',   cls: 'bg-blue-50 text-blue-700 border-blue-200',             strip: 'bg-blue-300' },
};

const statusConfig: Record<TicketStatus, { label: string; cls: string }> = {
  OUVERT:   { label: 'Ouvert',   cls: 'bg-red-50 text-red-600 border-red-200' },
  ASSIGNE:  { label: 'Assigné',  cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  EN_COURS: { label: 'En cours', cls: 'bg-blue-50 text-blue-600 border-blue-200' },
  RESOLU:   { label: 'Résolu',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CLOTURE:  { label: 'Clôturé',  cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export default function GerantTickets() {
  const { currentUser, tickets, properties, users, assignTicket } = useAppStore();
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedPrestataire, setSelectedPrestataire] = useState('');

  if (!currentUser) return null;

  const myProperties = properties.filter(p => p.gerantId === currentUser.id);
  const myPropertyIds = myProperties.map(p => p.id);
  const myTickets = tickets.filter(t => myPropertyIds.includes(t.propertyId));
  const prestataires = users.filter(u => u.role === 'PRESTATAIRE');
  const filteredTickets = myTickets.filter(t => statusFilter === 'ALL' || t.statut === statusFilter);

  const openAssignModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setSelectedPrestataire(prestataires[0]?.id || '');
    setIsAssignOpen(true);
  };

  const handleAssignSubmit = () => {
    if (!selectedTicket || !selectedPrestataire) return;
    assignTicket(selectedTicket.id, selectedPrestataire);
    setIsAssignOpen(false);
  };

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={stagger.item}>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Wrench className="h-6 w-6 text-slate-500" />
          Répartiteur de Maintenance
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Attribuez les pannes signalées par vos locataires à des artisans qualifiés et supervisez l&apos;avancement.
        </p>
      </motion.div>

      {/* Filter */}
      <motion.div variants={stagger.item}>
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Filtrer :</p>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as TicketStatus | 'ALL')}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer font-semibold text-slate-700"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="OUVERT">Ouvert (Non assigné)</option>
              <option value="ASSIGNE">Assigné</option>
              <option value="EN_COURS">En cours</option>
              <option value="RESOLU">Résolu</option>
              <option value="CLOTURE">Clôturé</option>
            </select>
            <span className="text-xs text-slate-400 font-medium">
              {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
            </span>
          </div>
        </Card>
      </motion.div>

      {/* Tickets list */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <motion.div variants={stagger.item}>
            <Card className="p-10 text-center text-slate-400 font-medium">
              Aucun incident sous ce statut pour vos biens gérés.
            </Card>
          </motion.div>
        ) : (
          filteredTickets.map((ticket) => {
            const prop         = properties.find(p => p.id === ticket.propertyId);
            const tenant       = users.find(u => u.id === ticket.locataireId);
            const assignedTech = ticket.prestataireId ? users.find(u => u.id === ticket.prestataireId) : null;
            const ugCfg        = urgencyConfig[ticket.urgence];
            const stCfg        = statusConfig[ticket.statut];

            return (
              <motion.div key={ticket.id} variants={stagger.item}>
                <Card className="flex flex-col sm:flex-row overflow-hidden hover:shadow-sm transition-shadow">
                  {/* Urgency strip */}
                  <div className={`w-full sm:w-1 h-1 sm:h-auto shrink-0 ${ugCfg.strip}`} />

                  <div className="flex-1 p-5">
                    {/* Header row */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-800 text-sm">{ticket.titre}</h3>
                          <Badge className={`text-[9px] font-bold border ${ugCfg.cls}`}>{ugCfg.label}</Badge>
                          <Badge className={`text-[9px] font-bold border ${stCfg.cls}`}>{stCfg.label}</Badge>
                        </div>
                        <p className="text-xs text-slate-400">
                          Signalé le {formatDate(ticket.createdAt)} par{' '}
                          <span className="font-bold text-slate-600">{tenant ? `${tenant.prenom} ${tenant.nom}` : '—'}</span>
                        </p>
                      </div>

                      <div className="shrink-0">
                        {ticket.statut === 'OUVERT' ? (
                          <Button size="sm" onClick={() => openAssignModal(ticket)} className="gap-1.5 font-bold">
                            <Sparkles className="h-3.5 w-3.5" />
                            Assigner
                          </Button>
                        ) : ticket.statut === 'ASSIGNE' || ticket.statut === 'EN_COURS' ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            Artisan : <strong className="ml-1">{assignedTech?.prenom} {assignedTech?.nom}</strong>
                          </div>
                        ) : ticket.statut === 'RESOLU' ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Résolu par {assignedTech?.prenom} {assignedTech?.nom}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Archivé</span>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="md:col-span-2 space-y-3 text-xs">
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mb-1.5">Description</p>
                          <p className="text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 rounded-lg p-3">
                            {ticket.description}
                          </p>
                        </div>
                        {prop && (
                          <p className="flex items-center gap-1.5 text-slate-500 font-semibold">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {prop.adresse}, {prop.ville}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mb-1.5">Photos jointes</p>
                        {ticket.photos.length === 0 ? (
                          <p className="text-xs italic text-slate-400">Aucune photo</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {ticket.photos.map((photo, idx) => (
                              <div key={idx} className="relative h-20 rounded-lg overflow-hidden border border-slate-200">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={photo} alt={`Incident ${idx}`} className="h-full w-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Assign Modal */}
      <Modal isOpen={isAssignOpen} onClose={() => setIsAssignOpen(false)} title="Assignation du prestataire technique">
        <form onSubmit={e => { e.preventDefault(); handleAssignSubmit(); }} className="space-y-4">
          <div className="flex gap-2.5 p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-blue-800">Ordre d&apos;intervention</p>
              <p className="text-blue-600 mt-0.5">
                Le prestataire sera notifié et recevra les coordonnées du locataire. Le ticket passera au statut <strong>ASSIGNÉ</strong>.
              </p>
            </div>
          </div>

          {selectedTicket && (
            <div className="text-xs border border-slate-200 rounded-lg p-3 space-y-1.5 bg-slate-50">
              <p className="text-slate-600">Incident : <strong className="text-slate-800">{selectedTicket.titre}</strong></p>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Urgence :</span>
                <Badge className={`text-[9px] font-bold border ${urgencyConfig[selectedTicket.urgence].cls}`}>
                  {urgencyConfig[selectedTicket.urgence].label}
                </Badge>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase">Choisir un prestataire qualifié</label>
            {prestataires.length === 0 ? (
              <p className="text-xs text-red-600 italic">Aucun prestataire enregistré dans le système.</p>
            ) : (
              <select
                value={selectedPrestataire}
                onChange={e => setSelectedPrestataire(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer font-semibold text-slate-700"
              >
                {prestataires.map(tech => (
                  <option key={tech.id} value={tech.id}>
                    {tech.prenom} {tech.nom} ({tech.telephone || 'Sans téléphone'})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsAssignOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={prestataires.length === 0}>Mandater le prestataire</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
