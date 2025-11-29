import { useContext, useEffect, useMemo, useState } from "react";
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
  const [fetchedArtwork, setFetchedArtwork] = useState<string | null>(null);

  const item = track ?? album;
  const artworkUri = item?.artworkUri;
  const source = item?.source;

  const artwork = useMemo(() => {
    if (artworkUri) {
      return artworkCache[artworkUri] || fetchedArtwork;
    }
    return null;
  }, [artworkUri, artworkCache, fetchedArtwork]);

  useEffect(() => {
    if (!artworkUri || !source) {
      setFetchedArtwork(null);
      return;
    }
    if (artworkCache[artworkUri]) {
      return;
    }
    const handle = getSourceHandle(source);
    if (handle?.getTrackArtwork) {
      handle.getTrackArtwork(artworkUri).then((coverArtData) => {
        if (coverArtData) {
          setFetchedArtwork(coverArtData);
        }
      });
    }
  }, [artworkUri, source, artworkCache]);

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
