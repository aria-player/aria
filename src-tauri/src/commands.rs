use serde::{Deserialize, Serialize};
use std::{collections::HashMap, path::PathBuf};
use tauri::{Manager, Wry};
use tauri_plugin_store::JsonValue;
use tauri_plugin_store::{with_store, StoreCollection};
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

#[derive(Serialize, Deserialize, Debug)]
pub struct MenuItemState {
    disabled: Option<bool>,
    selected: Option<bool>,
}

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
pub fn exit(app_handle: tauri::AppHandle) {
    let _ = app_handle.save_window_state(StateFlags::all());
    app_handle.exit(0);
}

#[tauri::command]
pub fn toggle_fullscreen(app_handle: tauri::AppHandle) {
    let window = app_handle.get_window("main").unwrap();
    let is_fullscreen = window.is_fullscreen().unwrap();
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
            exit(app_handle);
        }
    }
}

#[tauri::command]
pub fn update_app_config(app_handle: tauri::AppHandle, config_item: String, new_value: JsonValue) {
    let stores = app_handle.state::<StoreCollection<Wry>>();
    let path = PathBuf::from(".app-config");
    with_store(app_handle.to_owned(), stores, path, |store| {
        store.insert(config_item, new_value).unwrap();
        store.save()
    })
    .unwrap();
}

#[tauri::command]
pub fn get_app_config(
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
pub fn update_menu_state(window: tauri::Window, menu_state: HashMap<String, MenuItemState>) {
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
