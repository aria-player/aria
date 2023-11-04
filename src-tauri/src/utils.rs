use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;
use tauri::Wry;
use tauri_plugin_store::JsonValue;
use tauri_plugin_store::Store;
use tauri_plugin_store::{with_store, StoreCollection};

pub fn set_config_if_null(
    store: &mut Store<Wry>,
    key: &str,
    default_value_fn: impl Fn() -> JsonValue,
) {
    if store.get(key).is_none() {
        let default_value = default_value_fn();
        store.insert(key.to_string(), default_value).unwrap();
    }
}

pub fn get_language(app: &AppHandle<Wry>) -> String {
    let stores = app.state::<StoreCollection<Wry>>();
    let path = PathBuf::from(".app-config");
    let language_result = with_store(app.app_handle(), stores, path, |store| {
        Ok(store
            .get("language".to_string())
            .and_then(|val| val.as_str().map(String::from)))
    });
    language_result
        .unwrap_or(None)
        .unwrap_or_else(|| "en-US".to_string())
}
