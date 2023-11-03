use tauri::Wry;
use tauri_plugin_store::JsonValue;
use tauri_plugin_store::Store;

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
