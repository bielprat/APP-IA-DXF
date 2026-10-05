"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { checkUploads, newId } from "@/features/shared/uploads";
import { usePersistedReducer } from "@/features/shared/usePersistedReducer";
import { cadReducer, initialCadState, persistableCadState, restoreCadState, type CadAction, type CadFlowState } from "./state";

export const CAD_UPLOAD_RULES = {
  extensions: [".dwg", ".dxf", ".pdf", ".png", ".jpg", ".jpeg"],
  maxBytes: 100 * 1024 * 1024,
  maxCount: 20,
} as const;
export const CAD_ACCEPT = ".dwg,.dxf,.pdf,.png,.jpg,.jpeg";

type ContextValue = {
  state: CadFlowState;
  dispatch: (action: CadAction) => void;
  addFiles: (files: File[]) => void;
  uploadErrors: string[];
};

const CadFlowContext = createContext<ContextValue | null>(null);

const hydrate = (raw: unknown): CadAction => ({ type: "hydrate", state: restoreCadState(raw) });

export function CadFlowProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = usePersistedReducer("cr.cad-flow.v1", cadReducer, initialCadState, persistableCadState, hydrate);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const addFiles = useCallback(
    (files: File[]) => {
      const { accepted, errors } = checkUploads(files, state.files.length, CAD_UPLOAD_RULES);
      if (accepted.length > 0) dispatch({ type: "addFiles", files: accepted.map((file) => ({ id: newId(), name: file.name, size: file.size })) });
      setUploadErrors(errors);
    },
    [dispatch, state.files.length],
  );

  const value = useMemo(() => ({ state, dispatch, addFiles, uploadErrors }), [state, dispatch, addFiles, uploadErrors]);
  return <CadFlowContext.Provider value={value}>{children}</CadFlowContext.Provider>;
}

export function useCadFlow(): ContextValue {
  const value = useContext(CadFlowContext);
  if (!value) throw new Error("useCadFlow must be used inside CadFlowProvider");
  return value;
}
