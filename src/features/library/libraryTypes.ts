import { PluginId } from "../plugins/pluginsTypes";

export type TrackId = string;
export type TrackUri = string;

export interface TrackMetadata {
  uri: TrackUri;
  title: string;
  metadataloaded: boolean;
  duration?: number;
  artist?: string | string[];
  albumartist?: string;
  album?: string;
  genre?: string | string[];
  composer?: string | string[];
  comments?: string | string[];
  year?: number;
  track?: number;
  disc?: number;
  filesize?: number;
  datemodified?: number;
}

export interface Track extends TrackMetadata {
  id: TrackId;
  source: PluginId;
}
