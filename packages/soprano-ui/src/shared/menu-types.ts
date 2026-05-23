import type { ReactNode } from "react";

export type MenuItem =
  | MenuItemAction
  | MenuItemSeparator
  | MenuItemLabel
  | MenuItemSubmenu
  | MenuItemCheckbox
  | MenuItemRadioGroup;

export interface MenuItemAction {
  type?: "item";
  label: ReactNode;
  icon?: ReactNode;
  shortcut?: ReactNode;
  disabled?: boolean;
  onSelect?: () => void;
}

export interface MenuItemSeparator {
  type: "separator";
}

export interface MenuItemLabel {
  type: "label";
  label: ReactNode;
}

export interface MenuItemSubmenu {
  type: "submenu";
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  items: MenuItem[];
}

export interface MenuItemCheckbox {
  type: "checkbox";
  label: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export interface MenuItemRadioGroup {
  type: "radio-group";
  value: string;
  onValueChange: (value: string) => void;
  items: { label: ReactNode; value: string; disabled?: boolean }[];
}

export interface MenubarMenu {
  label: ReactNode;
  items: MenuItem[];
  disabled?: boolean;
}
