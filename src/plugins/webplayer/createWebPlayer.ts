import {
  SourceCallbacks,
  SourceHandle
} from "../../features/plugins/pluginsTypes";
import { Config } from "./Config";

export type WebPlayerConfig = {
  folder: string;
};

export function createWebPlayer(
  initialConfig: unknown,
  host: SourceCallbacks
): SourceHandle {
  initialConfig = initialConfig as WebPlayerConfig;
  console.log("Created webplayer with initial config: ", initialConfig);
  return {
    Config: (props) => Config({ ...props, host }),
    temp: () => {
      host.temp();
    },
    dispose() {
      console.log("Disposed webplayer");
    }
  };
}
