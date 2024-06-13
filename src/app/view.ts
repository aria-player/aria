export enum DisplayMode {
  TrackList = "trackList",
  AlbumGrid = "albumGrid",
  SplitView = "splitView",
  DebugView = "debugView"
}

export enum View {
  Search = "search",
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

export type SplitViewState = {
  paneSizes?: number[] | null;
  trackGrouping: TrackGrouping | null;
  selectedGroup?: string | null;
};

export function isLibraryView(view: string) {
  return Object.values(LibraryView).includes(view as LibraryView);
}
