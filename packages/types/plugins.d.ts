import * as React from "react";
import { Track, TrackMetadata, TrackUri } from "./tracks";

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
   * `true` if this plugin should only be available in the desktop version.
   */
  needsTauri: boolean;
  /**
   * The file name of the plugin entry point, e.g. `'main.js'`.
   *
   * The plugin creation function should be the specified file's default export.
   */
  main: string;
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
  type: "track" | "album";
  /**
   * Whether to display a compact attribution. If `true`, the attribution should be an icon no larger than 30x30px.
   */
  compact: boolean;
  /**
   * Identifier for the attributed content (the track `uri` if the attribution type is `'track'`, or the `albumId` if the type is `'album'`).
   */
  id?: string;
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
   * Load the specified track and begin playback.
   *
   * The player status will be `Status.Loading` until this method returns, allowing for asynchronous logic.
   */
  loadAndPlayTrack: (track: Track) => void;
  /**
   * Return an image URL for the specified track's album artwork.
   *
   * If the track's `artworkUri` is already an image URL, this method can simply return `track.artworkUri`.
   */
  getTrackArtwork?: (track: Track) => Promise<string | undefined>;
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
  addTracks: (metadata: TrackMetadata[]) => void;
  /**
   * Remove tracks with the specified URIs from the library.
   *
   * If `uris` is null, all tracks for this source are removed from the library.
   */
  removeTracks: (uris?: TrackUri[]) => void;
  /**
   * Add new tracks to the library and update existing tracks with new metadata.
   */
  updateTracks: (metadata: TrackMetadata[]) => void;
  /**
   * Set the current progress while synchronizing the user's library to be up to date with an external source.
   *
   * A progress indicator will appear if `status` indicates that there are still tracks left to synchronize.
   */
  setSyncProgress: (status: SyncProgress) => void;
  /**
   * Returns all tracks for this source in the library.
   */
  getTracks: () => Track[];
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
