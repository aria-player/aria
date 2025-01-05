import styles from "./Footer.module.css";
import { PlaybackControls } from "./PlaybackControls";
import { useAppSelector } from "../../app/hooks";
import { AuxiliaryControls } from "./AuxiliaryControls";
import { AlbumArt } from "../views/subviews/AlbumArt";
import { useMenuActions } from "../../hooks/useMenuActions";
import { formatStringArray } from "../../app/utils";
import { selectCurrentTrack } from "../../features/currentSelectors";
import { useTranslation } from "react-i18next";
import { TriggerEvent, useContextMenu } from "react-contexify";
import { useContext } from "react";
import { MenuContext } from "../../contexts/MenuContext";
import { getSourceHandle } from "../../features/plugins/pluginsSlice";

export function Footer() {
  const { t } = useTranslation();
  const metadata = useAppSelector(selectCurrentTrack);
  const currentTrack = useAppSelector(selectCurrentTrack);
  const { invokeMenuAction } = useMenuActions();
  const { setMenuData } = useContext(MenuContext);
  const { show: showTrackContextMenu } = useContextMenu({
    id: "track"
  });
  const pluginHandle = metadata && getSourceHandle(metadata?.source);
  const displayAttribution = pluginHandle?.Attribution != null;

  return (
    <footer className={`footer ${styles.footer}`}>
      <section className={styles.left}>
        <div className={`footer-art ${styles.art}`}>
          <AlbumArt track={currentTrack} />
        </div>
        <div
          className={`${styles.metadata} ${displayAttribution ? styles.compact : ""}`}
        >
          <div className={styles.metadataRow}>
            {metadata && (
              <button
                className={`footer-title ${styles.title}`}
                onClick={() => {
                  if (!metadata) return;
                  invokeMenuAction("goToCurrent");
                }}
                onContextMenu={(event) => {
                  setMenuData({
                    itemId: metadata.itemId,
                    itemSource: undefined,
                    itemIndex: undefined,
                    metadata: metadata,
                    type: "track"
                  });
                  showTrackContextMenu({ event: event as TriggerEvent });
                }}
                title={t("menu.goToCurrent")}
              >
                {metadata.title}
              </button>
            )}
          </div>
          <div className={styles.metadataRow}>
            <div className={`footer-artist ${styles.artist}`}>
              {formatStringArray(metadata?.artist)}
            </div>
          </div>
          {metadata && pluginHandle?.Attribution && (
            <div className={styles.metadataRow}>
              <pluginHandle.Attribution
                type="track"
                id={metadata.uri}
                compact={false}
              />
            </div>
          )}
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
