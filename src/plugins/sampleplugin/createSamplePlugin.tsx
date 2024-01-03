import i18n from "i18next";
import { useTranslation } from "react-i18next";
import en_us from "./locales/en_us/translation.json";
import { BaseCallbacks, BaseHandle } from "../../features/plugins/pluginsTypes";

type SamplePluginConfig = {
  pings: number;
};

export function createSamplePlugin(host: BaseCallbacks): BaseHandle {
  const initialConfig = host.getConfig() as SamplePluginConfig | null;
  i18n.addResourceBundle("en-US", "sampleplugin", en_us);
  console.log("Created sampleplugin with initial config: ", initialConfig);

  return {
    Config(props: { config: unknown }) {
      const currentConfig = props.config as SamplePluginConfig;
      const { t } = useTranslation();

      return (
        <div>
          {t("sampleplugin:config.header")}
          <button
            onClick={() => {
              host.updateConfig({
                pings: currentConfig?.pings >= 0 ? currentConfig?.pings + 1 : 1
              });
            }}
          >
            {t("sampleplugin:config.button")}
          </button>
          {currentConfig?.pings ?? 0}
        </div>
      );
    },

    dispose() {
      i18n.removeResourceBundle("en-US", "sampleplugin");
      console.log("Disposed sampleplugin");
    }
  };
}
