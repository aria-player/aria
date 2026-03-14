use discord_presence::models::{ActivityAssets, ActivityTimestamps, ActivityType};
use discord_presence::Client as DiscordClient;
use serde::Deserialize;
use std::sync::mpsc;
use std::sync::Mutex;
use tauri::State;

enum DiscordCommand {
    Connect(u64),
    SetActivity(DiscordActivity),
    ClearActivity,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscordActivity {
    pub state: String,
    pub details: String,
    pub name: String,
    pub large_image: Option<String>,
    pub large_text: Option<String>,
    pub small_image: Option<String>,
    pub small_text: Option<String>,
    pub start_timestamp: Option<u64>,
    pub end_timestamp: Option<u64>,
    pub button_label: Option<String>,
    pub button_url: Option<String>,
}

pub struct DiscordWorker {
    sender: Option<mpsc::Sender<DiscordCommand>>,
}

impl DiscordWorker {
    pub fn new() -> Self {
        Self { sender: None }
    }

    fn ensure_worker_running(&mut self) {
        if self.sender.is_some() {
            return;
        }
        let (tx, rx) = mpsc::channel::<DiscordCommand>();
        self.sender = Some(tx);
        std::thread::spawn(move || worker_loop(rx));
    }

    fn send(&mut self, cmd: DiscordCommand) {
        self.ensure_worker_running();
        if let Some(ref tx) = self.sender {
            let _ = tx.send(cmd);
        }
    }
}

fn create_and_start_client(client_id: u64) -> DiscordClient {
    let mut c = DiscordClient::new(client_id);
    c.start();
    c
}

fn reconnect_client(last_client_id: Option<u64>) -> Option<DiscordClient> {
    last_client_id.map(create_and_start_client)
}

fn worker_loop(rx: mpsc::Receiver<DiscordCommand>) {
    let mut client: Option<DiscordClient> = None;
    let mut last_client_id: Option<u64> = None;

    while let Ok(cmd) = rx.recv() {
        let cmd = skip_to_latest_command(cmd, &rx);

        match cmd {
            DiscordCommand::Connect(client_id) => {
                last_client_id = Some(client_id);
                client = Some(create_and_start_client(client_id));
            }
            DiscordCommand::SetActivity(activity) => {
                if let Some(ref mut c) = client {
                    if let Err(err) = c.set_activity(|act| build_activity(act, &activity)) {
                        eprintln!("Failed to set Discord activity: {}, reconnecting", err);
                        client = reconnect_client(last_client_id);
                        if let Some(ref mut c) = client {
                            if let Err(err) = c.set_activity(|act| build_activity(act, &activity)) {
                                eprintln!("Retry also failed: {}", err);
                            }
                        }
                    }
                }
            }
            DiscordCommand::ClearActivity => {
                if let Some(ref mut c) = client {
                    if let Err(err) = c.clear_activity() {
                        eprintln!("Failed to clear Discord activity: {}", err);
                        client = reconnect_client(last_client_id);
                    }
                }
            }
        }
    }
}

fn skip_to_latest_command(
    initial: DiscordCommand,
    rx: &mpsc::Receiver<DiscordCommand>,
) -> DiscordCommand {
    let mut latest = initial;
    while let Ok(next) = rx.try_recv() {
        latest = next;
    }
    latest
}

fn build_activity(
    act: discord_presence::models::Activity,
    activity: &DiscordActivity,
) -> discord_presence::models::Activity {
    let mut a = act
        .state(&activity.state)
        .details(&activity.details)
        .activity_type(ActivityType::Listening)
        .name(&activity.name);

    if activity.start_timestamp.is_some() || activity.end_timestamp.is_some() {
        a = a.timestamps(|mut ts: ActivityTimestamps| {
            if let Some(s) = activity.start_timestamp {
                ts = ts.start(s);
            }
            if let Some(e) = activity.end_timestamp {
                ts = ts.end(e);
            }
            ts
        });
    }

    if activity.large_image.is_some() || activity.small_image.is_some() {
        a = a.assets(|mut assets: ActivityAssets| {
            if let Some(ref img) = activity.large_image {
                assets = assets.large_image(img);
                if let Some(ref text) = activity.large_text {
                    assets = assets.large_text(text);
                }
            }
            if let Some(ref img) = activity.small_image {
                assets = assets
                    .small_image(img)
                    .small_text(activity.small_text.as_deref().unwrap_or_default());
            }
            assets
        });
    }

    if let (Some(ref label), Some(ref url)) = (&activity.button_label, &activity.button_url) {
        a = a.append_buttons(|b| b.label(label).url(url));
    }

    a
}

type WorkerState<'a> = State<'a, Mutex<DiscordWorker>>;

#[tauri::command]
pub fn connect_discord_rich_presence(state: WorkerState, client_id: String) {
    let Ok(client_id_u64) = client_id.parse::<u64>() else {
        eprintln!("Invalid Discord application ID: {}", client_id);
        return;
    };
    state
        .lock()
        .unwrap()
        .send(DiscordCommand::Connect(client_id_u64));
}

#[tauri::command]
pub fn set_discord_activity(state: WorkerState, activity: DiscordActivity) {
    state
        .lock()
        .unwrap()
        .send(DiscordCommand::SetActivity(activity));
}

#[tauri::command]
pub fn clear_discord_activity(state: WorkerState) {
    state.lock().unwrap().send(DiscordCommand::ClearActivity);
}
