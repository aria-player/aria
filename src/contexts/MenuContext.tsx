import { createContext, useState } from "react";
import { ReactNode } from "react";

export const MenuContext = createContext<{
  visibility: Record<string, boolean>;
  updateVisibility: (id: string, isVisible: boolean) => void;
}>({
  visibility: {},
  updateVisibility: () => {}
});

export function MenuProvider({ children }: { children: ReactNode }) {
  const [visibility, setVisibility] = useState({});

  const updateVisibility = (id: string, isVisible: boolean) => {
    setVisibility((prev) => ({ ...prev, [id]: isVisible }));
  };

  return (
    <MenuContext.Provider value={{ visibility, updateVisibility }}>
      {children}
    </MenuContext.Provider>
  );
}
