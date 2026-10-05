import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { VegetationLibraryView } from "@/features/library/VegetationLibraryView";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Biblioteca de vegetació" };

export default async function VegetationLibraryPage() {
  const user = await requireUser();

  if (user.role !== "admin") {
    return (
      <PageHeader
        title="Accés restringit"
        description="La biblioteca de vegetació només la poden gestionar els administradors."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Biblioteca de vegetació"
        description="Imatges de referència d'alta qualitat. Quan un usuari tria millorar la vegetació, se'n seleccionen automàticament entre 1 i 3 segons les etiquetes."
      />
      <VegetationLibraryView />
    </>
  );
}
