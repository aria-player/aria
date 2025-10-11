import { useContext, useEffect, useState } from "react";
import MusicIcon from "../../../assets/music.svg?react";
import { Track } from "../../../../../types/tracks";
import styles from "./AlbumArt.module.css";
import { ArtworkContext } from "../../../contexts/ArtworkContext";
import { getSourceHandle } from "../../../features/plugins/pluginsSlice";

export const AlbumArt = ({
  track,
  altText
}: {
  track: Track | null;
  altText?: string;
}) => {
  const { artworkCache } = useContext(ArtworkContext);
  const [artwork, setArtwork] = useState<string | null>(null);
  useEffect(() => {
    if (track && track.artworkUri && artworkCache[track.artworkUri]) {
      setArtwork(artworkCache[track.artworkUri]);
      return;
    }
    if (
      track &&
      track.artworkUri &&
      getSourceHandle(track.source)?.getTrackArtwork != undefined
    ) {
      getSourceHandle(track.source)
        ?.getTrackArtwork?.(track.artworkUri)
        .then((coverArtData) => {
          setArtwork(coverArtData ?? null);
        });
    } else {
      setArtwork(null);
    }
  }, [artworkCache, track]);

  return artwork ? (
    <img
      className={`album-art ${styles.artwork}`}
      src={artwork}
      alt={altText || track?.album}
    />
  ) : (
    <MusicIcon
      className={`album-art ${styles.artwork}`}
      title={altText || track?.album}
    />
  );
};
