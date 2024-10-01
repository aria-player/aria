import { i18n } from "i18next";
import { useTranslation } from "react-i18next";

export default function QuickStart(props: {
  pickDirectory: () => void;
  i18n: i18n;
}) {
  const { t } = useTranslation("webplayer", { i18n: props.i18n });

  return <button onClick={props.pickDirectory}>{t("quickStart")}</button>;
}
