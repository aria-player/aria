use lofty::prelude::{Accessor, AudioFile, ItemKey, TaggedFileExt};
use lofty::probe::Probe;
use sha2::{Digest, Sha256};
use std::fs::metadata;
use std::io::Write;
use std::time::UNIX_EPOCH;
use std::{collections::HashMap, fs, path::Path};
use tauri::{AppHandle, Manager};

#[tauri::command]
pub fn get_audio_files_from_directory(
    app: AppHandle,
    directory_path: &Path,
) -> Result<Vec<String>, String> {
    let asset_scope = app.asset_protocol_scope();
    let _ = asset_scope.allow_directory(directory_path, true);
    let mut files = Vec::new();
    if directory_path.is_dir() {
        let read_dir = fs::read_dir(directory_path).map_err(|e| e.to_string())?;
        for entry in read_dir {
            let entry = match entry {
                Ok(e) => e,
                Err(e) => return Err(e.to_string()),
            };
            let path = entry.path();
            if path.is_dir() {
                let mut sub_files = get_audio_files_from_directory(app.clone(), &path)?;
                files.append(&mut sub_files);
            } else if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                match ext {
                    "mp3" | "wav" | "flac" | "ogg" | "m4a" | "aac" => {
                        files.push(path.display().to_string())
                    }
                    _ => {}
                }
            }
        }
    }
    Ok(files)
}

#[tauri::command]
pub fn get_metadata(app: AppHandle, file_path: String) -> Result<HashMap<String, String>, String> {
    let path = Path::new(&file_path);
    let file_metadata = metadata(path).map_err(|e| e.to_string())?;

    let modified = file_metadata
        .modified()
        .map_err(|e| e.to_string())?
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_millis()
        .to_string();
    let size = file_metadata.len().to_string();

    let tagged_file = match Probe::open(path) {
        Ok(file) => file.read().map_err(|e| e.to_string())?,
        Err(_) => return Err("Failed to probe the file".to_string()),
    };

    let mut metadata = HashMap::new();
    let properties = tagged_file.properties();
    metadata.insert(
        "duration".to_string(),
        properties.duration().as_millis().to_string(),
    );
    metadata.insert("dateModified".to_string(), modified);
    metadata.insert("fileSize".to_string(), size);
    if let Some(sample_rate) = properties.sample_rate() {
        metadata.insert("sampleRate".to_string(), (sample_rate).to_string());
    }
    if let Some(bit_rate) = properties.audio_bitrate() {
        metadata.insert("bitRate".to_string(), (bit_rate * 1000).to_string());
    }

    let tag = match tagged_file.primary_tag() {
        Some(primary_tag) => primary_tag,
        None => {
            return Ok(metadata);
        }
    };

    let mut artists: Vec<&str> = tag.get_strings(&ItemKey::TrackArtist).collect();
    if artists.len() == 1 {
        artists = artists[0].split('/').collect();
    }
    let artists_json = serde_json::to_string(&artists).unwrap_or_else(|_| "[]".to_string());
    metadata.insert("artist".to_string(), artists_json);

    let genres: Vec<&str> = tag.get_strings(&ItemKey::Genre).collect();
    let genres_json = serde_json::to_string(&genres).unwrap_or_else(|_| "[]".to_string());
    metadata.insert("genre".to_string(), genres_json);

    let composers: Vec<&str> = tag.get_strings(&ItemKey::Composer).collect();
    let composers_json = serde_json::to_string(&composers).unwrap_or_else(|_| "[]".to_string());
    metadata.insert("composer".to_string(), composers_json);

    let comments: Vec<&str> = tag.get_strings(&ItemKey::Comment).collect();
    let comments_json = serde_json::to_string(&comments).unwrap_or_else(|_| "[]".to_string());
    metadata.insert("comments".to_string(), comments_json);
    metadata.insert(
        "title".to_string(),
        tag.title().unwrap_or_default().to_string(),
    );

    metadata.insert(
        "album".to_string(),
        tag.album().unwrap_or_default().to_string(),
    );
    metadata.insert(
        "year".to_string(),
        tag.year().unwrap_or_default().to_string(),
    );
    metadata.insert(
        "track".to_string(),
        tag.track().unwrap_or_default().to_string(),
    );
    metadata.insert(
        "disc".to_string(),
        tag.disk().unwrap_or_default().to_string(),
    );
    if let Some(value) = tag.get_string(&ItemKey::AlbumArtist) {
        metadata.insert("albumArtist".to_string(), value.to_string());
    }
    if let Some(cover) = tag.pictures().first() {
        let mut hasher = Sha256::new();
        hasher.update(cover.data());
        let hash = format!("{:x}", hasher.finalize());
        match app.path().app_data_dir() {
            Ok(path) => {
                let artwork_subdir = path.join(".artwork-cache");
                let _ = fs::create_dir_all(&artwork_subdir);
                let artwork_path = artwork_subdir.join(&hash);
                if !artwork_path.exists() {
                    if let Ok(mut file) = fs::File::create(&artwork_path) {
                        file.write_all(cover.data()).unwrap();
                    }
                }
            }
            Err(_) => return Err("Couldn't get app data directory".to_string()),
        };
        metadata.insert("artworkUri".to_string(), hash);
    }
    Ok(metadata)
}
