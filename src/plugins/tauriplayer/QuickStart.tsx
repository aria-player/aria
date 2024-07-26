import { useTranslation } from "react-i18next";

export default function QuickStart(props: { handleButtonClick: () => void }) {
  const { t } = useTranslation();

  return (
    <button onClick={props.handleButtonClick}>
      {t("tauriplayer:quickStart")}
    </button>
  );
}
