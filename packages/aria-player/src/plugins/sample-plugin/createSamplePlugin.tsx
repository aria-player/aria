import { i18n } from "i18next";
import en_us from "./locales/en_us/translation.json";
import { BaseCallbacks, BaseHandle } from "../../../../types/plugins";
import { useTranslation } from "react-i18next";

type SamplePluginData = {
  pings: number;
};

export default function createSamplePlugin(
  host: BaseCallbacks,
  i18n: i18n
): BaseHandle {
  i18n.addResourceBundle("en-US", "sample-plugin", en_us);

  return {
    Config(props: { data: object }) {
      const currentData = props.data as SamplePluginData;
      const { t } = useTranslation("sample-plugin", { i18n });

      return (
        <div>
          {t("config.header")}
          <button
            className="settings-button"
            onClick={() => {
              host.updateData({
                pings: currentData?.pings >= 0 ? currentData?.pings + 1 : 1
              });
            }}
          >
            {t("config.button")}
          </button>
          {currentData?.pings ?? 0}
        </div>
      );
    },

    dispose() {
      i18n.removeResourceBundle("en-US", "sample-plugin");
    }
  };
}
