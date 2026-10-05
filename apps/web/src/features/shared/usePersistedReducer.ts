"use client";

import { useEffect, useReducer } from "react";

/**
 * useReducer whose serializable part survives a reload of the tab (sessionStorage).
 * Storage can be unavailable (private mode, blocked site data): the flow still works without it.
 */
export function usePersistedReducer<S, A>(
  key: string,
  reducer: (state: S, action: A) => S,
  initial: S,
  persist: (state: S) => unknown,
  hydrateAction: (raw: unknown) => A,
) {
  const [state, dispatch] = useReducer(reducer, initial);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(key);
      if (raw) dispatch(hydrateAction(JSON.parse(raw)));
    } catch {
      // Ignore unreadable storage.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once per mount
  }, [key]);

  useEffect(() => {
    // Never write the untouched initial state: it would overwrite stored choices before they
    // are restored (effects run twice under StrictMode).
    if (state === initial) return;
    try {
      window.sessionStorage.setItem(key, JSON.stringify(persist(state)));
    } catch {
      // Ignore quota or blocked storage.
    }
  }, [key, initial, persist, state]);

  return [state, dispatch] as const;
}
