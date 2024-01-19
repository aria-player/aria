use serde::{Deserialize, Serialize};
use std::env::consts::OS;
use tauri::{CustomMenuItem, Menu, Submenu};

#[derive(Serialize, Deserialize, Debug)]
pub struct MenuItem {
    pub id: String,
    pub shortcut: Option<String>,
    pub submenu: Option<Vec<MenuItem>>,
    pub maconly: Option<bool>,
    pub winlinuxonly: Option<bool>,
    pub keepopen: Option<bool>,
}

pub fn read_menu_json() -> Vec<MenuItem> {
    const MENUS: &str = include_str!("../../shared/menus.json");
    serde_json::from_str(MENUS).expect("JSON was not well-formatted")
}

pub fn create_menu_from_json(items: &[MenuItem], labels: &serde_json::Value) -> Menu {
    items.iter().fold(Menu::new(), |menu, item| {
        if should_include_item(item) {
            menu.add_submenu(create_menu_item(item, labels))
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

fn create_menu_item(item: &MenuItem, labels: &serde_json::Value) -> Submenu {
    let mut menu = Menu::new();
    let parent_label = labels["menu"][&item.id].as_str().unwrap_or(&item.id);
    if let Some(submenu_items) = &item.submenu {
        for (index, sub_item) in submenu_items.iter().enumerate() {
            if !should_include_item(sub_item) {
                continue;
            }
            let sub_item_label = if sub_item.id.contains('.') {
                let parts: Vec<&str> = sub_item.id.split('.').collect();
                labels[parts[0]][parts[1]].as_str().unwrap_or(&sub_item.id)
            } else {
                labels["menu"][&sub_item.id]
                    .as_str()
                    .unwrap_or(&sub_item.id)
            };
            match sub_item.id.as_str() {
                "separator" => {
                    if should_add_separator(index, submenu_items) {
                        menu = menu.add_native_item(tauri::MenuItem::Separator);
                    }
                    continue;
                }
                "macServices" => {
                    menu = menu.add_native_item(tauri::MenuItem::Services);
                    continue;
                }
                "macHide" => {
                    menu = menu.add_native_item(tauri::MenuItem::Hide);
                    continue;
                }
                "macHideOthers" => {
                    menu = menu.add_native_item(tauri::MenuItem::HideOthers);
                    continue;
                }
                "macShowAll" => {
                    menu = menu.add_native_item(tauri::MenuItem::ShowAll);
                    continue;
                }
                "macMinimize" => {
                    menu = menu.add_native_item(tauri::MenuItem::Minimize);
                    continue;
                }
                "macZoom" => {
                    menu = menu.add_native_item(tauri::MenuItem::Zoom);
                    continue;
                }
                _ => {}
            }
            if sub_item.submenu.is_some() {
                menu = menu.add_submenu(create_menu_item(sub_item, labels));
            } else {
                let mut custom_menu_item =
                    CustomMenuItem::new(sub_item.id.clone(), sub_item_label.to_string());
                if let Some(shortcut) = &sub_item.shortcut {
                    custom_menu_item.keyboard_accelerator = Some(shortcut.clone());
                }
                menu = menu.add_item(custom_menu_item);
            }
        }
    } else {
        menu = menu.add_item(CustomMenuItem::new(
            item.id.clone(),
            parent_label.to_string(),
        ));
    }
    Submenu::new(parent_label.to_string(), menu)
}
