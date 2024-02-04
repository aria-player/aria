import { useContext } from "react";
import { Item, Menu, Separator } from "react-contexify";
import { MenuContext } from "../../contexts/MenuContext";
import { TreeContext } from "../../contexts/TreeContext";
import { useAppDispatch } from "../../app/hooks";
import { resetLibraryLayout } from "../../features/library/librarySlice";
import { useTranslation } from "react-i18next";

const id = "sidebarlibrary";

export function SidebarLibraryContextMenu() {
  const { t } = useTranslation();
  const treeRef = useContext(TreeContext).treeRef;
  const { updateVisibility } = useContext(MenuContext);
  const dispatch = useAppDispatch();

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
      <Item
        onClick={() => {
          if (treeRef?.current?.visibilityEditing) {
            treeRef?.current?.setVisibilityEditing(null);
          } else {
            treeRef?.current?.setVisibilityEditing("library");
          }
        }}
      >
        {treeRef?.current?.visibilityEditing
          ? t("sidebar.library.menu.save")
          : t("sidebar.library.menu.edit")}
      </Item>
      <Separator />
      <Item
        onClick={() => {
          dispatch(resetLibraryLayout());
        }}
      >
        {t("sidebar.library.menu.reset")}
      </Item>
    </Menu>
  );
}
