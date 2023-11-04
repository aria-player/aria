use serde_json::Value;
use tauri::Window;

const EN_GB: &str = include_str!("../../shared/locales/en_gb/translation.json");
const EN_US: &str = include_str!("../../shared/locales/en_us/translation.json");

fn get_translations(lang_code: &str) -> Value {
    let json_str = match lang_code {
        "en-GB" => EN_GB,
        "en-US" => EN_US,
        _ => EN_US,
    };
    serde_json::from_str(json_str).expect("JSON was not well-formatted")
}

pub fn update_menu_language(window: &Window, lang_code: &str) {
    let translations = get_translations(lang_code);
    if let Value::Object(menu_translations) = &translations["menu"] {
        for (key, value) in menu_translations {
            if let Value::String(title) = value {
                match window.menu_handle().try_get_item(key) {
                    Some(menu_item_handle) => {
                        menu_item_handle.set_title(title).unwrap();
                    }
                    None => {}
                }
            }
        }
    }
}
