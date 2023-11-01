import { Item, Submenu, RightSlot, Separator } from "react-contexify";
import { MenuItem, handleMenuAction, selectMenuState } from "../app/menu";
import { isTauri } from "../app/utils";
import { useAppDispatch, useAppSelector } from "../app/hooks";

export function AppMenu(props: {
  schema: MenuItem[];
  onItemClick?: (id: string) => void;
}) {
  const dispatch = useAppDispatch();
  const menuState = useAppSelector(selectMenuState);

  const platformItems = props.schema.filter(
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
        <i>(no actions)</i>
      </Item>
    );
  }
  return (
    <>
      {items.map((item: MenuItem, index: number) => {
        if (item.id === "separator") {
          return <Separator key={index} />;
        }
        if (item.submenu) {
          return (
            <Submenu
              key={item.id}
              label={item.label}
              disabled={menuState[item.id as keyof typeof menuState]?.disabled}
            >
              <AppMenu schema={item.submenu} />
            </Submenu>
          );
        }
        return (
          <Item
            onClick={() => {
              handleMenuAction(dispatch, item.id);
              props.onItemClick?.(item.id);
            }}
            key={item.id}
            disabled={menuState[item.id as keyof typeof menuState]?.disabled}
          >
            {item.label}
            <RightSlot>{item.shortcut}</RightSlot>
          </Item>
        );
      })}
    </>
  );
}
