import type { Role } from "@/lib/auth/access";

export type IconName = "home" | "image" | "cube" | "leaf" | "folder";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  /** Path prefix that marks the item as active. */
  match: string;
  adminOnly?: boolean;
};

export const MAIN_NAV: readonly NavItem[] = [
  { href: "/", label: "Inici", icon: "home", match: "/" },
  { href: "/render/upload", label: "Millora de renders", icon: "image", match: "/render" },
  { href: "/cad/upload", label: "Modelatge 3D (DXF)", icon: "cube", match: "/cad" },
  { href: "/admin/vegetation-library", label: "Biblioteca de vegetació", icon: "leaf", match: "/admin/vegetation-library", adminOnly: true },
  { href: "/projects", label: "Projectes", icon: "folder", match: "/projects" },
];

export function visibleNavItems(role: Role): NavItem[] {
  return MAIN_NAV.filter((item) => !item.adminOnly || role === "admin");
}

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.match === "/") return pathname === "/";
  return pathname === item.match || pathname.startsWith(`${item.match}/`);
}

export type Step = { href: string; label: string };

export const RENDER_STEPS: readonly Step[] = [
  { href: "/render/upload", label: "Pujar render" },
  { href: "/render/improve", label: "Què millorar" },
  { href: "/render/details", label: "Detalls" },
  { href: "/render/generate", label: "Fidelitat i generar" },
  { href: "/render/result", label: "Resultat" },
];

export const CAD_STEPS: readonly Step[] = [
  { href: "/cad/upload", label: "Pujar fonts" },
  { href: "/cad/elements", label: "Què modelar" },
  { href: "/cad/parameters", label: "Paràmetres" },
  { href: "/cad/generate", label: "Format i generar" },
  { href: "/cad/result", label: "Model generat" },
];
