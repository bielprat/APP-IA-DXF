import { RenderFlowProvider } from "@/features/render/RenderFlowProvider";

export default function RenderLayout({ children }: { children: React.ReactNode }) {
  return <RenderFlowProvider>{children}</RenderFlowProvider>;
}
