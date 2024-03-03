export enum DisplayMode {
  TrackList = "tracklist",
  AlbumGrid = "albumgrid",
  SplitView = "splitview",
  DebugView = "debugview"
}

export enum View {
  Playlist = "playlist",
  Queue = "queue",
  Settings = "settings",
  Error = "error"
}

export enum LibraryView {
  Songs = "songs",
  Albums = "albums",
  Artists = "artists",
  Genres = "genres",
  Composers = "composers",
  Years = "years"
}

export enum TrackGrouping {
  Album = "album",
  Artist = "artist",
  AlbumArtist = "albumArtist",
  Genre = "genre",
  Composer = "composer",
  Year = "year"
}

export function isLibraryView(view: string) {
  return Object.values(LibraryView).includes(view as LibraryView);
}
