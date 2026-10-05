"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { checkUploads, newId } from "@/features/shared/uploads";
import { usePersistedReducer } from "@/features/shared/usePersistedReducer";
import {
  initialRenderState,
  persistableRenderState,
  renderReducer,
  restoreRenderState,
  type NewImage,
  type RenderAction,
  type RenderFlowState,
} from "./state";

export const RENDER_UPLOAD_RULES = { extensions: [".png", ".jpg", ".jpeg"], maxBytes: 40 * 1024 * 1024, maxCount: 10 } as const;
export const RENDER_ACCEPT = "image/png,image/jpeg,.png,.jpg,.jpeg";

type ContextValue = {
  state: RenderFlowState;
  dispatch: (action: RenderAction) => void;
  /** Validates and adds files; returns the user-facing errors. */
  addImages: (files: File[], target?: "images" | "vegetation") => string[];
  uploadErrors: string[];
};

const RenderFlowContext = createContext<ContextValue | null>(null);

const hydrate = (raw: unknown): RenderAction => ({ type: "hydrate", state: restoreRenderState(raw) });

export function RenderFlowProvider({ children }: { children: React.ReactNode }) {
  const [state, rawDispatch] = usePersistedReducer("cr.render-flow.v1", renderReducer, initialRenderState, persistableRenderState, hydrate);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const urls = useRef(new Map<string, string>());

  const dispatch = useCallback(
    (action: RenderAction) => {
      if (action.type === "removeImage") {
        const url = urls.current.get(action.id);
        if (url) URL.revokeObjectURL(url);
        urls.current.delete(action.id);
      }
      rawDispatch(action);
    },
    [rawDispatch],
  );

  const addImages = useCallback(
    (files: File[], target: "images" | "vegetation" = "images") => {
      const { accepted, errors } = checkUploads(files, state.images.length, RENDER_UPLOAD_RULES);
      const images: NewImage[] = accepted.map((file) => {
        const id = newId();
        const url = URL.createObjectURL(file);
        urls.current.set(id, url);
        return { id, name: file.name, size: file.size, url };
      });
      if (target === "vegetation") images.forEach((image) => rawDispatch({ type: "addVegetationReference", image }));
      else if (images.length > 0) rawDispatch({ type: "addImages", images });
      setUploadErrors(errors);
      return errors;
    },
    [rawDispatch, state.images.length],
  );

  useEffect(() => {
    const map = urls.current;
    return () => map.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const value = useMemo(() => ({ state, dispatch, addImages, uploadErrors }), [state, dispatch, addImages, uploadErrors]);
  return <RenderFlowContext.Provider value={value}>{children}</RenderFlowContext.Provider>;
}

export function useRenderFlow(): ContextValue {
  const value = useContext(RenderFlowContext);
  if (!value) throw new Error("useRenderFlow must be used inside RenderFlowProvider");
  return value;
}
