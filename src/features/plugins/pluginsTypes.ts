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
};

export type PluginCallbacks = {
  updateConfig: (config: unknown) => void;
};
