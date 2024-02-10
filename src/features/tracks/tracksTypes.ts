import { PluginId } from "../plugins/pluginsTypes";

export type TrackId = string;
export type TrackUri = string;

export interface TrackMetadata {
  uri: TrackUri;
  title: string;
  metadataLoaded: boolean;
  duration?: number;
  artist?: string | string[];
  albumArtist?: string;
  album?: string;
  genre?: string | string[];
  composer?: string | string[];
  comments?: string | string[];
  year?: number;
  track?: number;
  disc?: number;
  fileSize?: number;
  dateModified?: number;
  dateAdded?: number;
}

export interface Track extends TrackMetadata {
  id: TrackId;
  source: PluginId;
}
