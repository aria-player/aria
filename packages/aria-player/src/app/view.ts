export enum DisplayMode {
  TrackList = "trackList",
  AlbumGrid = "albumGrid",
  SplitView = "splitView"
}

export enum View {
  Search = "search",
  Playlist = "playlist",
  Queue = "queue",
  Settings = "settings",
  Error = "error",
  Album = "album"
}

export enum LibraryView {
  Songs = "songs",
  Artists = "artists",
  Albums = "albums",
  Genres = "genres",
  Composers = "composers",
  Years = "years",
  Folders = "folders"
}

export enum TrackGrouping {
  AlbumId = "albumId",
  Artist = "artist",
  AlbumArtist = "albumArtist",
  Genre = "genre",
  Composer = "composer",
  Year = "year",
  FileFolder = "fileFolder"
}

export enum SettingsSection {
  General = "general",
  Appearance = "appearance",
  Library = "library",
  Plugins = "plugins",
  About = "about"
}

export enum SearchCategory {
  Songs = "songs",
  Artists = "artists",
  Albums = "albums"
}

export type SplitViewState = {
  paneSizes?: number[] | null;
  trackGrouping: TrackGrouping | null;
  selectedGroup?: string | null;
};

export function isLibraryView(view: string) {
  return Object.values(LibraryView).includes(view as LibraryView);
}
