use tauri::{command, AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder, WindowEvent};
use url::Url;

const APPLE_MUSIC_AUTH_WINDOW_LABEL: &str = "apple-music-auth-window";

fn auth_window_init_script(main_window_origin: &str) -> String {
     include_str!("../scripts/apple_music_login.js")
        .replace("__MAIN_WINDOW_ORIGIN__", main_window_origin)
}

#[command]
pub fn open_auth_window(
    app: AppHandle,
    url: String,
    main_window_origin: String,
) -> Result<(), String> {
    if let Some(existing_window) = app.get_webview_window(APPLE_MUSIC_AUTH_WINDOW_LABEL) {
        let _ = existing_window.close();
    }

    let parsed_url = Url::parse(&url).map_err(|err| err.to_string())?;
    let auth_window = WebviewWindowBuilder::new(
        &app,
        APPLE_MUSIC_AUTH_WINDOW_LABEL,
        WebviewUrl::External(parsed_url),
    )
    .title("Apple Music Login")
    .inner_size(500.0, 700.0)
    .center()
    .initialization_script(&auth_window_init_script(&main_window_origin))
    .build()
    .map_err(|err| err.to_string())?;

    let app_handle = app.clone();
    auth_window.on_window_event(move |event| {
        if matches!(event, WindowEvent::Destroyed) {
            if let Some(main_window) = app_handle.get_webview_window("main") {
                let _ = main_window.emit("auth_window_closed", ());
            }
        }
    });

    Ok(())
}

#[command]
pub fn close_auth_window(app: AppHandle) -> Result<(), String> {
    if let Some(auth_window) = app.get_webview_window(APPLE_MUSIC_AUTH_WINDOW_LABEL) {
        auth_window.close().map_err(|err| err.to_string())?;
    }
    Ok(())
}

#[command]
pub fn post_message_to_auth_window(
    app: AppHandle,
    data: String,
    origin: String,
) -> Result<(), String> {
    if let Some(auth_window) = app.get_webview_window(APPLE_MUSIC_AUTH_WINDOW_LABEL) {
        let serialized_data = serde_json::to_string(&data).map_err(|err| err.to_string())?;
        let serialized_origin = serde_json::to_string(&origin).map_err(|err| err.to_string())?;
        let script = format!(
            "window.__receiveAuthWindowMessage && window.__receiveAuthWindowMessage({}, {});",
            serialized_data, serialized_origin
        );
        auth_window.eval(&script).map_err(|err| err.to_string())?;
    }
    Ok(())
}

#[command]
pub fn post_message_to_main_window(
    app: AppHandle,
    data: String,
    origin: String,
) -> Result<(), String> {
    if let Some(main_window) = app.get_webview_window("main") {
        main_window
            .emit(
                "auth_window_message",
                serde_json::json!({ "data": data, "origin": origin }),
            )
            .map_err(|err| err.to_string())?;
    }
    Ok(())
}
