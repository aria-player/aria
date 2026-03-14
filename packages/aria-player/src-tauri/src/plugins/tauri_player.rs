use lofty::prelude::{Accessor, AudioFile, ItemKey, TaggedFileExt};
use lofty::probe::Probe;
use sha2::{Digest, Sha256};
use std::fs::metadata;
use std::io::Write;
use std::path::Path;
use std::time::UNIX_EPOCH;
use std::{collections::HashMap, fs};
use tauri::{AppHandle, Manager};
use tauri_plugin_opener::OpenerExt;

#[cfg(target_os = "windows")]
fn is_placeholder_file(path: &Path) -> bool {
    use std::os::windows::fs::MetadataExt;
    const FILE_ATTRIBUTE_RECALL_ON_DATA_ACCESS: u32 = 0x00400000;
    if let Ok(meta) = fs::metadata(path) {
        let attrs = meta.file_attributes();
        (attrs & FILE_ATTRIBUTE_RECALL_ON_DATA_ACCESS) != 0
    } else {
        false
    }
}

#[cfg(target_os = "macos")]
fn is_placeholder_file(path: &Path) -> bool {
    use std::ffi::CString;
    use std::os::unix::ffi::OsStrExt;
    const UF_DATALESS: u32 = 0x40000000;
    let c_path = match CString::new(path.as_os_str().as_bytes()) {
        Ok(p) => p,
        Err(_) => return false,
    };
    let mut stat_buf: libc::stat = unsafe { std::mem::zeroed() };
    if unsafe { libc::stat(c_path.as_ptr(), &mut stat_buf) } == 0 {
        (stat_buf.st_flags as u32 & UF_DATALESS) != 0
    } else {
        false
    }
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
fn is_placeholder_file(_path: &Path) -> bool {
    false
}

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
            let file_type = match entry.file_type() {
                Ok(ft) => ft,
                Err(_) => continue,
            };
            let path = entry.path();
            if file_type.is_dir() {
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
    if is_placeholder_file(path) {
        return Err("placeholder_file".to_string());
    }
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

    let artists: Vec<&str> = tag.get_strings(ItemKey::TrackArtist).collect();
    let artists_json = serde_json::to_string(&artists).unwrap_or_else(|_| "[]".to_string());
    metadata.insert("artist".to_string(), artists_json);

    let genres: Vec<&str> = tag.get_strings(ItemKey::Genre).collect();
    let genres_json = serde_json::to_string(&genres).unwrap_or_else(|_| "[]".to_string());
    metadata.insert("genre".to_string(), genres_json);

    let composers: Vec<&str> = tag.get_strings(ItemKey::Composer).collect();
    let composers_json = serde_json::to_string(&composers).unwrap_or_else(|_| "[]".to_string());
    metadata.insert("composer".to_string(), composers_json);

    let comments: Vec<&str> = tag.get_strings(ItemKey::Comment).collect();
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
    if let Some(year) = tag
        .get_string(ItemKey::RecordingDate)
        .or_else(|| tag.get_string(ItemKey::Year))
    {
        metadata.insert("year".to_string(), year.to_string());
    }
    metadata.insert(
        "track".to_string(),
        tag.track().unwrap_or_default().to_string(),
    );
    metadata.insert(
        "disc".to_string(),
        tag.disk().unwrap_or_default().to_string(),
    );
    if let Some(value) = tag.get_string(ItemKey::AlbumArtist) {
        metadata.insert("albumArtist".to_string(), value.to_string());
    }
    if let Some(date_str) = tag.get_string(ItemKey::ReleaseDate) {
        metadata.insert("dateReleased".to_string(), date_str.to_string());
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

#[tauri::command]
pub fn show_file_in_manager(app: AppHandle, uri: String) {
    let _ = app.opener().reveal_item_in_dir(Path::new(&uri));
}
