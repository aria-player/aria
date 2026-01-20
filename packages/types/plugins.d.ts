import * as React from "react";
import { Track, TrackMetadata, TrackUri } from "./tracks";
import { ArtistMetadata, ArtistUri, Artist } from "./artists";
import { AlbumMetadata, AlbumUri, Album } from "./albums";

export type PluginId = string;

export type PluginInfo = {
  /**
   * Plugin identifier that should be all lowercase with no spaces.
   */
  id: PluginId;
  /**
   * Display name for this plugin.
   */
  name: string;
  /**
   * The file name of the plugin entry point, e.g. `'main.js'`.
   *
   * The plugin creation function should be the specified file's default export.
   */
  main: string;
  /**
   * Semantic version of the plugin following the format `MAJOR.MINOR.PATCH`, e.g. `'1.0.0'`.
   */
  version?: string;
  /**
   * Version of the plugin format that this plugin uses.
   *
   * Set this to the version of the `@aria-player/types` package your plugin references to enable compatibility checks.
   */
  formatVersion?: string;
  /**
   * `true` if this plugin should only be available in the desktop version.
   */
  needsTauri?: boolean;
  /**
   * List of capabilities this plugin uses. If using multiple capabilities, intersection types can be used for the plugin implementation, e.g.
   * ```
   * createPlugin(host: SourceCallbacks & IntegrationCallbacks): SourceHandle & IntegrationHandle
   * ```
   */
  capabilities?: ("integration" | "source")[];
};

/**
 * Handle for a basic plugin.
 */
export interface BaseHandle {
  /**
   * React component that appears in the Plugin Settings page while the plugin is enabled.
   */
  Config?: React.FC<{ data: object }>;
  /**
   * Called after every update to this plugin's data.
   */
  onDataUpdate?: (data: object) => void;
  /**
   * Called when disabling this plugin to allow for cleanup of any additional resources.
   */
  dispose?: () => void;
}

export type Alert = {
  /**
   * Heading to display at the top of the alert dialog.
   */
  heading: string;
  /**
   * Message to display in the alert dialog. Can be a React component for greater control over its appearance.
   */
  message: string | React.FC;
  /**
   * Label that appears on the alert dialog close button.
   */
  closeLabel: string;
  /**
   * Called when the alert dialog close button is clicked.
   */
  onClose?: () => void;
};

/**
 * Callbacks for a basic plugin.
 */
export interface BaseCallbacks {
  /**
   * Store any plugin-related data that should be persisted between sessions.
   */
  updateData: (data: object) => void;
  /**
   * Get the current plugin data.
   */
  getData: () => object;
  /**
   * Display a dialog containing an alert, such as a plugin configuration error.
   */
  showAlert: (alert: Alert) => void;
}

/**
 * Handle for a plugin that can monitor and manage playback.
 */
export interface IntegrationHandle extends BaseHandle {
  /**
   * Called when playback of a new track is started.
   */
  onPlay?: (metadata: Track, artwork?: string) => void;
  /**
   * Called when playback is paused.
   */
  onPause?: () => void;
  /**
   * Called when playback is resumed.
   */
  onResume?: () => void;
  /**
   * Called when playback is stopped, e.g. after reaching the end of the queue.
   */
  onStop?: () => void;
}

/**
 * Callbacks for a plugin that can monitor and manage playback.
 */
export interface IntegrationCallbacks extends BaseCallbacks {
  /**
   * Pause playback.
   */
  pause: () => void;
  /**
   * Resume playback.
   */
  resume: () => void;
  /**
   * Stop playback.
   */
  stop: () => void;
  /**
   * Skip to the next track.
   */
  next: () => void;
  /**
   * Skip to the previous track, or restart the current track if more than 2 seconds have elapsed.
   */
  previous: () => void;
}

export type AttributionProps = {
  /**
   * The type of content that is being attributed.
   */
  type: "track" | "album" | "artist";
  /**
   * Whether to display a compact attribution. If `true`, the attribution should be an icon no larger than 30x30px.
   */
  compact: boolean;
  /**
   * Identifier for the attributed content, e.g. the track `uri` if the attribution type is `'track'`, or the `albumUri` if the type is `'album'`.
   */
  id?: string;
};

export type TrackAction = {
  /**
   * Localized label for this action that will be displayed in the track context menu.
   */
  label: string;
  /**
   * Whether this action is currently disabled.
   * If `true`, the action will be greyed out in the track context menu.
   */
  disabled?: boolean;
  /**
   * Called when this action is clicked.
   */
  onClick: (track: Track) => void;
};

/**
 * Handle for a plugin that provides an audio backend and can manage the user's music library.
 */
