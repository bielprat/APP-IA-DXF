"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { apiFetch } from "@/lib/client/api";
import { checkUploads } from "@/features/shared/uploads";
import { usePersistedReducer } from "@/features/shared/usePersistedReducer";
import { initialRenderState, persistableRenderState, renderReducer, restoreRenderState, type RenderAction, type RenderFlowState } from "./state";

export const RENDER_UPLOAD_RULES = { extensions: [".png", ".jpg", ".jpeg"], maxBytes: 40 * 1024 * 1024, maxCount: 10 } as const;
export const RENDER_ACCEPT = "image/png,image/jpeg,.png,.jpg,.jpeg";

type UploadResponse = { projectId: string; asset: { id: string; fileName: string; url: string } };

type ContextValue = {
  state: RenderFlowState;
  dispatch: (action: RenderAction) => void;
  /** Validates, uploads to the server and adds the images. */
  addImages: (files: File[], target?: "images" | "vegetation") => Promise<void>;
  uploading: boolean;
  uploadErrors: string[];
};

const RenderFlowContext = createContext<ContextValue | null>(null);

const hydrate = (raw: unknown): RenderAction => ({ type: "hydrate", state: restoreRenderState(raw) });

export function RenderFlowProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = usePersistedReducer("cr.render-flow.v2", renderReducer, initialRenderState, persistableRenderState, hydrate);
  const [uploading, setUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const addImages = useCallback(
    async (files: File[], target: "images" | "vegetation" = "images") => {
      const { accepted, errors } = checkUploads(files, state.images.length, RENDER_UPLOAD_RULES);
      setUploadErrors(errors);
      if (accepted.length === 0) return;
      setUploading(true);
      let projectId = state.projectId;
      // One by one: the first upload creates the project the others belong to.
      for (const file of accepted) {
        const form = new FormData();
        form.append("file", file);
        if (projectId) form.append("projectId", projectId);
        try {
          const result = await apiFetch<UploadResponse>("/api/uploads", { method: "POST", body: form });
          if (result.projectId !== projectId) {
            projectId = result.projectId;
            dispatch({ type: "setProject", projectId });
          }
          const image = { id: result.asset.id, name: result.asset.fileName, url: result.asset.url };
          dispatch(target === "vegetation" ? { type: "addVegetationReference", image } : { type: "addImages", images: [image] });
        } catch (error) {
          errors.push(`«${file.name}»: ${error instanceof Error ? error.message : "no s'ha pogut pujar."}`);
          setUploadErrors([...errors]);
        }
      }
      setUploading(false);
    },
    [dispatch, state.images.length, state.projectId],
  );

  const value = useMemo(() => ({ state, dispatch, addImages, uploading, uploadErrors }), [state, dispatch, addImages, uploading, uploadErrors]);
  return <RenderFlowContext.Provider value={value}>{children}</RenderFlowContext.Provider>;
}

export function useRenderFlow(): ContextValue {
  const value = useContext(RenderFlowContext);
  if (!value) throw new Error("useRenderFlow must be used inside RenderFlowProvider");
  return value;
}
