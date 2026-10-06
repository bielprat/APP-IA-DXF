import Link from "next/link";
import { ScrollRegion } from "@/components/ui/ScrollRegion";
import type { ProjectRow } from "@/server/projects";

export const TYPE_LABELS: Record<ProjectRow["type"], string> = { render: "Render IA", cad: "Model DXF 3D" };
export const STATUS_LABELS: Record<ProjectRow["status"], string> = { in_progress: "En curs", approved: "Aprovat", delivered: "Lliurat" };

export function ProjectTable({ rows, empty }: { rows: ProjectRow[]; empty: string }) {
  return (
    <ScrollRegion label="Taula de projectes">
      <table className="w-full min-w-[560px] text-left text-[15px]">
        <thead>
          <tr className="border-b border-border text-xs tracking-wider text-text-muted uppercase">
            <th scope="col" className="py-3 font-medium">Projecte</th>
            <th scope="col" className="py-3 font-medium">Tipus</th>
            <th scope="col" className="py-3 font-medium">Última versió</th>
            <th scope="col" className="py-3 font-medium">Estat</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-6 text-text-muted">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-b-0">
                <td className="py-3">
                  <Link href={row.href} className="font-medium underline-offset-4 hover:underline">
                    {row.name}
                  </Link>
                </td>
                <td className="py-3">{TYPE_LABELS[row.type]}</td>
                <td className="py-3 font-mono">{row.latestVersion ? `V${row.latestVersion}` : "—"}</td>
                <td className="py-3">
                  <span className={`rounded-full px-3 py-1 text-[13px] font-medium ${row.status === "in_progress" ? "bg-tint-orange" : "bg-tint-gray"}`}>
                    {STATUS_LABELS[row.status]}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </ScrollRegion>
  );
}
