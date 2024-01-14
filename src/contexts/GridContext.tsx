import { AgGridReact } from "@ag-grid-community/react";
import { MutableRefObject, createContext } from "react";
import { ReactNode, useRef } from "react";

export const GridContext = createContext<{
  gridRef: MutableRefObject<AgGridReact | null> | null;
}>({
  gridRef: null
});

export function GridProvider({ children }: { children: ReactNode }) {
  const gridRef = useRef<AgGridReact>(null);
  return (
    <GridContext.Provider value={{ gridRef }}>{children}</GridContext.Provider>
  );
}
