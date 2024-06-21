import styles from "./Footer.module.css";
import { PlaybackControls } from "./PlaybackControls";
import { useAppSelector } from "../../app/hooks";
import { AuxiliaryControls } from "./AuxiliaryControls";
import { AlbumArt } from "../views/subviews/AlbumArt";
import { useMenuActions } from "../../hooks/useMenuActions";
import { formatStringArray } from "../../app/utils";
import { selectCurrentTrack } from "../../features/currentSelectors";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();
  const metadata = useAppSelector(selectCurrentTrack);
  const currentTrack = useAppSelector(selectCurrentTrack);
  const { invokeMenuAction } = useMenuActions();

  return (
    <footer className={styles.footer}>
      <section className={styles.left}>
        <div className={styles.art}>
          <AlbumArt track={currentTrack} />
        </div>
        <div className={styles.metadata}>
          <div className={styles.metadataRow}>
            {metadata && (
              <button
                className={styles.title}
                onClick={() => {
                  if (!metadata) return;
                  invokeMenuAction("goToCurrent");
                }}
                title={t("menu.goToCurrent")}
              >
                {metadata.title}
              </button>
            )}
          </div>
          <div className={styles.metadataRow}>
            <div className={styles.artist}>
              {formatStringArray(metadata?.artist)}
            </div>
          </div>
        </div>
      </section>
      <section>
        <PlaybackControls />
      </section>
      <section className={styles.right}>
        <AuxiliaryControls />
      </section>
    </footer>
  );
}
