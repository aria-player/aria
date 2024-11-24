import { i18n } from "i18next";
import { useTranslation } from "react-i18next";

export default function QuickStart(props: {
  addFolder: () => void;
  i18n: i18n;
}) {
  const { t } = useTranslation("tauri-player", { i18n: props.i18n });

  return (
    <button className="settings-button" onClick={props.addFolder}>
      {t("quickStart")}
    </button>
  );
}
