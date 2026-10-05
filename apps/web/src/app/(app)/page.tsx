import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { buttonStyles } from "@/components/ui/button-styles";

const MODULES = [
  {
    title: "Colomer-Rifà Render AI",
    icon: "image",
    description:
      "Puja el render, selecciona què vols millorar i genera una versió fotorealista mantenint la fidelitat al projecte. Tot amb targetes i botons, sense escriure res.",
    formats: ["PNG", "JPG"],
    href: "/render/upload",
    cta: "Començar la millora",
  },
  {
    title: "Modelatge 3D per a CAD",
    icon: "cube",
    description:
      "Transforma plànols 2D, topografia, croquis o imatges en un DXF 3D editable per a Allplan i AutoCAD, organitzat per capes i colors. Si només hi ha imatges, el model és aproximat i les mesures s'etiqueten com a estimades.",
    formats: ["DXF", "DWG", "PDF", "PNG · JPG"],
    href: "/cad/upload",
    cta: "Començar el modelatge",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-[32px] font-semibold tracking-[-0.01em] md:text-[40px]">Què vols fer avui?</h1>
        <p className="max-w-[640px] text-[17px] text-text-muted">
          Dos fluxos de treball, cadascun amb les seves regles de fidelitat. Puja el material i l&apos;app et guia pas a pas.
        </p>
      </header>

      <section aria-label="Mòduls" className="flex flex-wrap gap-6">
        {MODULES.map((module) => (
          <article
            key={module.href}
            className="flex min-w-0 flex-[1_1_420px] flex-col gap-5 rounded-2xl border border-border bg-surface p-6 md:p-8"
          >
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-tint-orange">
                <Icon name={module.icon} size={26} />
              </div>
              <h2 className="text-2xl font-semibold">{module.title}</h2>
            </div>
            <p className="text-base leading-normal text-text-muted">{module.description}</p>
            <ul className="flex flex-wrap gap-2" aria-label="Formats acceptats">
              {module.formats.map((format) => (
                <li key={format} className="rounded-full bg-bg-page px-3 py-1 font-mono text-[13px]">
                  {format}
                </li>
              ))}
            </ul>
            <Link href={module.href} className={`${buttonStyles.primary} self-start`}>
              {module.cta}
            </Link>
          </article>
        ))}
      </section>

      <section aria-labelledby="recent-projects" className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 md:p-8">
        <h2 id="recent-projects" className="text-xl font-semibold">
          Projectes recents
        </h2>
        <p className="text-[15px] text-text-muted">Encara no hi ha projectes.</p>
      </section>
    </>
  );
}
