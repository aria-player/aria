use crate::utils;

use super::translation;

use serde::{Deserialize, Serialize};
use std::{collections::HashMap, path::PathBuf};
use tauri::Manager;
use tauri_plugin_store::{JsonValue, StoreExt};
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

#[derive(Serialize, Deserialize, Debug)]
pub struct MenuItemState {
    disabled: Option<bool>,
    selected: Option<bool>,
}

#[tauri::command]
pub fn ready(app_handle: tauri::AppHandle) {
    let window = app_handle.get_webview_window("main").unwrap();
    window.show().unwrap();
}

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
pub fn exit(app_handle: tauri::AppHandle) {
    app_handle
        .get_webview_window("main")
        .unwrap()
        .hide()
        .unwrap();
    let _ = app_handle.save_window_state(StateFlags::all() - StateFlags::VISIBLE);
    app_handle.exit(0);
}

#[tauri::command]
pub fn toggle_fullscreen(app_handle: tauri::AppHandle) {
    let window = app_handle.get_webview_window("main").unwrap();
    let is_fullscreen = window.is_fullscreen().unwrap();
    if !is_fullscreen {
        window.unmaximize().unwrap();
    }
    window.set_resizable(is_fullscreen).unwrap();
    window.set_fullscreen(!is_fullscreen).unwrap();
}

#[tauri::command]
pub fn close(app_handle: tauri::AppHandle) {
    #[cfg(target_os = "macos")]
    {
        tauri::AppHandle::hide(&app_handle).unwrap();
    }

    #[cfg(not(target_os = "macos"))]
    {
        let path = PathBuf::from(".app-config");
        let store = app_handle.store(path).unwrap();
        let minimize_to_tray = store
            .get("minimizetotray")
            .and_then(|val| val.as_bool())
            .unwrap_or(false);

        if minimize_to_tray {
            let window = app_handle.get_webview_window("main").unwrap();
            window.hide().unwrap();
            app_handle
                .tray_handle()
                .get_item("hide")
                .set_title("Show")
                .unwrap();
        } else {
            exit(app_handle);
        }
    }
}

#[tauri::command]
pub fn update_app_config(app_handle: tauri::AppHandle, config_item: String, new_value: JsonValue) {
    if config_item == "language" {
        translation::update_menu_language(&app_handle, new_value.as_str().unwrap());
    }
    let path = PathBuf::from(".app-config");
    let store = app_handle.clone().store(path).unwrap();
    store.set(config_item, new_value);
    store.save().unwrap();
}

#[tauri::command]
pub fn get_app_config(
    app_handle: tauri::AppHandle,
    config_item: String,
) -> Result<Option<JsonValue>, tauri_plugin_store::Error> {
    let path = PathBuf::from(".app-config");
    let store = app_handle.store(path).unwrap();
    Ok(store.get(&config_item).map(|val| val.clone()))
}

#[tauri::command]
pub fn set_initial_language(app_handle: tauri::AppHandle, language: JsonValue) {
    translation::update_menu_language(&app_handle, &language.as_str().unwrap());
    let path = PathBuf::from(".app-config");
    let store = app_handle.store(path).unwrap();
    if store.get("language").is_none() {
        store.set("language".to_string(), language);
        store.save().unwrap();
    }
}

#[tauri::command]
pub fn update_menu_state(app_handle: tauri::AppHandle, menu_state: HashMap<String, MenuItemState>) {
    if let Some(menu) = app_handle.menu() {
        if let Ok(items) = menu.items() {
            for (key, value) in menu_state.iter() {
                if let Some(item) = utils::get_menu_item(&items, key) {
                    if let Some(check_item) = item.as_check_menuitem() {
                        let _ = check_item.set_enabled(!value.disabled.unwrap_or(false));
                        let _ = check_item.set_checked(value.selected.unwrap_or(false));
                    }
                    if let Some(menu_item) = item.as_submenu() {
                        let _ = menu_item.set_enabled(!value.disabled.unwrap_or(false));
                    }
                }
            }
        }
    }
}
