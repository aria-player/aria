export type PluginId = string;

export type Plugin<PluginHandle, PluginCallbacks> = {
  id: PluginId;
  name: string;
  needsTauri: boolean;
  create: (initialConfig: unknown, callbacks: PluginCallbacks) => PluginHandle;
};

export type PluginHandle = {
  Config?: () => React.ReactNode;
  dispose: () => void;

  ping?: (message: string) => void;
};

export type PluginCallbacks = {
  pong: (message: string) => void;
};
