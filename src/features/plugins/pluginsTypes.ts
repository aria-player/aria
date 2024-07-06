import { Track, TrackMetadata, TrackUri } from "../tracks/tracksTypes";

export type PluginId = string;

export type PluginInfo<H, C> = {
  id: PluginId;
  type: "base" | "integration" | "source";
  name: string;
  needsTauri: boolean;
  create: (callbacks: C) => H;
};

export interface BaseHandle {
  Config?: React.FC<{ data: object }>;
  onDataUpdate?: (data: object) => void;
  dispose: () => void;
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

export interface SourceHandle extends IntegrationHandle {
  loadAndPlayTrack: (track: Track) => void;
  getTrackArtwork?: (track: Track) => Promise<string | undefined>;
  onTracksUpdate?: (tracks: Track[]) => void;
  pause: () => void;
  resume: () => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setTime: (position: number) => void;
}

export interface SourceCallbacks extends IntegrationCallbacks {
  addTracks: (metadata: TrackMetadata[]) => void;
  removeTracks: (uris?: TrackUri[]) => void;
  updateMetadata: (metadata: TrackMetadata[]) => void;
  getTracks: () => Track[];
  getTrackByUri: (uri: TrackUri) => Track | undefined;
  getVolume: () => number;
  getMuted: () => boolean;
}

export type BasePlugin = PluginInfo<BaseHandle, BaseCallbacks>;
export type IntegrationPlugin = PluginInfo<
  IntegrationHandle,
  IntegrationCallbacks
>;
export type SourcePlugin = PluginInfo<SourceHandle, SourceCallbacks>;

export type PluginHandle = BaseHandle | IntegrationHandle | SourceHandle;
export type PluginCallbacks =
  | BaseCallbacks
  | IntegrationHandle
  | SourceCallbacks;

export type Plugin = BasePlugin | IntegrationPlugin | SourcePlugin;
