// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod menu;
mod translation;
mod utils;

use serde_json::json;
use std::env::consts::OS;
use std::path::PathBuf;
use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
    WindowEvent, Wry,
};
use tauri_plugin_store::{with_store, StoreCollection};
use window_shadows::set_shadow;

#[derive(Clone, serde::Serialize)]
struct Payload {
    args: Vec<String>,
    cwd: String,
}

fn main() {
    let items = menu::read_menu_json();
    let menu = menu::create_menu_from_json(&items);
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            app.emit_all("single-instance", Payload { args: argv, cwd })
                .unwrap();
            let window = app.get_window("main").unwrap();
            if !window.is_visible().unwrap() {
                window.show().unwrap();
                window.set_focus().unwrap();
            }
        }))
        .plugin(tauri_plugin_store::Builder::default().build())
        .menu(menu)
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            let _ = set_shadow(&window, true).ok();

            if OS != "macos" {
                if window.is_fullscreen().unwrap() {
                    window.set_resizable(false).unwrap();
                }

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
                utils::set_config_if_null(store, "minimisetotray", || json!(false));
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
                #[cfg(target_os = "macos")]
                {
                    tauri::AppHandle::hide(&e.window().app_handle()).unwrap();
                }
                #[cfg(not(target_os = "macos"))]
                {
                    commands::close(e.window().app_handle());
                }
                api.prevent_close();
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
                "exit" => commands::exit(app.app_handle()),
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
            commands::greet,
            commands::exit,
            commands::close,
            commands::toggle_fullscreen,
            commands::update_app_config,
            commands::get_app_config,
            commands::update_menu_state,
            commands::set_initial_language
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
