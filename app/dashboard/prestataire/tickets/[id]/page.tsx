'use client';

import { use, useState } from 'react';
import { useAppStore } from '@/context/app-store-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wrench, CheckCircle, MapPin, User, Phone, Mail, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { TicketStatus, UrgencyLevel } from '@/types/prisma';
import { motion } from 'framer-motion';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.08 } } },
  item: { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.26, ease: 'easeOut' as const } } },
};

const urgencyConfig: Record<UrgencyLevel, { label: string; cls: string }> = {
  CRITIQUE: { label: 'Urgence critique', cls: 'bg-red-50 text-red-700 border-red-200 animate-pulse' },
  MOYEN:    { label: 'Urgence moyenne',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  FAIBLE:   { label: 'Urgence faible',   cls: 'bg-blue-50 text-blue-700 border-blue-200' },
};

const statusConfig: Record<TicketStatus, { label: string; cls: string }> = {
  OUVERT:   { label: 'Ouvert',   cls: 'bg-red-50 text-red-600 border-red-200' },
  ASSIGNE:  { label: 'Assigné',  cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  EN_COURS: { label: 'En cours', cls: 'bg-blue-50 text-blue-600 border-blue-200' },
  RESOLU:   { label: 'Résolu',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CLOTURE:  { label: 'Clôturé',  cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export default function TicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { tickets, properties, users, updateTicketStatus } = useAppStore();
  const [loading, setLoading] = useState(false);

  const ticket = tickets.find(t => t.id === id);

  if (!ticket) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <AlertCircle className="h-10 w-10 mx-auto text-red-400 mb-4" />
        <h2 className="text-lg font-bold text-slate-800">Incident non trouvé</h2>
        <p className="text-xs text-slate-500 mt-2 mb-6">
          Le ticket demandé n&apos;existe pas ou vous n&apos;avez pas les droits d&apos;accès.
        </p>
        <Link href="/dashboard/prestataire">
          <Button variant="outline">Retour aux interventions</Button>
        </Link>
      </div>
    );
  }

  const prop   = properties.find(p => p.id === ticket.propertyId);
  const tenant = users.find(u => u.id === ticket.locataireId);
  const ugCfg  = urgencyConfig[ticket.urgence];
  const stCfg  = statusConfig[ticket.statut];

  const handleStartWork = () => {
    setLoading(true);
    setTimeout(() => { updateTicketStatus(ticket.id, 'EN_COURS'); setLoading(false); }, 800);
  };

  const handleCompleteWork = () => {
    setLoading(true);
    setTimeout(() => { updateTicketStatus(ticket.id, 'RESOLU'); setLoading(false); }, 800);
  };

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <motion.div variants={stagger.item}>
        <Link
          href="/dashboard/prestataire"
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux interventions
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div variants={stagger.item} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800">{ticket.titre}</h1>
            <Badge className={`text-[9px] font-bold border ${ugCfg.cls}`}>{ugCfg.label}</Badge>
            <Badge className={`text-[9px] font-bold border ${stCfg.cls}`}>{stCfg.label}</Badge>
          </div>
          <p className="text-xs text-slate-400 font-semibold">
            Signalé par le locataire le {formatDate(ticket.createdAt)}
          </p>
        </div>

        <div className="shrink-0">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span className="text-xs text-slate-500">Mise à jour...</span>
            </div>
          ) : ticket.statut === 'ASSIGNE' ? (
            <Button onClick={handleStartWork} className="gap-1.5 font-bold">
              <Wrench className="h-4 w-4" />
              Commencer l&apos;intervention
            </Button>
          ) : ticket.statut === 'EN_COURS' ? (
            <Button
              onClick={handleCompleteWork}
              className="gap-1.5 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle className="h-4 w-4" />
              Déclarer résolu
            </Button>
          ) : ticket.statut === 'RESOLU' ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl">
              <CheckCircle className="h-4 w-4" />
              Dépannage validé
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">Incident clôturé</span>
          )}
        </div>
      </motion.div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: description + photos */}
        <motion.div variants={stagger.item} className="lg:col-span-2">
          <Card>
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                Détails de la Panne
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4 text-xs">
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase mb-1.5">Description</p>
                <p className="text-slate-700 leading-relaxed bg-slate-50 border border-slate-100 p-3 rounded-lg">
                  {ticket.description}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase mb-2">Photos de l&apos;incident</p>
                {ticket.photos.length === 0 ? (
                  <p className="italic text-slate-400">Aucune image fournie pour ce ticket.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ticket.photos.map((photo, index) => (
                      <div key={index} className="relative h-44 rounded-xl overflow-hidden border border-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo} alt={`Incident ${index}`} className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right: location + tenant */}
        <div className="space-y-5">
          <motion.div variants={stagger.item}>
            <Card>
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  Lieu d&apos;intervention
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-xs">
                {prop ? (
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800">{prop.titre}</p>
                    <p className="text-slate-500 leading-snug">{prop.adresse}, {prop.ville}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Type : {prop.type}</p>
                  </div>
                ) : (
                  <p className="italic text-slate-400">Adresse non spécifiée</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={stagger.item}>
            <Card>
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  Contact Locataire
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-xs space-y-2">
                {tenant ? (
                  <>
                    <p className="font-bold text-slate-800">{tenant.prenom} {tenant.nom}</p>
                    {tenant.telephone && (
                      <p className="flex items-center gap-1.5 text-slate-500">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {tenant.telephone}
                      </p>
                    )}
                    <p className="flex items-center gap-1.5 text-slate-500">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate">{tenant.email}</span>
                    </p>
                  </>
                ) : (
                  <p className="italic text-slate-400">Coordonnées indisponibles</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
