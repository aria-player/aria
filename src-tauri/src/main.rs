// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use serde_json::json;
use std::env::consts::OS;
use std::{collections::HashMap, path::PathBuf};
use tauri::{
    CustomMenuItem, Manager, Menu, Submenu, SystemTray, SystemTrayEvent, SystemTrayMenu,
    SystemTrayMenuItem, WindowEvent, Wry,
};
use tauri_plugin_store::JsonValue;
use tauri_plugin_store::{with_store, Store, StoreCollection};
use tauri_plugin_window_state::{AppHandleExt, StateFlags};
use window_shadows::set_shadow;

#[derive(Clone, serde::Serialize)]
struct Payload {
    args: Vec<String>,
    cwd: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct MenuItem {
    id: String,
    label: Option<String>,
    shortcut: Option<String>,
    submenu: Option<Vec<MenuItem>>,
    tauri: Option<bool>,
    winlinuxonly: Option<bool>,
    maconly: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug)]
struct MenuItemState {
    disabled: Option<bool>,
    selected: Option<bool>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn close(app_handle: tauri::AppHandle) {
    let stores = app_handle.state::<StoreCollection<Wry>>();
    let path = PathBuf::from(".app-config");
    let minimise_to_tray = with_store(app_handle.to_owned(), stores, path, |store| {
        Ok(store
            .get("minimisetotray")
            .and_then(|val| val.as_bool())
            .unwrap_or(false))
    })
    .unwrap_or(false);

    if minimise_to_tray {
        let window = app_handle.get_window("main").unwrap();
        window.hide().unwrap();
        app_handle
            .tray_handle()
            .get_item("hide")
            .set_title("Show")
            .unwrap();
    } else {
        let _ = app_handle.save_window_state(StateFlags::all());
        app_handle.exit(0);
    }
}

#[tauri::command]
fn update_app_config(app_handle: tauri::AppHandle, config_item: String, new_value: JsonValue) {
    let stores = app_handle.state::<StoreCollection<Wry>>();
    let path = PathBuf::from(".app-config");
    with_store(app_handle.to_owned(), stores, path, |store| {
        store.insert(config_item, new_value).unwrap();
        store.save()
    })
    .unwrap();
}

#[tauri::command]
fn get_app_config(
    app_handle: tauri::AppHandle,
    config_item: String,
) -> Result<Option<JsonValue>, tauri_plugin_store::Error> {
    let stores = app_handle.state::<StoreCollection<Wry>>();
    let path = PathBuf::from(".app-config");
    with_store(app_handle.to_owned(), stores, path, |store| {
        Ok(store.get(&config_item).map(|val| val.clone()))
    })
}

#[tauri::command]
fn update_menu_state(window: tauri::Window, menu_state: HashMap<String, MenuItemState>) {
    for (key, value) in menu_state.iter() {
        let item = window.menu_handle().get_item(&key);
        if let Some(disabled) = value.disabled {
            let _ = item.set_enabled(!disabled);
        }
        if let Some(selected) = value.selected {
            let _ = item.set_selected(selected);
        }
    }
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

fn read_menu_schema() -> Vec<MenuItem> {
    const MENUS: &str = include_str!("../../shared/menus.json");
    serde_json::from_str(MENUS).expect("JSON was not well-formatted")
}

fn create_menu_from_schema(schema: &[MenuItem]) -> Menu {
    schema.iter().fold(Menu::new(), |menu, item| {
        if should_include_item(item) {
            menu.add_submenu(create_menu_item(item))
        } else {
            menu
        }
    })
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

fn set_config_if_null(store: &mut Store<Wry>, key: &str, default_value_fn: impl Fn() -> JsonValue) {
    if store.get(key).is_none() {
        let default_value = default_value_fn();
        store.insert(key.to_string(), default_value).unwrap();
    }
}

fn main() {
    let schema = read_menu_schema();
    let menu = create_menu_from_schema(&schema);
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            app.emit_all("single-instance", Payload { args: argv, cwd })
                .unwrap();
        }))
        .plugin(tauri_plugin_store::Builder::default().build())
        .menu(menu)
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            let _ = set_shadow(&window, true).ok();

            if OS != "macos" {
                let quit = CustomMenuItem::new("exit".to_string(), "Exit");
                let hide = CustomMenuItem::new("hide".to_string(), "Hide");
                let tray_menu = SystemTrayMenu::new()
                    .add_item(hide)
                    .add_native_item(SystemTrayMenuItem::Separator)
                    .add_item(quit);

                SystemTray::new().with_menu(tray_menu).build(app).unwrap();
            }

            let stores = app.state::<StoreCollection<Wry>>();
            let path = PathBuf::from(".app-config");
            with_store(app.app_handle(), stores, path, |store| {
                set_config_if_null(store, "minimisetotray", || json!(false));
                store.save()
            })
            .unwrap();

            Ok(())
        })
        .on_window_event(|e| {
            if let WindowEvent::Resized(_) = e.event() {
                std::thread::sleep(std::time::Duration::from_nanos(1));
            }
            if let WindowEvent::CloseRequested { api, .. } = e.event() {
                api.prevent_close();
                close(e.window().app_handle());
            }
        })
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::DoubleClick {
                position: _,
                size: _,
                ..
            } => {
                let window = app.get_window("main").unwrap();
                window.show().unwrap();
                window.set_focus().unwrap();
                app.tray_handle()
                    .get_item("hide")
                    .set_title("Hide")
                    .unwrap();
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "exit" => {
                    let _ = app.save_window_state(StateFlags::all());
                    app.exit(0);
                }
                "hide" => {
                    let window = app.get_window("main").unwrap();
                    if window.is_visible().unwrap() {
                        window.hide().unwrap();
                        app.tray_handle().get_item(&id).set_title("Show").unwrap();
                    } else {
                        window.show().unwrap();
                        window.set_focus().unwrap();
                        app.tray_handle().get_item(&id).set_title("Hide").unwrap();
                    }
                }
                _ => {}
            },
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            close,
            update_app_config,
            get_app_config,
            update_menu_state
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
