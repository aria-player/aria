import { useContext, useEffect, useState } from "react";
import MusicIcon from "../../../assets/music.svg";
import { Track } from "../../../features/tracks/tracksTypes";
import styles from "./AlbumArt.module.css";
import { ArtworkContext } from "../../../contexts/ArtworkContext";
import { pluginHandles } from "../../../features/plugins/pluginsSlice";
import { SourceHandle } from "../../../features/plugins/pluginsTypes";

export const AlbumArt = ({ track }: { track: Track | null }) => {
  const { artworkCache } = useContext(ArtworkContext);
  const [artwork, setArtwork] = useState(MusicIcon);
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
          setArtwork(coverArtData || MusicIcon);
        });
    } else {
      setArtwork(MusicIcon);
    }
  }, [artworkCache, track]);

  const displayedArtwork =
    (track && track?.artworkUri && artworkCache[track.artworkUri]) ??
    artwork ??
    MusicIcon;

  return (
    <img className={styles.artwork} src={displayedArtwork} alt={track?.album} />
  );
};
