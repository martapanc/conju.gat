"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { loadData, type Dataset } from "@/lib/data";

type State = { data: Dataset | null; failed: boolean };

const DataContext = createContext<State>({ data: null, failed: false });

/** Loaded once and shared, so moving between pages never refetches 756 KB. */
export function DataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>({ data: null, failed: false });

  useEffect(() => {
    loadData()
      .then((data) => setState({ data, failed: false }))
      .catch(() => setState({ data: null, failed: true }));
  }, []);

  return <DataContext.Provider value={state}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}

/** Renders children only once the verbs are in memory. */
export function WithData({
  children,
}: {
  children: (data: Dataset) => React.ReactNode;
}) {
  const { data, failed } = useData();
  if (failed)
    return (
      <p className="empty">
        No es poden carregar els verbs. Comprova la connexió i torna a carregar
        la pàgina.
      </p>
    );
  if (!data) return <p className="empty">Carregant els verbs…</p>;
  return <>{children(data)}</>;
}
