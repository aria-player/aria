import { useContext } from "react";
import { Menu } from "react-contexify";
import { MenuContext } from "../../contexts/MenuContext";
import { TrackMenuItems } from "./items/TrackMenuItems";

const id = "track";

export function TrackContextMenu() {
  const { updateVisibility } = useContext(MenuContext);

  return (
    <Menu
      onContextMenu={(e) => {
        e.preventDefault();
        return false;
      }}
      id={id}
      animation={false}
      onVisibilityChange={(isVisible) => updateVisibility(id, isVisible)}
    >
      <TrackMenuItems />
    </Menu>
  );
}
