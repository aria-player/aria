// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod menu;
mod oauth;
mod player;
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
use translation::update_menu_language;
use window_shadows::set_shadow;

#[derive(Clone, serde::Serialize)]
struct Payload {
    args: Vec<String>,
    cwd: String,
}

fn main() {
    let mut app_builder = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            app.emit_all("single-instance", Payload { args: argv, cwd })
                .unwrap();
            let window = app.get_window("main").unwrap();
            if !window.is_visible().unwrap() {
                window.show().unwrap();
            }
            window.set_focus().unwrap();
        }))
        .plugin(tauri_plugin_store::Builder::default().build())
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
                utils::set_config_if_null(store, "minimizetotray", || json!(false));
                store.save()
            })
            .unwrap();

            let language_code = utils::get_language(&app.app_handle());
            update_menu_language(&window, &language_code);

            Ok(())
        })
        .on_window_event(|e| {
            if let WindowEvent::Resized(_) = e.event() {
                std::thread::sleep(std::time::Duration::from_nanos(1));
            }
            if let WindowEvent::CloseRequested { api, .. } = e.event() {
                commands::close(e.window().app_handle());
                api.prevent_close();
            }
        })
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::DoubleClick {
                position: _,
                size: _,
                ..
            } => {
                let language = utils::get_language(app);
                let (translations, defaults) = translation::get_translations(&language);
                let hide_title = translations["tray"]["hide"]
                    .as_str()
                    .unwrap_or(defaults["tray"]["hide"].as_str().unwrap());
                let window = app.get_window("main").unwrap();
                window.show().unwrap();
                window.set_focus().unwrap();
                app.tray_handle()
                    .get_item("hide")
                    .set_title(hide_title)
                    .unwrap();
            }
            SystemTrayEvent::MenuItemClick { id, .. } => {
                let language = utils::get_language(app);
                let (translations, defaults) = translation::get_translations(&language);
                match id.as_str() {
                    "exit" => commands::exit(app.app_handle()),
                    "hide" => {
                        let window = app.get_window("main").unwrap();
                        let tray_handle = app.tray_handle();
                        if window.is_visible().unwrap() {
                            window.hide().unwrap();
                            let show_title = translations["tray"]["show"]
                                .as_str()
                                .unwrap_or(defaults["tray"]["show"].as_str().unwrap());
                            tray_handle.get_item(&id).set_title(show_title).unwrap();
                        } else {
                            window.show().unwrap();
                            window.set_focus().unwrap();
                            let hide_title = translations["tray"]["hide"]
                                .as_str()
                                .unwrap_or(defaults["tray"]["hide"].as_str().unwrap());
                            tray_handle.get_item(&id).set_title(hide_title).unwrap();
                        }
                    }
                    _ => {}
                }
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::ready,
            commands::exit,
            commands::close,
            commands::toggle_fullscreen,
            commands::update_app_config,
            commands::get_app_config,
            commands::update_menu_state,
            commands::set_initial_language,
            player::get_audio_files_from_directory,
            player::get_metadata,
            oauth::start_server
        ]);
    if OS != "windows" {
        let (default_labels, _) = translation::get_translations("en-US");
        let items = menu::read_menu_json();
        let menu = menu::create_menu_from_json(&items, &default_labels);
        app_builder = app_builder.menu(menu);
    }
    app_builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
