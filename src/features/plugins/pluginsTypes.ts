import { TrackMetadata, TrackUri } from "../library/libraryTypes";

export type PluginId = string;

export type PluginInfo<H, C> = {
  id: PluginId;
  type: "base" | "source";
  name: string;
  needsTauri: boolean;
  create: (initialConfig: unknown, callbacks: C) => H;
};

export interface BaseHandle {
  Config?: React.FC<{ config: unknown }>;
  dispose: () => void;
}

export interface BaseCallbacks {
  updateConfig: (config: unknown) => void;
}

export interface SourceHandle extends BaseHandle {
  loadAndPlayTrack: (uri: TrackUri) => void;
}

export interface SourceCallbacks extends BaseCallbacks {
  addTracks: (metadata: TrackMetadata[]) => void;
  removeTracks: (uris?: TrackUri[]) => void;
  updateMetadata: (metadata: TrackMetadata[]) => void;
}

export type BasePlugin = PluginInfo<BaseHandle, BaseCallbacks>;
export type SourcePlugin = PluginInfo<SourceHandle, SourceCallbacks>;

export type PluginHandle = BaseHandle | SourceHandle;
export type PluginCallbacks = BaseCallbacks | SourceCallbacks;

export type Plugin = BasePlugin | SourcePlugin;
