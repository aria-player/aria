import { MutableRefObject, createContext } from "react";
import { ReactNode, useRef } from "react";
import { Item, SectionTreeApi } from "soprano-ui";

export const TreeContext = createContext<{
  treeRef: MutableRefObject<SectionTreeApi<Item> | null> | null;
}>({
  treeRef: null
});

export function TreeProvider({ children }: { children: ReactNode }) {
  const treeRef = useRef<SectionTreeApi<Item>>(null);
  return (
    <TreeContext.Provider value={{ treeRef }}>{children}</TreeContext.Provider>
  );
}
