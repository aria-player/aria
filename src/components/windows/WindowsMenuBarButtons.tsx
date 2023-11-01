import { Menu, useContextMenu } from "react-contexify";
import menus from "../../../shared/menus.json";
import "react-contexify/dist/ReactContexify.css";
import React, { useEffect, useState } from "react";
import styles from "./WindowsMenuBarButtons.module.css";
import { AppMenu } from "../AppMenu";

export function WindowsMenuBarButtons() {
  const { show, hideAll } = useContextMenu();
  const [open, setOpen] = useState(false);
  const [altHeld, setAltHeld] = useState(false);
  const buttonRefs = React.useMemo<
    Record<string, React.RefObject<HTMLButtonElement>>
  >(() => {
    return {};
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Alt" && !event.repeat) {
        setAltHeld(true);
      } else if (event.key != "Alt" && event.altKey) {
        menus
          .filter((item) => !item.maconly)
          .forEach((category) => {
            if (
              event.key.toLowerCase() === category.label.charAt(0).toLowerCase()
            ) {
              buttonRefs[category.id].current?.click();
            }
          });
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Alt") {
        setAltHeld(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [buttonRefs]);

  const showMenu = (e: React.MouseEvent, menuId: string) => {
    const targetDiv = e.currentTarget as HTMLDivElement;
    const divRect = targetDiv?.getBoundingClientRect();
    if (!divRect) return;
    show({
      id: menuId,
      event: e,
      position: {
        x: divRect.left,
        y: divRect.bottom + 4
      }
    });
  };

  const handleVisibilityChange = (isVisible: boolean) => {
    if (open == true && isVisible == false) {
      setOpen(false);
    }
  };

  const handleMenuHover = (e: React.MouseEvent, menuId: string) => {
    if (!open) return;
    hideAll();
    showMenu(e, menuId);
  };

  const handleMenuClick = (e: React.MouseEvent, menuId: string) => {
    if (open) {
      hideAll();
      setOpen(false);
      return;
    }
    setOpen(true);
    showMenu(e, menuId);
  };

  return (
    <>
      {menus
        .filter((item) => !item.maconly)
        .map((category) => {
          if (!buttonRefs[category.id]) {
            buttonRefs[category.id] = React.createRef<HTMLButtonElement>();
          }
          return (
            <React.Fragment key={category.id}>
              <Menu
                id={category.id}
                animation={false}
                onVisibilityChange={handleVisibilityChange}
              >
                <AppMenu
                  items={category.submenu}
                  onItemClick={() => {
                    hideAll();
                    setOpen(false);
                  }}
                />
              </Menu>
              <button
                ref={buttonRefs[category.id]}
                className={styles.menuButton}
                onClick={(e) => handleMenuClick(e, category.id)}
                onMouseOver={(e) => handleMenuHover(e, category.id)}
              >
                {altHeld ? (
                  <>
                    <u>{category.label.charAt(0)}</u>
                    {category.label.slice(1)}
                  </>
                ) : (
                  category.label
                )}
              </button>
            </React.Fragment>
          );
        })}
    </>
  );
}
