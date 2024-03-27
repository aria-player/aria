import { PlaylistItem } from "../playlists/playlistsTypes";

export enum Status {
  Stopped,
  Loading,
  Playing,
  Paused
}

export enum RepeatMode {
  Off,
  All,
  One
}

export type QueueItem = PlaylistItem & {
  stray?: boolean;
};
