import { useTranslation } from "react-i18next";

export default function QuickStart(props: { addFolder: () => void }) {
  const { t } = useTranslation();

  return (
    <button onClick={props.addFolder}>{t("tauriplayer:quickStart")}</button>
  );
}
