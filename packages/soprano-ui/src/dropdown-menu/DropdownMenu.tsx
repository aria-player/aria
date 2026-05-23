import React from "react";
import { DropdownMenu as Primitive } from "radix-ui";
import { MenuItems } from "../shared/MenuItems";
import type { MenuItem } from "../shared/menu-types";
import styles from "../shared/menu.module.css";

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: MenuItem[];
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DropdownMenu({
  trigger,
  items,
  align = "start",
  side = "bottom",
  sideOffset = 4,
  open,
  onOpenChange,
}: DropdownMenuProps) {
  return (
    <Primitive.Root open={open} onOpenChange={onOpenChange}>
      <Primitive.Trigger asChild>{trigger}</Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content
          className={styles.content}
          align={align}
          side={side}
          sideOffset={sideOffset}
        >
          <MenuItems items={items} primitives={Primitive} />
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
