@AGENTS.md
# Real Estate Management Platform - Frontend Architecture

Ce projet est le frontend d'une application de gestion immobilière multi-locataires et multi-rôles, basé sur un modèle de données Prisma (PostgreSQL).

## 🛠️ Stack Technique Cible
- **Framework :** Next.js (App Router, TypeScript)
- **Styling & UI :** Tailwind CSS, Shadcn/ui (Radix Primitives)
- **State Management & Data Fetching :** TanStack Query (React Query)
- **Formulaires & Validation :** React Hook Form + Zod
- **Icons :** Lucide React
- **Animations :** Framer Motion (transitions fluides, micro-interactions professionnelles)

## 👤 Matrice des Rôles & Accès Métier
L'application adapte ses flux et ses dashboards selon 5 rôles distincts définis dans le schéma :
1. **SUPER_ADMIN :** Contrôle total, logs d'audit, gestion globale des utilisateurs.
2. **BAILLEUR :** Propriétaire des biens, vision macro des revenus, validation des gérants.
3. **GERANT :** Gestion opérationnelle des biens, des contrats, des paiements et assignation des tickets.
4. **LOCATAIRE :** Consultation du contrat, paiement des loyers (périodes), signalement et suivi des tickets de panne.
5. **PRESTATAIRE :** Réception, mise à jour du statut et résolution des tickets de maintenance assignés.

## 🏗️ Architecture des Dossiers (Next.js App Router)
```text
src/
├── app/                  # Dossier racine App Router
│   ├── (auth)/           # Route group pour la connexion et réinitialisation
│   ├── (dashboard)/      # Layout partagé (Sidebar pro, Navbar, Notifications)
│   │   ├── super-admin/  # Vues exclusives Super Admin
│   │   ├── bailleur/     # Vues exclusives Bailleur
│   │   ├── gerant/       # Vues exclusives Gérant
│   │   ├── locataire/    # Vues exclusives Locataire
│   │   └── prestataire/  # Vues exclusives Prestataire
│   └── api/              # Handlers si nécessaire
├── components/           # Composants atomiques
│   ├── ui/               # Composants de base Shadcn/ui (Boutons, Modals, Inputs)
│   ├── shared/           # Composants réutilisables (Sidebar, NotificationBell)
│   └── modules/          # Composants complexes par domaine (Properties, Tickets, Payments)
├── hooks/                # Hooks personnalisés (useAuth, useTickets, etc.)
├── lib/                  # Configurations (zod schemas, utils, api-client)
└── types/                # Déclarations TypeScript basées sur le modèle Prisma