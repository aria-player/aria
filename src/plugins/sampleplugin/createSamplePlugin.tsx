import {
  PluginCallbacks,
  PluginHandle
} from "../../features/plugins/pluginsTypes";
import i18n from "i18next";
import { useTranslation } from "react-i18next";
import en_us from "./locales/en_us/translation.json";

export function createSamplePlugin(
  _config: unknown,
  host: PluginCallbacks
): PluginHandle {
  console.log("Created sampleplugin");
  i18n.addResourceBundle("en-US", "sampleplugin", en_us);

  return {
    Config() {
      const { t } = useTranslation();

      return (
        <div>
          {t("sampleplugin:config.header")}
          <button
            onClick={() => {
              host.pong("ping");
            }}
          >
            {t("sampleplugin:config.button")}
          </button>
        </div>
      );
    },

    ping(message: string) {
      console.log("Message received by sampleplugin: ", message);
    },

    dispose() {
      i18n.removeResourceBundle("en-US", "sampleplugin");
      console.log("Disposed sampleplugin");
    }
  };
}
