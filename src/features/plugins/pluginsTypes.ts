export type PluginId = string;

export type Plugin<PluginHandle, PluginCallbacks> = {
  id: PluginId;
  name: string;
  needsTauri: boolean;
  create: (initialConfig: unknown, callbacks: PluginCallbacks) => PluginHandle;
};

export type PluginHandle = {
  Config?: React.FC<{ config: unknown }>;
  dispose: () => void;

  ping?: (message: string) => void;
};

export type PluginCallbacks = {
  pong: (message: string) => void;
  updateConfig: (config: unknown) => void;
};
