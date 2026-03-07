import { AgGridReact } from "ag-grid-react";
import {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  createContext,
  useState
} from "react";
import { ReactNode, useRef } from "react";

export const GridContext = createContext<{
  gridRef: MutableRefObject<AgGridReact | null> | null;
  isGridReady: boolean;
  setIsGridReady: Dispatch<SetStateAction<boolean>>;
}>({
  gridRef: null,
  isGridReady: false,
  setIsGridReady: () => {}
});

export function GridProvider({ children }: { children: ReactNode }) {
  const gridRef = useRef<AgGridReact>(null);
  const [isGridReady, setIsGridReady] = useState(false);
  return (
    <GridContext.Provider value={{ gridRef, isGridReady, setIsGridReady }}>
      {children}
    </GridContext.Provider>
  );
}
