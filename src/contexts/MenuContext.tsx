import { createContext, useState } from "react";
import { ReactNode } from "react";
import { Track } from "../features/tracks/tracksTypes";

type MenuData = {
  itemId: string;
  itemSource?: string;
  itemIndex?: number;
  metadata?: Track;
  type: "sidebaritem" | "tracklistitem";
};

export const MenuContext = createContext<{
  visibility: Record<string, boolean>;
  updateVisibility: (id: string, isVisible: boolean) => void;
  menuData: MenuData | null;
  setMenuData: (data: MenuData | null) => void;
}>({
  visibility: {},
  updateVisibility: () => {},
  menuData: null,
  setMenuData: () => {}
});

export function MenuProvider({ children }: { children: ReactNode }) {
  const [visibility, setVisibility] = useState({});
  const [menuData, setMenuData] = useState<MenuData | null>(null);

  const updateVisibility = (id: string, isVisible: boolean) => {
    setVisibility((prev) => ({ ...prev, [id]: isVisible }));
  };

  return (
    <MenuContext.Provider
      value={{ visibility, updateVisibility, menuData, setMenuData }}
    >
      {children}
    </MenuContext.Provider>
  );
}
