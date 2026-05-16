import {
  BaseHandle,
  IntegrationHandle,
  ExternalPlaylistsHandle,
  SourceHandle,
} from "../../../../types/plugins";

export type AnyPluginHandle = BaseHandle &
  IntegrationHandle &
  SourceHandle &
  ExternalPlaylistsHandle;
