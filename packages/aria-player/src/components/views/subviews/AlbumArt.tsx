import { useContext, useEffect, useState } from "react";
import MusicIcon from "../../../assets/music.svg?react";
import { Track } from "../../../../../types/tracks";
import styles from "./AlbumArt.module.css";
import { ArtworkContext } from "../../../contexts/ArtworkContext";
import { getSourceHandle } from "../../../features/plugins/pluginsSlice";
import { AlbumDetails } from "../../../features/albums/albumsTypes";

export const AlbumArt = ({
  track,
  album
}: {
  track?: Track;
  album?: AlbumDetails;
}) => {
  const { artworkCache } = useContext(ArtworkContext);
  const [artwork, setArtwork] = useState<string | null>(null);

  useEffect(() => {
    const item = track ?? album;
    if (item != undefined) {
      if (item.artworkUri && artworkCache[item.artworkUri]) {
        setArtwork(artworkCache[item.artworkUri]);
        return;
      }
      if (
        item.artworkUri &&
        getSourceHandle(item.source)?.getTrackArtwork != undefined
      ) {
        getSourceHandle(item.source)
          ?.getTrackArtwork?.(item.artworkUri)
          .then((coverArtData) => {
            setArtwork(coverArtData ?? null);
            return;
          });
      }
    }
    setArtwork(null);
  }, [artworkCache, track, album]);

  return artwork ? (
    <img
      className={`album-art ${styles.artwork}`}
      src={artwork}
      alt={track?.album ?? album?.name}
    />
  ) : (
    <MusicIcon
      className={`album-art ${styles.artwork}`}
      title={track?.album ?? album?.name}
    />
  );
};
