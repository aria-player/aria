use serde::{Deserialize, Serialize};
use std::env::consts::OS;
use tauri::{CustomMenuItem, Menu, Submenu};

#[derive(Serialize, Deserialize, Debug)]
pub struct MenuItem {
    id: String,
    label: Option<String>,
    shortcut: Option<String>,
    submenu: Option<Vec<MenuItem>>,
    tauri: Option<bool>,
    winlinuxonly: Option<bool>,
    maconly: Option<bool>,
}

pub fn read_menu_json() -> Vec<MenuItem> {
    const MENUS: &str = include_str!("../../shared/menus.json");
    serde_json::from_str(MENUS).expect("JSON was not well-formatted")
}

pub fn create_menu_from_json(items: &[MenuItem]) -> Menu {
    items.iter().fold(Menu::new(), |menu, item| {
        if should_include_item(item) {
            menu.add_submenu(create_menu_item(item))
        } else {
            menu
        }
    })
}

fn should_include_item(item: &MenuItem) -> bool {
    if item.maconly.map_or(false, |v| v.to_owned()) {
        return OS == "macos";
    }
    if item.winlinuxonly.map_or(false, |v| v.to_owned()) {
        return OS == "windows" || OS == "linux";
    }
    true
}

fn should_add_separator(index: usize, items: &[MenuItem]) -> bool {
    let previous_item =
        index > 0 && items[index - 1].id != "separator" && should_include_item(&items[index - 1]);
    let next_item = index < items.len() - 1
        && items[index + 1].id != "separator"
        && should_include_item(&items[index + 1]);
    previous_item && next_item
}

fn create_menu_item(item: &MenuItem) -> Submenu {
    let mut menu = Menu::new();
    if let Some(submenu_items) = &item.submenu {
        for (index, sub_item) in submenu_items.iter().enumerate() {
            if !should_include_item(sub_item) {
                continue;
            }
            match sub_item.id.as_str() {
                "separator" => {
                    if should_add_separator(index, submenu_items) {
                        menu = menu.add_native_item(tauri::MenuItem::Separator);
                    }
                    continue;
                }
                "mac_services" => {
                    menu = menu.add_native_item(tauri::MenuItem::Services);
                    continue;
                }
                "mac_hide" => {
                    menu = menu.add_native_item(tauri::MenuItem::Hide);
                    continue;
                }
                "mac_hide_others" => {
                    menu = menu.add_native_item(tauri::MenuItem::HideOthers);
                    continue;
                }
                "mac_show_all" => {
                    menu = menu.add_native_item(tauri::MenuItem::ShowAll);
                    continue;
                }
                "mac_minimize" => {
                    menu = menu.add_native_item(tauri::MenuItem::Minimize);
                    continue;
                }
                "mac_zoom" => {
                    menu = menu.add_native_item(tauri::MenuItem::Zoom);
                    continue;
                }
                _ => {}
            }
            if sub_item.submenu.is_some() {
                menu = menu.add_submenu(create_menu_item(sub_item));
            } else {
                let default_label = &String::new();
                let label_value = sub_item.label.as_ref().unwrap_or(default_label);
                let mut custom_menu_item =
                    CustomMenuItem::new(sub_item.id.clone(), label_value.to_string());
                if let Some(shortcut) = &sub_item.shortcut {
                    custom_menu_item.keyboard_accelerator = Some(shortcut.clone());
                }
                menu = menu.add_item(custom_menu_item);
            }
        }
    } else {
        menu = menu.add_item(CustomMenuItem::new(
            item.id.clone(),
            item.label.as_ref().unwrap_or(&String::new()),
        ));
    }
    Submenu::new(item.label.as_ref().unwrap_or(&String::new()), menu)
}
