use std::env::consts::OS;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    AppHandle, Manager, Wry,
};

use crate::{translation, utils};

pub fn update_tray(app_handle: &AppHandle) {
    if OS == "macos" {
        return;
    }
    let lang_code = utils::get_language(app_handle);
    let tray = app_handle.tray_by_id("main").unwrap();
    let _ = tray.set_menu(Some(create_tray_menu(tray.app_handle(), &lang_code)));
}

pub fn update_tray_with_language(app_handle: &AppHandle, lang_code: &str) {
    if OS == "macos" {
        return;
    }
    let tray = app_handle.tray_by_id("main").unwrap();
    let _ = tray.set_menu(Some(create_tray_menu(tray.app_handle(), lang_code)));
}

fn create_tray_menu(app_handle: &AppHandle, lang_code: &str) -> Menu<Wry> {
    let (translations, defaults) = translation::get_translations(&lang_code);
    let exit_label = translations["tray"]["exit"]
        .as_str()
        .unwrap_or(defaults["tray"]["exit"].as_str().unwrap());
    let hide_label = if let Some(window) = app_handle.get_webview_window("main") {
        if window.is_visible().unwrap() {
            translations["tray"]["hide"]
                .as_str()
                .unwrap_or(defaults["tray"]["hide"].as_str().unwrap())
        } else {
            translations["tray"]["show"]
                .as_str()
                .unwrap_or(defaults["tray"]["show"].as_str().unwrap())
        }
    } else {
        defaults["tray"]["hide"].as_str().unwrap()
    };
    let hide = MenuItem::with_id(app_handle, "hide", hide_label, true, None::<&str>).unwrap();
    let separator = PredefinedMenuItem::separator(app_handle).unwrap();
    let quit = MenuItem::with_id(app_handle, "exit", exit_label, true, None::<&str>).unwrap();
    Menu::with_items(app_handle, &[&hide, &separator, &quit]).unwrap()
}
