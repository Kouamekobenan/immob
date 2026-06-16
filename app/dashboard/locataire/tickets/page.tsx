'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppStore } from '@/context/app-store-context';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { Wrench, Plus, Clock, Check, AlertCircle, FileImage, Loader2, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { parseApiError } from '@/lib/api';
import { TicketStatus, UrgencyLevel } from '@/types/prisma';
import { motion } from 'framer-motion';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
  item: { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.26, ease: 'easeOut' as const } } },
};

const schema = z.object({
  titre:       z.string().min(1, 'Titre requis'),
  description: z.string().min(10, 'Décrivez le problème (min. 10 caractères)'),
  urgence:     z.enum(['FAIBLE', 'MOYEN', 'CRITIQUE']),
});
type FormValues = z.infer<typeof schema>;

const urgencyConfig: Record<UrgencyLevel, { label: string; cls: string }> = {
  CRITIQUE: { label: 'Critique', cls: 'bg-red-50 text-red-700 border-red-200 animate-pulse' },
  MOYEN:    { label: 'Moyen',    cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  FAIBLE:   { label: 'Faible',   cls: 'bg-blue-50 text-blue-700 border-blue-200' },
};

export default function LocataireTickets() {
  const { currentUser, tickets, contracts, addTicket, properties } = useAppStore();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { urgence: 'MOYEN' },
  });

  useEffect(() => {
    if (searchParams.get('action') === 'new') setIsOpen(true);
  }, [searchParams]);

  if (!currentUser) return null;

  const activeContract = contracts.find(c => c.locataireId === currentUser.id && c.estActif);
  const myProp = activeContract ? properties.find(p => p.id === activeContract.propertyId) : null;

  const myTickets = tickets
    .filter(t => t.locataireId === currentUser.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleClose = () => {
    setIsOpen(false);
    setFormError('');
    setSelectedPhotos([]);
    reset();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (data: FormValues) => {
    if (!myProp) return;
    setFormError('');
    setIsSubmitting(true);
    try {
      await addTicket(
        {
          titre:         data.titre,
          description:   data.description,
          urgence:       data.urgence,
          photos:        [],
          propertyId:    myProp.id,
          locataireId:   currentUser.id,
          prestataireId: null,
        },
        selectedPhotos,
      );
      handleClose();
    } catch (err) {
      setFormError(parseApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTimeline = (currentStatus: TicketStatus) => {
    const states: { status: TicketStatus; label: string }[] = [
      { status: 'OUVERT',   label: 'Signalé' },
      { status: 'ASSIGNE',  label: 'Artisan mandaté' },
      { status: 'EN_COURS', label: 'En réparation' },
      { status: 'RESOLU',   label: 'Résolu' },
    ];
    const idx = (s: TicketStatus) => {
      switch (s) {
        case 'OUVERT':   return 0;
        case 'ASSIGNE':  return 1;
        case 'EN_COURS': return 2;
        case 'RESOLU':
        case 'CLOTURE':  return 3;
        default:         return 0;
      }
    };
    const currentIdx = idx(currentStatus);
    return (
      <div className="w-full py-4">
        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 right-0 top-1/2 h-1 bg-slate-100 -translate-y-1/2 rounded-full" />
          <div
            className="absolute left-0 top-1/2 h-1 bg-blue-500 -translate-y-1/2 rounded-full transition-all duration-500"
            style={{ width: `${(currentIdx / (states.length - 1)) * 100}%` }}
          />
          {states.map((state, index) => {
            const isCompleted = index < currentIdx;
            const isActive    = index === currentIdx;
            return (
              <div key={state.status} className="relative flex flex-col items-center z-10">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : isActive
                      ? 'bg-white border-blue-500 text-blue-600 shadow-md scale-105'
                      : 'bg-white border-slate-200 text-slate-400'
                }`}>
                  {isCompleted ? <Check className="h-4 w-4" /> : <span className="text-[10px]">{index + 1}</span>}
                </div>
                <span className={`text-[10px] mt-2 font-bold uppercase tracking-wide ${
                  isActive ? 'text-blue-700' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                }`}>
                  {state.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={stagger.item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Wrench className="h-6 w-6 text-slate-500" />
            Mes Signalements de Panne
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Déclarez de nouveaux incidents et suivez l&apos;avancement des interventions.
          </p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="self-start sm:self-auto gap-1.5 font-bold">
          <Plus className="h-4 w-4" />
          Déclarer un incident
        </Button>
      </motion.div>

      {/* Tickets list */}
      <div className="space-y-5">
        {myTickets.length === 0 ? (
          <motion.div variants={stagger.item}>
            <Card className="p-10 text-center text-slate-400 font-medium">
              <Clock className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              Aucun incident signalé à ce jour.
            </Card>
          </motion.div>
        ) : (
          myTickets.map((ticket) => {
            const ugCfg = urgencyConfig[ticket.urgence];
            return (
              <motion.div key={ticket.id} variants={stagger.item}>
                <Card className="p-6 hover:shadow-sm transition-shadow">
                  {/* Title + badge */}
                  <div className="flex justify-between items-start gap-4 border-b border-slate-100 pb-3 mb-4">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{ticket.titre}</h3>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        Soumis le {formatDate(ticket.createdAt)}
                      </p>
                    </div>
                    <Badge className={`text-[9px] font-bold border shrink-0 ${ugCfg.cls}`}>
                      {ugCfg.label}
                    </Badge>
                  </div>

                  {/* Timeline */}
                  <div className="px-4 bg-slate-50/40 rounded-xl border border-slate-100 mb-4">
                    {renderTimeline(ticket.statut)}
                  </div>

                  {/* Description + photos */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="md:col-span-2 text-xs">
                      <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Détails de l&apos;incident</p>
                      <p className="text-slate-600 leading-relaxed">{ticket.description}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mb-1.5">Photos fournies</p>
                      {ticket.photos.length === 0 ? (
                        <p className="text-xs italic text-slate-400">Aucune photo</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {ticket.photos.map((photo, idx) => (
                            <div key={idx} className="relative h-14 rounded-lg overflow-hidden border border-slate-200">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={photo} alt={`Incident ${idx}`} className="h-full w-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* New ticket modal */}
      <Modal isOpen={isOpen} onClose={handleClose} title="Signaler un incident de panne">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!myProp && (
            <div className="flex gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-semibold text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              Aucun bail actif lié à votre compte. Vous ne pouvez pas déclarer d&apos;incident.
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="titre">Quel est le problème ? (Intitulé)</Label>
            <Input
              id="titre"
              disabled={!myProp || isSubmitting}
              placeholder="ex: Fuite d'eau sous le lavabo"
              {...register('titre')}
              className={errors.titre ? 'border-red-400' : ''}
            />
            {errors.titre && <p className="text-xs text-red-500">{errors.titre.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description détaillée</Label>
            <textarea
              id="description"
              disabled={!myProp || isSubmitting}
              placeholder="Expliquez la situation précisément (localisation, gravité, fréquence...)"
              rows={4}
              {...register('description')}
              className={`w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-55 resize-none ${errors.description ? 'border-red-400' : 'border-slate-200'}`}
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="urgence">Niveau d&apos;urgence estimé</Label>
            <select
              id="urgence"
              disabled={!myProp || isSubmitting}
              {...register('urgence')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer font-semibold text-slate-700 disabled:opacity-55"
            >
              <option value="FAIBLE">Faible — N&apos;empêche pas de vivre confortablement</option>
              <option value="MOYEN">Moyen — Gênant au quotidien (fuite mineure, plaque HS...)</option>
              <option value="CRITIQUE">Critique — Urgence immédiate (inondation, chauffage HS...)</option>
            </select>
          </div>

          {/* File upload */}
          <div className="space-y-2">
            <Label>Photos du problème (optionnel)</Label>
            <label className={`w-full p-4 border border-dashed rounded-xl text-xs font-semibold text-slate-500 flex flex-col items-center gap-1.5 transition-colors ${!myProp || isSubmitting ? 'opacity-50 pointer-events-none cursor-not-allowed' : 'hover:bg-slate-50 hover:border-slate-400 cursor-pointer'}`}>
              <FileImage className="h-5 w-5 text-slate-400" />
              <span>Cliquer pour ajouter des photos</span>
              <span className="text-[10px] text-slate-400 font-normal">JPEG, PNG, WEBP</span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={!myProp || isSubmitting}
                onChange={e => setSelectedPhotos(Array.from(e.target.files ?? []))}
              />
            </label>
            {selectedPhotos.length > 0 && (
              <div className="flex items-center justify-between p-3 border border-dashed border-emerald-300 bg-emerald-50/40 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                  <FileImage className="h-5 w-5 text-emerald-600" />
                  {selectedPhotos.length} photo{selectedPhotos.length !== 1 ? 's' : ''} prête{selectedPhotos.length !== 1 ? 's' : ''}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPhotos([]);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Supprimer
                </button>
              </div>
            )}
          </div>

          {formError && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={handleClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={!myProp || isSubmitting} className="gap-1.5">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Envoi en cours...' : 'Déclarer la panne'}
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
