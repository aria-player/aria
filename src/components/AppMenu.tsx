import { Item, Submenu, RightSlot } from "react-contexify";
import { MenuItem, handleMenuAction, selectMenuState } from "../app/menu";
import { isTauri } from "../app/utils";
import { useAppDispatch, useAppSelector } from "../app/hooks";

export function AppMenu(props: {
  schema: MenuItem[];
  onItemClick?: (id: string) => void;
}) {
  const dispatch = useAppDispatch();
  const menuState = useAppSelector(selectMenuState);

  if (
    (!isTauri() && props.schema.every((item) => item.tauri === true)) ||
    props.schema.length === 0
  ) {
    return (
      <Item disabled>
        <i>(no actions)</i>
      </Item>
    );
  }
  return props.schema.map((item: MenuItem) => {
    if (item.tauri && !isTauri()) {
      return null;
    }
    if (item.submenu) {
      return (
        <Submenu key={item.id} label={item.label}>
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
  });
}
