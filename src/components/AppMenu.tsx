import { Item, Submenu, RightSlot, Separator } from "react-contexify";
import { MenuItem, MenuItemState, selectMenuState } from "../app/menu";
import { isTauri } from "../app/utils";
import { useAppSelector } from "../app/hooks";
import { useTranslation } from "react-i18next";
import { useMenuActions } from "../hooks/useMenuActions";
import styles from "./AppMenu.module.css";

export function AppMenu(props: {
  items: MenuItem[];
  onItemClick?: (id: string) => void;
}) {
  const { t } = useTranslation();

  const menuState: { [key: string]: MenuItemState } =
    useAppSelector(selectMenuState);
  const { invokeMenuAction } = useMenuActions();

  const platformItems = props.items.filter(
    (item) => !item.maconly && (!item.winlinuxonly || isTauri())
  );

  function shouldAddSeparator(
    item: MenuItem,
    index: number,
    items: MenuItem[]
  ): boolean {
    if (item.id !== "separator") return true;
    const previousItem = index > 0 && items[index - 1].id !== "separator";
    const nextItem =
      index < items.length - 1 && items[index + 1].id !== "separator";
    return previousItem && nextItem;
  }

  const items = platformItems.filter((item, index, self) =>
    shouldAddSeparator(item, index, self)
  );

  if (items.length === 0) {
    return (
      <Item disabled>
        <i>{t("menu.noActions")}</i>
      </Item>
    );
  }
  return (
    <>
      {items.map((item: MenuItem, index: number) => {
        if (item.id === "separator") {
          return <Separator key={index} />;
        }
        const label = item.id.includes(".") ? t(item.id) : t("menu." + item.id);
        const menuStateId = item.id as keyof typeof menuState;
        if (item.submenu) {
          return (
            <Submenu
              key={item.id}
              label={label}
              disabled={menuState[menuStateId]?.disabled}
            >
              <AppMenu items={item.submenu} />
            </Submenu>
          );
        }
        return (
          <Item
            onClick={() => {
              invokeMenuAction(item.id);
              props.onItemClick?.(item.id);
            }}
            key={item.id}
            disabled={menuState[menuStateId]?.disabled}
            closeOnClick={!item.keepopen}
          >
            <span className={styles.tick}>
              {menuState[menuStateId]?.selected ? "✔" : ""}
            </span>
            {label}
            <RightSlot>{item.shortcut?.replace("Arrow", "")}</RightSlot>
          </Item>
        );
      })}
    </>
  );
}
