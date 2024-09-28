import i18n from "i18next";
import { useTranslation } from "react-i18next";
import en_us from "./locales/en_us/translation.json";
import { BaseCallbacks, BaseHandle } from "../../features/plugins/pluginsTypes";

type SamplePluginData = {
  pings: number;
};

export default function createSamplePlugin(host: BaseCallbacks): BaseHandle {
  i18n.addResourceBundle("en-US", "sampleplugin", en_us);
  console.log("Created sampleplugin with initial config: ", host.getData());

  return {
    Config(props: { data: object }) {
      const currentData = props.data as SamplePluginData;
      const { t } = useTranslation();

      return (
        <div>
          {t("sampleplugin:config.header")}
          <button
            onClick={() => {
              host.updateData({
                pings: currentData?.pings >= 0 ? currentData?.pings + 1 : 1
              });
            }}
          >
            {t("sampleplugin:config.button")}
          </button>
          {currentData?.pings ?? 0}
        </div>
      );
    },

    dispose() {
      i18n.removeResourceBundle("en-US", "sampleplugin");
      console.log("Disposed sampleplugin");
    }
  };
}
