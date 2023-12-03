import {
  PluginCallbacks,
  PluginHandle
} from "../../features/plugins/pluginsTypes";

export function createSamplePlugin(
  _config: unknown,
  host: PluginCallbacks
): PluginHandle {
  console.log("Created sampleplugin");

  return {
    Config() {
      return (
        <div>
          Sample Plugin
          <button
            onClick={() => {
              host.pong("ping");
            }}
          >
            Send message to app
          </button>
        </div>
      );
    },

    ping(message: string) {
      console.log("Message received by sampleplugin: ", message);
    },

    dispose() {
      console.log("Disposed sampleplugin");
    }
  };
}
