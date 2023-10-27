// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use tauri::{CustomMenuItem, Manager, Menu, Submenu, WindowEvent};
use window_shadows::set_shadow;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[derive(Serialize, Deserialize, Debug)]
struct MenuItemSchema {
    id: String,
    label: String,
    shortcut: Option<String>,
    submenu: Option<Vec<MenuItemSchema>>,
    tauri: Option<bool>,
}

fn read_menu_schema() -> Vec<MenuItemSchema> {
    const MENUS: &str = include_str!("../../shared/menus.json");
    serde_json::from_str(MENUS).expect("JSON was not well-formatted")
}

fn create_menu_from_schema(schema: &[MenuItemSchema]) -> Menu {
    schema.iter().fold(Menu::new(), |menu, item| {
        menu.add_submenu(create_menu_item(item))
    })
}

fn create_menu_item(item: &MenuItemSchema) -> Submenu {
    let mut menu = Menu::new();
    if let Some(submenu_items) = &item.submenu {
        for sub_item in submenu_items {
            if sub_item.submenu.is_some() {
                menu = menu.add_submenu(create_menu_item(sub_item));
            } else {
                let mut custom_menu_item =
                    CustomMenuItem::new(sub_item.id.clone(), sub_item.label.clone());
                if let Some(shortcut) = &sub_item.shortcut {
                    custom_menu_item.keyboard_accelerator = Some(shortcut.clone());
                }
                menu = menu.add_item(custom_menu_item);
            }
        }
    } else {
        menu = menu.add_item(CustomMenuItem::new(item.id.clone(), item.label.clone()));
    }
    Submenu::new(item.label.clone(), menu)
}

fn main() {
    let schema = read_menu_schema();
    let menu = create_menu_from_schema(&schema);
    tauri::Builder::default()
        .menu(menu)
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            set_shadow(&window, true).expect("Unsupported platform!");
            Ok(())
        })
        .on_window_event(|e| {
            if let WindowEvent::Resized(_) = e.event() {
                std::thread::sleep(std::time::Duration::from_nanos(1));
            }
        })
        .on_menu_event(|event| {
            event
                .window()
                .emit("menu_click", Some(event.menu_item_id()))
                .expect("failed to emit event");
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
