import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { PhasePending } from "@/components/layout/PhasePending";
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
      <PageHeader title="Biblioteca de vegetació" description="Referències etiquetades per a la millora de vegetació." />
      <PhasePending phase={4} />
    </>
  );
}
