use std::path::PathBuf;
use tauri::menu::MenuItemKind;
use tauri::AppHandle;
use tauri::Wry;
use tauri_plugin_store::JsonValue;
use tauri_plugin_store::Store;
use tauri_plugin_store::StoreExt;

pub fn set_config_if_null(store: &Store<Wry>, key: &str, default_value_fn: impl Fn() -> JsonValue) {
    if store.get(key).is_none() {
        let default_value = default_value_fn();
        store.set(key.to_string(), default_value);
    }
}

pub fn get_language(app: &AppHandle<Wry>) -> String {
    let path = PathBuf::from(".app-config");
    let store = app.store(path).unwrap();
    store
        .get("language")
        .and_then(|val| val.as_str().map(String::from))
        .unwrap_or_else(|| "en-US".to_string())
}

pub fn get_menu_item(items: &[MenuItemKind<Wry>], id: &str) -> Option<MenuItemKind<Wry>> {
    for item in items {
        if item.id().0.as_str() == id {
            return Some(item.clone());
        }
        if let Some(submenu) = item.as_submenu() {
            if let Some(found) = get_menu_item(&submenu.items().unwrap(), id) {
                return Some(found);
            }
        }
    }
    None
}
