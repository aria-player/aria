import { useTranslation } from "react-i18next";

export default function QuickStart(props: { pickDirectory: () => void }) {
  const { t } = useTranslation();

  return (
    <button onClick={props.pickDirectory}>{t("webplayer:quickStart")}</button>
  );
}
