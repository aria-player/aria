import { useEffect, useState } from "react";
import MusicIcon from "../assets/music.svg";
import { pluginHandles } from "../features/plugins/pluginsSlice";
import { SourceHandle } from "../features/plugins/pluginsTypes";
import { Track } from "../features/tracks/tracksTypes";
import styles from "./AlbumArt.module.css";

export const AlbumArt = ({ track }: { track: Track | null }) => {
  const [artworkUrl, setArtworkUrl] = useState(MusicIcon);
  useEffect(() => {
    if (
      track &&
      (pluginHandles[track.source] as SourceHandle)?.getTrackArtwork !=
        undefined
    ) {
      (pluginHandles[track.source] as SourceHandle)
        .getTrackArtwork?.(track)
        .then((coverArtData) => {
          setArtworkUrl(coverArtData || MusicIcon);
        });
    } else {
      setArtworkUrl(MusicIcon);
    }
  }, [track]);

  return <img className={styles.artwork} src={artworkUrl} alt={track?.album} />;
};
