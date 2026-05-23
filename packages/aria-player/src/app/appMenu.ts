import type { MenuItem as SopranoMenuItem, MenubarMenu } from "soprano-ui";
import type { MenuItem as JsonMenuItem, MenuItemState } from "./menu";
import { isTauri } from "./utils";
import { IS_MAC_LIKE } from "./constants";

function formatShortcut(shortcut: string | undefined): string | undefined {
  if (!shortcut) return undefined;
  return shortcut
    .replace("ArrowLeft", "←")
    .replace("ArrowRight", "→")
    .replace("ArrowUp", "↑")
    .replace("ArrowDown", "↓")
    .replace("Ctrl", IS_MAC_LIKE ? "⌘" : "Ctrl")
    .replace("Alt", IS_MAC_LIKE ? "⌥" : "Alt")
    .replace("Delete", IS_MAC_LIKE ? "⌫" : "Del");
}

function filterPlatform(items: JsonMenuItem[]): JsonMenuItem[] {
  return items.filter(
    (item) =>
      !item.maconly &&
      (!item.winlinuxonly || isTauri()) &&
      (!item.webonly || !isTauri())
  );
}

function deduplicateSeparators(items: JsonMenuItem[]): JsonMenuItem[] {
  return items.filter((item, index, self) => {
    if (item.id !== "separator") return true;
    const prevIsItem = index > 0 && self[index - 1].id !== "separator";
    const nextIsItem =
      index < self.length - 1 && self[index + 1].id !== "separator";
    return prevIsItem && nextIsItem;
  });
}

export function buildMenuItems(
  items: JsonMenuItem[],
  menuState: Record<string, MenuItemState>,
  t: (key: string) => string,
  invokeAction: (id: string) => void
): SopranoMenuItem[] {
  const filtered = deduplicateSeparators(filterPlatform(items));
  const result: SopranoMenuItem[] = [];

  for (const item of filtered) {
    if (item.id === "separator") {
      result.push({ type: "separator" });
      continue;
    }

    const state = menuState[item.id] ?? {};
    const label =
      state.label ?? t(item.id.includes(".") ? item.id : "menu." + item.id);

    if (item.submenu) {
      const subItems = buildMenuItems(item.submenu, menuState, t, invokeAction);
      result.push({
        type: "submenu",
        label,
        disabled: state.disabled,
        items: subItems,
      });
      continue;
    }

    if (item.checkbox) {
      result.push({
        type: "checkbox",
        label,
        checked: state.selected ?? false,
        disabled: state.disabled,
        onCheckedChange: () => invokeAction(item.id),
      });
    } else {
      result.push({
        label,
        shortcut: formatShortcut(item.shortcut),
        disabled: state.disabled,
        onSelect: () => invokeAction(item.id),
      });
    }
  }

  return result;
}

export function buildMenubarMenus(
  menus: JsonMenuItem[],
  menuState: Record<string, MenuItemState>,
  t: (key: string) => string,
  invokeAction: (id: string) => void
): MenubarMenu[] {
  return filterPlatform(menus).map((category) => ({
    label: t("menu." + category.id),
    items: buildMenuItems(category.submenu!, menuState, t, invokeAction),
  }));
}
