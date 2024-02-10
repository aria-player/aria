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

export function isLibraryView(view: string) {
  return Object.values(LibraryView).includes(view as LibraryView);
}
