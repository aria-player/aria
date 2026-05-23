import type { DropdownMenu } from "radix-ui";
import type { MenuItem } from "./menu-types";
import styles from "./menu.module.css";
import ChevronRight from "../assets/chevron-right-solid.svg?react";

type MenuPrimitives = Pick<
  typeof DropdownMenu,
  | "Item"
  | "CheckboxItem"
  | "RadioGroup"
  | "RadioItem"
  | "ItemIndicator"
  | "Label"
  | "Separator"
  | "Sub"
  | "SubTrigger"
  | "SubContent"
  | "Portal"
>;

export function MenuItems({
  items,
  primitives: P,
}: {
  items: MenuItem[];
  primitives: MenuPrimitives;
}) {
  return (
    <div className={styles.scrollWrapper}>
      {items.map((item, i) => (
        <MenuItemEntry key={i} item={item} primitives={P} />
      ))}
    </div>
  );
}

function MenuItemEntry({
  item,
  primitives: P,
}: {
  item: MenuItem;
  primitives: MenuPrimitives;
}) {
  switch (item.type) {
    case undefined:
    case "item":
      return (
        <P.Item
          className={styles.item}
          disabled={item.disabled}
          onSelect={() => item.onSelect?.()}
        >
          {item.icon}
          {item.label}
          {item.shortcut && (
            <span style={{ marginLeft: "auto", paddingLeft: "0.5rem" }}>
              {item.shortcut}
            </span>
          )}
        </P.Item>
      );

    case "separator":
      return <P.Separator className={styles.separator} />;

    case "label":
      return <P.Label className={styles.label}>{item.label}</P.Label>;

    case "submenu":
      return (
        <P.Sub>
          <P.SubTrigger className={styles.subTrigger} disabled={item.disabled}>
            {item.icon}
            {item.label}
            <ChevronRight
              style={{ height: "0.6rem", width: "auto", marginLeft: "auto" }}
            />
          </P.SubTrigger>
          <P.Portal>
            <P.SubContent
              className={styles.subContent}
              sideOffset={4}
              ref={(element) => {
                if (!element) return;
                requestAnimationFrame(() => {
                  const rect = element.getBoundingClientRect();
                  const rightOverflow =
                    rect.right - document.documentElement.clientWidth;
                  const leftOverflow = -rect.left;
                  if (rightOverflow > 0)
                    element.style.transform += ` translateX(-${Math.ceil(rightOverflow)}px)`;
                  else if (leftOverflow > 0)
                    element.style.transform += ` translateX(${Math.ceil(leftOverflow)}px)`;
                });
              }}
            >
              <MenuItems items={item.items} primitives={P} />
            </P.SubContent>
          </P.Portal>
        </P.Sub>
      );

    case "checkbox":
      return (
        <P.CheckboxItem
          className={styles.checkboxItem}
          checked={item.checked}
          onCheckedChange={item.onCheckedChange}
          onSelect={(e) => e.preventDefault()}
          disabled={item.disabled}
        >
          <P.ItemIndicator className={styles.itemIndicator}>✔</P.ItemIndicator>
          {item.label}
        </P.CheckboxItem>
      );

    case "radio-group":
      return (
        <P.RadioGroup value={item.value} onValueChange={item.onValueChange}>
          {item.items.map((radio) => (
            <P.RadioItem
              key={radio.value}
              className={styles.radioItem}
              value={radio.value}
              disabled={radio.disabled}
            >
              <P.ItemIndicator className={styles.itemIndicator}>
                ●
              </P.ItemIndicator>
              {radio.label}
            </P.RadioItem>
          ))}
        </P.RadioGroup>
      );

    default:
      return null;
  }
}
