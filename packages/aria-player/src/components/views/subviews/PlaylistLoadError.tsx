import { useTranslation } from "react-i18next";
import styles from "./PlaylistLoadError.module.css";

export default function PlaylistLoadError({
  onRetry,
}: {
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className={styles.container}>
      <p className={styles.message}>{t("tracks.playlistLoadError")}</p>
      <button className={styles.retry} onClick={onRetry}>
        {t("tracks.retry")}
      </button>
    </div>
  );
}