export interface SourceHandle extends BaseHandle {
  /**
   * Localized display name for this source.
   */
  displayName?: string;
  /**
   * React component that appears in the Library Settings page while the plugin is enabled.
   */
  LibraryConfig?: React.FC<{ data: object }>;
  /**
   * React component that appears in the Songs page if the user's music library is empty.
   *
   * Ideally this should consist of a single button for adding music.
   */
  QuickStart?: React.FC;
  /**
   * React component that will display whenever content from this source appears in the player.
   */
  Attribution?: React.FC<AttributionProps>;
  /**
   * Whether to disable automatic skipping to the next track after the track duration elapses.
   *
   * If set to `true`, you must always call `host.finishedPlayback` after reaching the end of a track.
   *
   * This option may be useful if track durations reported by this source are not guaranteed to be accurate.
   */
  disableAutomaticTrackSkip?: boolean;
  /**
   * Load the specified track and begin playback.
   *
   * The player status will be `Status.Loading` until this method returns, allowing for asynchronous logic.
   */
  loadAndPlayTrack: (track: Track) => Promise<void>;
  /**
   * Set the track to preload so that it can play immediately after the current track finishes.
   *
   * This will be called every time the next track in the queue changes.
   *
   * If the current track is the last in the queue or the next track is from a different source, `track` will be `null`.
   */
  setTrackToPreload?: (track: Track | null) => void;
  /**
   * Return an image URL for the specified track's artwork.
   *
   * If the track's `artworkUri` is already an image URL, this method can simply return `artworkUri`.
   */
  getTrackArtwork?: (artworkUri: string) => Promise<string | undefined>;
  /**
   * Return an image URL for the specified artist's artwork.
   *
   * If the artist's `artworkUri` is already an image URL, this method can simply return `artworkUri`.
   */
  getArtistArtwork?: (artworkUri: string) => Promise<string | undefined>;
  /**
   * Fetch all tracks for an album by its URI.
   */
  getAlbumTracks?: (uri: AlbumUri) => Promise<TrackMetadata[]>;
  /**
   * Fetch information for an artist by their URI.
   */
  getArtistInfo?: (uri: ArtistUri) => Promise<ArtistMetadata | undefined>;
  /**
   * Fetch top tracks for an artist by their URI.
   * 
   * Assumed to be in order of relevance/popularity.
   */
  getArtistTopTracks?: (
    uri: ArtistUri,
    startIndex: number,
    stopIndex: number
  ) => Promise<TrackMetadata[]>;
  /**
   * Fetch albums for an artist by their URI.
   * 
   * Assumed to be in order of most recently released.
   */
  getArtistAlbums?: (
    uri: ArtistUri,
    startIndex: number,
    stopIndex: number
  ) => Promise<AlbumMetadata[]>;
  /**
   * Search for tracks matching a query.
   */
  searchTracks?: (
    query: string,
    startIndex: number,
    stopIndex: number
  ) => Promise<TrackMetadata[]>;
  /**
   * Search for albums matching a query.
   */
  searchAlbums?: (
    query: string,
    startIndex: number,
    stopIndex: number
  ) => Promise<AlbumMetadata[]>;
  /**
   * Called after every update to this source's tracks.
   */
  onTracksUpdate?: (tracks: Track[]) => void;
  /**
   * Pause the audio backend playback.
   */
  pause: () => void;
  /**
   * Resume the audio backend playback.
   */
  resume: () => void;
  /**
   * Set the volume of the audio backend (0-100).
   */
  setVolume: (volume: number) => void;
  /**
   * Mute or unmute the audio backend.
   */
  setMuted: (muted: boolean) => void;
  /**
   * Seek to a certain time in the currently playing track, in milliseconds.
   */
  setTime: (position: number) => void;
  /**
   * Return an array of custom actions that can be performed on a track.
   */
  getCustomTrackActions?: (track: Track) => TrackAction[];
}

export type SyncProgress = {
  /**
   * The number of tracks that have been synchronized (or other metric relative to `total`) to match the external source so far.
   */
  synced: number;
  /**
   * The total number of tracks being synchronized from the external source.
   *
   * If the exact number of tracks is unknown, an alternative metric can be used, e.g. albums or API requests to complete.
   */
  total: number;
};

/**
 * Callbacks for a plugin that provides an audio backend and can manage the user's music library.
 */
export interface SourceCallbacks extends BaseCallbacks {
  /**
   * Add new tracks to the library, ignoring existing tracks.
   */
  addLibraryTracks: (metadata: TrackMetadata[]) => void;
  /**
   * Remove tracks with the specified URIs from the library.
   *
   * If `uris` is null, all tracks for this source are removed from the library.
   */
  removeLibraryTracks: (uris?: TrackUri[]) => void;
  /**
   * Add new tracks to the library and update existing tracks with new metadata.
   */
  updateLibraryTracks: (metadata: TrackMetadata[]) => void;
  /**
   * Add or update information about artists for this source.
   */
  updateArtists: (metadata: ArtistMetadata[]) => void;
  /**
   * Remove information about artists with the specified URIs.
   *
   * If `uris` is null, all artist data for this source will be removed.
   */
  removeArtists: (uris?: ArtistUri[]) => void;
  /**
   * Add or update information about albums for this source.
   */
  updateAlbums: (metadata: AlbumMetadata[]) => void;
  /**
   * Remove information about albums with the specified URIs.
   *
   * If `uris` is null, all album data for this source will be removed.
   */
  removeAlbums: (uris?: AlbumUri[]) => void;
  /**
   * Set the current progress while synchronizing the user's library to be up to date with an external source.
   *
   * A progress indicator will appear if `status` indicates that there are still tracks left to synchronize.
   */
  setSyncProgress: (status: SyncProgress) => void;
  /**
   * Signal that there is nothing more to play from the current track, regardless of the current time position.
   *
   * Depending on the repeat mode, this will either restart the current track or skip to the next track.
   */
  finishPlayback: () => void;
  /**
   * Returns all tracks for this source in the library.
   */
  getTracks: () => Track[];
  /**
   * Returns all artists for this source in the library.
   */
  getArtists: () => Artist[];
  /**
   * Returns all albums for this source in the library.
   */
  getAlbums: () => Album[];
  /**
   * Returns metadata for the track with the specified URI.
   */
  getTrackByUri: (uri: TrackUri) => Track | undefined;
  /**
   * Returns the current player volume (0-100).
   */
  getVolume: () => number;
  /**
   * Returns `true` if the player is currently muted.
   */
  getMuted: () => boolean;
}
