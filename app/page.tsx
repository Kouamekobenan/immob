"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/context/app-store-context";

export default function Home() {
  const { currentUser } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.push("/login");
    } else {
      switch (currentUser.role) {
        case "SUPER_ADMIN":
          router.push("/dashboard/stats");
          break;
        case "BAILLEUR":
          router.push("/dashboard/bailleur");
          break;
        case "GERANT":
          router.push("/dashboard/gerant");
          break;
        case "LOCATAIRE":
          router.push("/dashboard/locataire");
          break;
        case "PRESTATAIRE":
          router.push("/dashboard/prestataire");
          break;
        default:
          router.push("/login");
      }
    }
  }, [currentUser, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="text-sm font-medium text-slate-500">Chargement...</p>
      </div>
    </div>
  );
}
