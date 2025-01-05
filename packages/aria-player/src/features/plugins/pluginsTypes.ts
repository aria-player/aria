import {
  BaseHandle,
  IntegrationHandle,
  SourceHandle
} from "../../../../types/plugins";

export type AnyPluginHandle = BaseHandle & IntegrationHandle & SourceHandle;
