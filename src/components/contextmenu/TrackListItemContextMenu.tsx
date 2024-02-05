import { Item, Menu } from "react-contexify";
import { MenuContext } from "../../contexts/MenuContext";
import { useContext } from "react";
import { GridContext } from "../../contexts/GridContext";
import { t } from "i18next";

const id = "tracklistitem";

export function TrackListItemContextMenu() {
  const { updateVisibility } = useContext(MenuContext);
  const gridRef = useContext(GridContext).gridRef;

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
      <Item disabled>
        {t("tracks.selectedCount", {
          count: gridRef?.current?.api?.getSelectedRows()?.length
        })}
      </Item>
    </Menu>
  );
}
