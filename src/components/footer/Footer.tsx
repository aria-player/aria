import styles from "./Footer.module.css";
import MusicIcon from "../../assets/music.svg";
import { PlaybackControls } from "./PlaybackControls";
import { useAppSelector } from "../../app/hooks";
import { selectCurrentTrack } from "../../features/sharedSelectors";
import { AuxiliaryControls } from "./AuxiliaryControls";
import { useEffect, useState } from "react";
import { pluginHandles } from "../../features/plugins/pluginsSlice";
import { SourceHandle } from "../../features/plugins/pluginsTypes";

export function Footer() {
  const metadata = useAppSelector(selectCurrentTrack);
  const currentTrack = useAppSelector(selectCurrentTrack);
  const [coverArtUrl, setCoverArtUrl] = useState(MusicIcon);

  useEffect(() => {
    if (
      currentTrack &&
      currentTrack.artworkUri &&
      (pluginHandles[currentTrack.source] as SourceHandle).getTrackArtwork !=
        undefined
    ) {
      (pluginHandles[currentTrack.source] as SourceHandle).getTrackArtwork!(
        currentTrack
      ).then((coverArtData) => {
        setCoverArtUrl(coverArtData || MusicIcon);
      });
    } else {
      setCoverArtUrl(MusicIcon);
    }
  }, [currentTrack]);

  return (
    <footer className={styles.footer}>
      <section className={styles.left}>
        <img src={coverArtUrl} className={styles.art} />
        <div className={styles.metadata}>
          <div className={styles.title}>{metadata?.title}</div>
          <div className={styles.artist}>{metadata?.artist}</div>
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
