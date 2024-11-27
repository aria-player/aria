use std::borrow::Cow;

use tauri::{command, Window};
use tauri_plugin_oauth::{start_with_config, OauthConfig};
use url::Url;

#[command]
pub async fn start_server(window: Window) -> Result<u16, String> {
    let config = OauthConfig {
        ports: Some(vec![2742]),
        response: Some(Cow::Borrowed("<html><script>close()</script></html>")),
    };
    start_with_config(config, move |url| {
        if let Ok(parsed_url) = url.parse::<Url>() {
            if parsed_url.host_str() == Some("127.0.0.1") {
                let query_map: std::collections::HashMap<_, _> =
                    parsed_url.query_pairs().into_owned().collect();
                let code = query_map.get("code").cloned().unwrap_or_default();
                let state = query_map.get("state").cloned().unwrap_or_default();
                let _ = window.emit(
                    "oauth_code",
                    serde_json::json!({ "code": code, "state": state }),
                );
            }
        }
    })
    .map_err(|err| err.to_string())
}
