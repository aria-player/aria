// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod menu;
mod oauth;
mod player;
mod translation;
mod tray;
mod utils;

use serde_json::json;
use std::env::consts::OS;
use std::path::PathBuf;
use tauri::{tray::TrayIconEvent, Emitter, Manager, WindowEvent};
use tauri_plugin_store::StoreExt;
use translation::update_menu_language;

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
            let window = app.get_webview_window("main").unwrap();
            if !window.is_visible().unwrap() {
                window.show().unwrap();
            }
            window.set_focus().unwrap();
        }))
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            window.set_shadow(true);

            if OS != "macos" {
                if window.is_fullscreen().unwrap() {
                    window.set_resizable(false).unwrap();
                }
                let tray_menu = app.tray_by_id("main").unwrap();
                let _ = tray_menu.set_show_menu_on_left_click(false);
                let _ = tray_menu.set_tooltip(Some("Aria"));
            }

            let path = PathBuf::from(".app-config");
            let store = app.store(path).unwrap();
            utils::set_config_if_null(&store, "minimizetotray", || json!(false));
            store.save().unwrap();

            let language_code = utils::get_language(&app.app_handle());
            update_menu_language(&window.app_handle(), &language_code);

            Ok(())
        })
        .on_window_event(|window, e| match e {
            WindowEvent::Resized(_) => {
                std::thread::sleep(std::time::Duration::from_nanos(1));
            }
            WindowEvent::CloseRequested { api, .. } => {
                commands::close(window.app_handle().clone());
                api.prevent_close();
            }
            _ => {}
        })
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "hide" => {
                    if let Some(window) = app.get_webview_window("main") {
                        if window.is_visible().unwrap() {
                            window.hide().unwrap();
                        } else {
                            window.show().unwrap();
                            window.set_focus().unwrap();
                        }
                        tray::update_tray(&app);
                    }
                }
                _ => {}
            }
            let menu_item_id: &str = event.id().0.as_str();
            app.emit(&menu_item_id.replace('.', ":"), ()).unwrap();

            if let Some(menu) = app.menu() {
                if let Some(menu_item) = utils::get_menu_item(&menu.items().unwrap(), menu_item_id)
                {
                    if let Some(check_menu_item) = menu_item.as_check_menuitem() {
                        // The web app manages the checked state, so this cancels out Tauri's automatic 'checked' toggle
                        let checked = check_menu_item.is_checked().unwrap_or(false);
                        let _ = check_menu_item.set_checked(!checked);
                    }
                }
            }
        })
        .on_tray_icon_event(|app, event| match event {
            TrayIconEvent::DoubleClick { .. } => {
                if let Some(window) = app.get_webview_window("main") {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                    tray::update_tray(&app);
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
        app_builder = app_builder.menu(|handle| {
            let (default_labels, _) = translation::get_translations("en-US");
            let items = menu::read_menu_json();
            menu::create_menu_from_json(handle, &items, &default_labels)
        });
    }
    app_builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
