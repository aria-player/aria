use crate::{
    menu::{read_menu_json, MenuItem},
    utils,
};
use serde_json::Value;
use std::env::consts::OS;
use tauri::{AppHandle, Manager};

const EN_GB: &str = include_str!("../../shared/locales/en_gb/translation.json");
const EN_US: &str = include_str!("../../shared/locales/en_us/translation.json");

pub fn get_translations(lang_code: &str) -> (Value, Value) {
    let defaults: serde_json::Value =
        serde_json::from_str(EN_US).expect("JSON was not well-formatted");
    if lang_code == "en-US" {
        return (defaults.clone(), defaults);
    }
    let translated_json = match lang_code {
        "en-GB" => EN_GB,
        _ => EN_US,
    };
    let translations = serde_json::from_str(translated_json).expect("JSON was not well-formatted");
    (translations, defaults)
}

pub fn update_menu_language(handle: &AppHandle, lang_code: &str) {
    let (translations, defaults) = get_translations(lang_code);
    let menu_items = read_menu_json();
    for item in menu_items {
        update_menu_item_language(handle, &item, &translations, &defaults);
    }
    if OS == "macos" {
        return;
    }
    if let Value::Object(tray_translations) = &translations["tray"] {
        for (key, value) in tray_translations {
            let title = value
                .as_str()
                .or_else(|| defaults["tray"].get(key).and_then(|v| v.as_str()));
            if let Some(title) = title {
                if let Some(tray_item_handle) = window.app_handle().tray_handle().try_get_item(key)
                {
                    tray_item_handle.set_title(title).unwrap();
                }
            }
        }
    }
}

fn update_menu_item_language(
    handle: &AppHandle,
    item: &MenuItem,
    translations: &Value,
    defaults: &Value,
) {
    let title = if item.id.contains('.') {
        let parts: Vec<&str> = item.id.split('.').collect();
        translations
            .get(parts[0])
            .and_then(|t| t.get(parts[1]).and_then(|v| v.as_str()))
            .or_else(|| {
                defaults
                    .get(parts[0])
                    .and_then(|d| d.get(parts[1]).and_then(|v| v.as_str()))
            })
    } else {
        translations["menu"][&item.id]
            .as_str()
            .or_else(|| defaults["menu"][&item.id].as_str())
    };

    if let Some(title) = title {
        if let Some(menu) = handle.menu() {
            if let Ok(items) = menu.items() {
                if let Some(item) = utils::get_menu_item(&items, &item.id) {
                    if let Some(check_item) = item.as_check_menuitem() {
                        let _ = check_item.set_text(title);
                    }
                    if let Some(submenu) = item.as_submenu() {
                        let _ = submenu.set_text(title);
                    }
                    if let Some(predefined_menu_item) = item.as_predefined_menuitem() {
                        let _ = predefined_menu_item.set_text(title);
                    }
                }
            }
        }
    }

    item.submenu.as_ref().map(|submenu_items| {
        submenu_items.iter().for_each(|sub_item| {
            update_menu_item_language(handle, sub_item, translations, defaults);
        });
    });
}
