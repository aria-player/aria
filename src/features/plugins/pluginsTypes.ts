import { Track, TrackMetadata, TrackUri } from "../tracks/tracksTypes";

export type PluginId = string;

export type PluginInfo = {
  id: PluginId;
  name: string;
  needsTauri: boolean;
  main: string;
  capabilities?: ("integration" | "source")[];
};

export interface BaseHandle {
  Config?: React.FC<{ data: object }>;
  onDataUpdate?: (data: object) => void;
  dispose?: () => void;
}

export interface BaseCallbacks {
  updateData: (data: object) => void;
  getData: () => object;
}

export interface IntegrationHandle extends BaseHandle {
  onPlay?: (metadata: Track, artwork?: string) => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
}

export interface IntegrationCallbacks extends BaseCallbacks {
  pause: () => void;
  resume: () => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
}

export interface SourceHandle extends BaseHandle {
  displayName?: string;
  LibraryConfig?: React.FC<{ data: object }>;
  QuickStart?: React.FC;
  loadAndPlayTrack: (track: Track) => void;
  getTrackArtwork?: (track: Track) => Promise<string | undefined>;
  onTracksUpdate?: (tracks: Track[]) => void;
  pause: () => void;
  resume: () => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setTime: (position: number) => void;
}

export interface SourceCallbacks extends BaseCallbacks {
  addTracks: (metadata: TrackMetadata[]) => void;
  removeTracks: (uris?: TrackUri[]) => void;
  updateMetadata: (metadata: TrackMetadata[]) => void;
  getTracks: () => Track[];
  getTrackByUri: (uri: TrackUri) => Track | undefined;
  getVolume: () => number;
  getMuted: () => boolean;
}

export type AnyPluginHandle = BaseHandle & IntegrationHandle & SourceHandle;
