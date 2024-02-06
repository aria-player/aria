import { Track, TrackMetadata, TrackUri } from "../tracks/tracksTypes";

export type PluginId = string;

export type PluginInfo<H, C> = {
  id: PluginId;
  type: "base" | "source";
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

export interface SourceHandle extends BaseHandle {
  loadAndPlayTrack: (track: Track) => void;
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

export type BasePlugin = PluginInfo<BaseHandle, BaseCallbacks>;
export type SourcePlugin = PluginInfo<SourceHandle, SourceCallbacks>;

export type PluginHandle = BaseHandle | SourceHandle;
export type PluginCallbacks = BaseCallbacks | SourceCallbacks;

export type Plugin = BasePlugin | SourcePlugin;
