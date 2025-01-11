use serde::{Deserialize, Serialize};
use std::env::consts::OS;
use tauri::{
    menu::{CheckMenuItem, IsMenuItem, Menu, MenuItemKind, PredefinedMenuItem, Submenu},
    AppHandle,
};

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

pub fn create_menu_from_json<R: tauri::Runtime>(
    handle: &AppHandle<R>,
    items: &[MenuItem],
    labels: &serde_json::Value,
) -> Result<Menu<R>, tauri::Error> {
    let menu = Menu::new(handle).unwrap();
    for item in create_menu_items(handle, items, labels).unwrap() {
        menu.append(&item).unwrap();
    }
    Ok(menu)
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

fn create_menu_items<R: tauri::Runtime>(
    handle: &AppHandle<R>,
    items: &[MenuItem],
    labels: &serde_json::Value,
) -> Result<Vec<MenuItemKind<R>>, tauri::Error> {
    let mut menu_items = Vec::new();
    for (index, sub_item) in items.iter().enumerate() {
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
        if let Some(submenu) = &sub_item.submenu {
            let submenu_items = create_menu_items(handle, submenu, labels)?;
            let submenu = Submenu::with_id_and_items(
                handle,
                sub_item.id.as_str(),
                sub_item_label,
                true,
                &submenu_items
                    .iter()
                    .map(|i| i as &dyn IsMenuItem<R>)
                    .collect::<Vec<&dyn IsMenuItem<R>>>(),
            )?;
            menu_items.push(MenuItemKind::Submenu(submenu));
        } else {
            match sub_item.id.as_str() {
                "separator" => {
                    if should_add_separator(index, items) {
                        let separator = PredefinedMenuItem::separator(handle).unwrap();
                        menu_items.push(MenuItemKind::Predefined(separator));
                    }
                }
                "macServices" => {
                    menu_items.push(MenuItemKind::Predefined(
                        PredefinedMenuItem::quit(handle, Some(sub_item_label)).unwrap(),
                    ));
                }
                "macHide" => {
                    menu_items.push(MenuItemKind::Predefined(
                        PredefinedMenuItem::hide(handle, Some(sub_item_label)).unwrap(),
                    ));
                }
                "macHideOthers" => {
                    menu_items.push(MenuItemKind::Predefined(
                        PredefinedMenuItem::hide_others(handle, Some(sub_item_label)).unwrap(),
                    ));
                }
                "macShowAll" => {
                    menu_items.push(MenuItemKind::Predefined(
                        PredefinedMenuItem::show_all(handle, Some(sub_item_label)).unwrap(),
                    ));
                }
                "macMinimize" => {
                    menu_items.push(MenuItemKind::Predefined(
                        PredefinedMenuItem::minimize(handle, Some(sub_item_label)).unwrap(),
                    ));
                }
                "macZoom" => {
                    // TODO: No PredefinedMenuItem for zoom at the moment
                    // https://github.com/tauri-apps/tauri/issues/11497
                    menu_items.push(MenuItemKind::Predefined(
                        PredefinedMenuItem::maximize(handle, Some(sub_item_label)).unwrap(),
                    ));
                }
                _ => {
                    // Just use CheckMenuItem for all items since the menu JSON doesn't specify which ones can be checked
                    let custom_item = CheckMenuItem::with_id(
                        handle,
                        sub_item.id.as_str(),
                        sub_item_label,
                        true,
                        false,
                        sub_item.shortcut.clone(),
                    )
                    .unwrap();
                    menu_items.push(MenuItemKind::Check(custom_item));
                }
            }
        }
    }
    Ok(menu_items)
}
