use serde_json::Value;
use tauri::{Manager, Window};
use std::env::consts::OS;

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

pub fn update_menu_language(window: &Window, lang_code: &str) {
    let (translations, defaults) = get_translations(lang_code);
    if let Value::Object(menu_translations) = &translations["menu"] {
        for (key, value) in menu_translations {
            let title = value
                .as_str()
                .or_else(|| defaults["menu"].get(key).and_then(|v| v.as_str()));
            if let Some(title) = title {
                if let Some(menu_item_handle) = window.menu_handle().try_get_item(key) {
                    menu_item_handle.set_title(title).unwrap();
                }
            }
        }
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
