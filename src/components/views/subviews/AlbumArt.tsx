import { useContext, useEffect, useState } from "react";
import MusicIcon from "../../../assets/music.svg?react";
import { Track } from "../../../features/tracks/tracksTypes";
import styles from "./AlbumArt.module.css";
import { ArtworkContext } from "../../../contexts/ArtworkContext";
import { pluginHandles } from "../../../features/plugins/pluginsSlice";
import { SourceHandle } from "../../../features/plugins/pluginsTypes";

export const AlbumArt = ({ track }: { track: Track | null }) => {
  const { artworkCache } = useContext(ArtworkContext);
  const [artwork, setArtwork] = useState<string | null>(null);
  useEffect(() => {
    if (track && track.artworkUri && artworkCache[track.artworkUri]) return;
    if (
      track &&
      (pluginHandles[track.source] as SourceHandle)?.getTrackArtwork !=
        undefined
    ) {
      (pluginHandles[track.source] as SourceHandle)
        .getTrackArtwork?.(track)
        .then((coverArtData) => {
          setArtwork(coverArtData ?? null);
        });
    } else {
      setArtwork(null);
    }
  }, [artworkCache, track]);

  const displayedArtwork =
    (track && track?.artworkUri && artworkCache[track.artworkUri]) ?? artwork;

  return displayedArtwork ? (
    <img className={styles.artwork} src={displayedArtwork} alt={track?.album} />
  ) : (
    <MusicIcon className={styles.artwork} title={track?.album} />
  );
};
