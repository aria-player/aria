import { Menubar as Primitive } from "radix-ui";
import { MenuItems } from "../shared/MenuItems";
import type { MenubarMenu } from "../shared/menu-types";
import menuStyles from "../shared/menu.module.css";
import styles from "./Menubar.module.css";

export interface MenubarProps {
  menus: MenubarMenu[];
}

export function Menubar({ menus }: MenubarProps) {
  return (
    <Primitive.Root className={styles.root}>
      {menus.map((menu, i) => (
        <Primitive.Menu key={i}>
          <Primitive.Trigger
            className={styles.trigger}
            disabled={menu.disabled}
          >
            {menu.label}
          </Primitive.Trigger>
          <Primitive.Portal>
            <Primitive.Content className={menuStyles.content} sideOffset={4}>
              <MenuItems items={menu.items} primitives={Primitive} />
            </Primitive.Content>
          </Primitive.Portal>
        </Primitive.Menu>
      ))}
    </Primitive.Root>
  );
}
