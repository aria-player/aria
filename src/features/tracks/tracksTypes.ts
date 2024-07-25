import { PluginId } from "../plugins/pluginsTypes";

export type TrackId = string;
export type AlbumId = string;
export type TrackUri = string;

export interface TrackMetadata {
  uri: TrackUri;
  title: string;
  metadataLoaded: boolean;
  dateAdded: number;
  dateModified?: number;
  duration?: number;
  artist?: string | string[];
  albumArtist?: string;
  album?: string;
  albumId?: string;
  genre?: string | string[];
  composer?: string | string[];
  comments?: string | string[];
  year?: number;
  track?: number;
  disc?: number;
  filePath?: string;
  fileFolder?: string;
  fileSize?: number;
  artworkUri?: string;
}

export interface Track extends TrackMetadata {
  trackId: TrackId;
  source: PluginId;
}

export interface TrackListItem extends Track {
  itemId: string;
}
