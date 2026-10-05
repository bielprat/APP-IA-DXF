import { CadFlowProvider } from "@/features/cad/CadFlowProvider";

export default function CadLayout({ children }: { children: React.ReactNode }) {
  return <CadFlowProvider>{children}</CadFlowProvider>;
}
