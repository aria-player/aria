import {
  PluginCallbacks,
  PluginHandle
} from "../../features/plugins/pluginsTypes";
import { Config } from "./Config";

export type WebPlayerConfig = {
  folder: string;
};

export function createWebPlayer(
  initialConfig: unknown,
  host: PluginCallbacks
): PluginHandle {
  initialConfig = initialConfig as WebPlayerConfig;
  console.log("Created webplayer with initial config: ", initialConfig);
  return {
    Config: (props) => Config({ ...props, host }),
    dispose() {
      console.log("Disposed webplayer");
    }
  };
}
