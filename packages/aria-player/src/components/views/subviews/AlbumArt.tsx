import { useContext, useEffect, useState } from "react";
import MusicIcon from "../../../assets/music.svg?react";
import { Track } from "../../../../../types/tracks";
import styles from "./AlbumArt.module.css";
import { ArtworkContext } from "../../../contexts/ArtworkContext";
import { getSourceHandle } from "../../../features/plugins/pluginsSlice";

export const AlbumArt = ({ track }: { track: Track | null }) => {
  const { artworkCache } = useContext(ArtworkContext);
  const [artwork, setArtwork] = useState<string | null>(null);
  useEffect(() => {
    if (track && track.artworkUri && artworkCache[track.artworkUri]) return;
    if (track && getSourceHandle(track.source)?.getTrackArtwork != undefined) {
      getSourceHandle(track.source)
        ?.getTrackArtwork?.(track)
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
    <img
      className={`album-art ${styles.artwork}`}
      src={displayedArtwork}
      alt={track?.album}
    />
  ) : (
    <MusicIcon className={`album-art ${styles.artwork}`} title={track?.album} />
  );
};
