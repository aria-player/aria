use lofty::prelude::{Accessor, AudioFile, ItemKey, TaggedFileExt};
use lofty::probe::Probe;
use sha2::{Digest, Sha256};
use std::fs::metadata;
use std::io::Write;
use std::time::UNIX_EPOCH;
use std::{collections::HashMap, fs, path::Path};
use tauri::AppHandle;

#[tauri::command]
pub fn get_audio_files_from_directory(directory_path: &Path) -> Result<Vec<String>, String> {
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
                let mut sub_files = get_audio_files_from_directory(&path)?;
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

    let tag = match tagged_file.primary_tag() {
        Some(primary_tag) => primary_tag,
        None => tagged_file.first_tag().ok_or("No tags found")?,
    };

    let mut metadata = HashMap::new();

    let artists: Vec<&str> = tag.get_strings(&ItemKey::TrackArtist).collect();
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

    metadata.insert("dateModified".to_string(), modified);
    metadata.insert("fileSize".to_string(), size);
    metadata.insert(
        "title".to_string(),
        tag.title().unwrap_or_default().to_string(),
    );
    metadata.insert(
        "duration".to_string(),
        tagged_file.properties().duration().as_millis().to_string(),
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
        if let Some(app_data_dir) = app.path_resolver().app_data_dir() {
            let artwork_subdir = app_data_dir.join(".artwork-cache");
            fs::create_dir_all(&artwork_subdir).unwrap();
            let artwork_path = artwork_subdir.join(&hash);
            if !artwork_path.exists() {
                if let Ok(mut file) = fs::File::create(&artwork_path) {
                    file.write_all(cover.data()).unwrap();
                }
            }
        }
        metadata.insert("artworkUri".to_string(), hash);
    }
    Ok(metadata)
}
